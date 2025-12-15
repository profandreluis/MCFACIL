import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Plus, Save, X } from "lucide-react";
import StudentModal from "../components/StudentModal";

interface Student {
  id: number;
  name: string;
  status: string;
  number: number;
  phone?: string;
  profile_photo_url?: string;
  life_project?: string;
  youth_club_semester_1?: string;
  youth_club_semester_2?: string;
  elective_semester_1?: string;
  elective_semester_2?: string;
  tutor_teacher?: string;
  guardian_1?: string;
  guardian_2?: string;
}

interface Activity {
  id: number;
  name: string;
  max_score: number;
  weight: number;
  order_index: number;
}

interface Grade {
  id: number;
  student_id: number;
  activity_id: number;
  score: number | null;
}

interface ClassData {
  class: {
    id: number;
    name: string;
    school_year: string;
  };
  students: Student[];
  activities: Activity[];
  grades: Grade[];
}

export default function ClassDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<ClassData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingGrade, setEditingGrade] = useState<{
    studentId: number;
    activityId: number;
  } | null>(null);
  const [gradeValue, setGradeValue] = useState("");
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isAddingStudent, setIsAddingStudent] = useState(false);

  useEffect(() => {
    fetchClassData();
  }, [fetchClassData]);

  const fetchClassData = useCallback(async () => {
    try {
      const response = await fetch(`/api/classes/${id}`);
      const classData = await response.json();
      setData(classData);
    } catch (error) {
      console.error("Error fetching class data:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const getGrade = (studentId: number, activityId: number): number | null => {
    if (!data) return null;
    const grade = data.grades.find(
      (g) => g.student_id === studentId && g.activity_id === activityId
    );
    return grade?.score ?? null;
  };

  const calculateWeightedScore = (studentId: number): number => {
    if (!data) return 0;
    let total = 0;
    data.activities.forEach((activity) => {
      const grade = getGrade(studentId, activity.id);
      if (grade !== null) {
        const normalized = (grade / activity.max_score) * 10;
        total += normalized * activity.weight;
      }
    });
    return Math.round(total * 10) / 10;
  };

  const handleGradeClick = (studentId: number, activityId: number) => {
    const currentGrade = getGrade(studentId, activityId);
    setEditingGrade({ studentId, activityId });
    setGradeValue(currentGrade !== null ? currentGrade.toString() : "");
  };

  const handleSaveGrade = async () => {
    if (!editingGrade) return;
    
    const score = gradeValue === "" ? null : parseFloat(gradeValue);
    
    try {
      await fetch("/api/grades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: editingGrade.studentId,
          activity_id: editingGrade.activityId,
          score,
        }),
      });
      
      await fetchClassData();
      setEditingGrade(null);
      setGradeValue("");
    } catch (error) {
      console.error("Error saving grade:", error);
    }
  };

  const handleAddStudent = () => {
    setIsAddingStudent(true);
    setEditingStudent({
      id: 0,
      name: "",
      status: "Ativo",
      number: 0,
    });
  };

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setIsAddingStudent(false);
  };

  const handleSaveStudent = async (studentData: Partial<Student>) => {
    try {
      if (isAddingStudent) {
        await fetch("/api/students", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            class_id: parseInt(id!),
            ...studentData,
            number: studentData.number ? parseInt(studentData.number) : null,
          }),
        });
      } else {
        await fetch(`/api/students/${editingStudent!.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...studentData,
            number: studentData.number ? parseInt(studentData.number) : null,
          }),
        });
      }
      
      await fetchClassData();
      setEditingStudent(null);
      setIsAddingStudent(false);
    } catch (error) {
      console.error("Error saving student:", error);
    }
  };

  const handleAddActivity = async () => {
    const name = prompt("Nome da atividade:");
    if (!name) return;
    
    const maxScore = prompt("Nota máxima:", "10");
    if (!maxScore) return;
    
    const weight = prompt("Peso (0-1):", "0.1");
    if (!weight) return;
    
    try {
      await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          class_id: parseInt(id!),
          name,
          max_score: parseFloat(maxScore),
          weight: parseFloat(weight),
        }),
      });
      
      fetchClassData();
    } catch (error) {
      console.error("Error adding activity:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Carregando...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Turma não encontrada</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                {data.class.name}
              </h1>
              {data.class.school_year && (
                <p className="text-lg text-gray-600">
                  Ano Letivo: {data.class.school_year}
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleAddActivity}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all shadow-md"
              >
                <Plus className="w-4 h-4" />
                Atividade
              </button>
              <button
                onClick={handleAddStudent}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-md"
              >
                <Plus className="w-4 h-4" />
                Aluno
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                <tr>
                  <th className="px-4 py-4 text-left font-semibold sticky left-0 bg-indigo-600 z-10">
                    Nº
                  </th>
                  <th className="px-4 py-4 text-left font-semibold sticky left-12 bg-indigo-600 z-10">
                    Aluno
                  </th>
                  <th className="px-4 py-4 text-left font-semibold">Status</th>
                  {data.activities.map((activity) => (
                    <th
                      key={activity.id}
                      className="px-4 py-4 text-center font-semibold min-w-[120px]"
                    >
                      <div className="text-sm">{activity.name}</div>
                      <div className="text-xs opacity-80 mt-1">
                        Max: {activity.max_score} | Peso: {activity.weight}
                      </div>
                    </th>
                  ))}
                  <th className="px-4 py-4 text-center font-semibold bg-purple-700">
                    Nota Final
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.students.map((student, idx) => (
                  <tr
                    key={student.id}
                    className={`border-b hover:bg-indigo-50 transition-colors ${
                      idx % 2 === 0 ? "bg-gray-50" : "bg-white"
                    }`}
                  >
                    <td className="px-4 py-3 sticky left-0 bg-inherit z-10 font-medium">
                      {student.number || "-"}
                    </td>
                    <td className="px-4 py-3 sticky left-12 bg-inherit z-10 font-medium">
                      <button
                        onClick={() => handleEditStudent(student)}
                        className="flex items-center gap-3 text-left hover:text-indigo-600 transition-colors"
                      >
                        {student.profile_photo_url ? (
                          <img
                            src={student.profile_photo_url}
                            alt={student.name}
                            className="w-8 h-8 rounded-full object-cover border-2 border-indigo-100"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                            <span className="text-xs font-semibold text-indigo-600">
                              {student.name.charAt(0)}
                            </span>
                          </div>
                        )}
                        <span>{student.name}</span>
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                          student.status === "Ativo"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {student.status}
                      </span>
                    </td>
                    {data.activities.map((activity) => {
                      const grade = getGrade(student.id, activity.id);
                      const isEditing =
                        editingGrade?.studentId === student.id &&
                        editingGrade?.activityId === activity.id;

                      return (
                        <td
                          key={activity.id}
                          className="px-4 py-3 text-center"
                        >
                          {isEditing ? (
                            <div className="flex items-center gap-2 justify-center">
                              <input
                                type="number"
                                value={gradeValue}
                                onChange={(e) => setGradeValue(e.target.value)}
                                className="w-20 px-2 py-1 border rounded text-center"
                                step="0.1"
                                autoFocus
                              />
                              <button
                                onClick={handleSaveGrade}
                                className="p-1 text-green-600 hover:bg-green-100 rounded"
                              >
                                <Save className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditingGrade(null)}
                                className="p-1 text-red-600 hover:bg-red-100 rounded"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() =>
                                handleGradeClick(student.id, activity.id)
                              }
                              className="px-3 py-1 rounded-lg hover:bg-indigo-100 transition-colors min-w-[60px]"
                            >
                              {grade !== null ? grade : "-"}
                            </button>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-center font-bold text-lg bg-purple-50">
                      {calculateWeightedScore(student.id).toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {data.students.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Nenhum aluno cadastrado. Clique em "Adicionar Aluno" para começar.
          </div>
        )}

        {editingStudent && (
          <StudentModal
            student={editingStudent}
            onClose={() => {
              setEditingStudent(null);
              setIsAddingStudent(false);
            }}
            onSave={handleSaveStudent}
          />
        )}
      </div>
    </div>
  );
}
