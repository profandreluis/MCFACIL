import { useState, useEffect } from "react";
import { Plus, User, Edit2 } from "lucide-react";
import TeacherModal from "../components/TeacherModal";

interface Teacher {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  profile_photo_url?: string;
  subjects?: string[];
  yearly_goals?: string[];
}

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Teacher | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const res = await fetch("/api/teachers");
      const data = await res.json();
      setTeachers(data);
    } catch (error) {
      console.error("Error fetching teachers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setIsAdding(true);
    setEditing({ id: 0, name: "" } as Teacher);
  };

  const handleEdit = (t: Teacher) => {
    setEditing(t);
    setIsAdding(false);
  };

  const handleSave = async (teacherData: Partial<Teacher>) => {
    try {
      if (isAdding) {
        await fetch("/api/teachers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(teacherData),
        });
      } else {
        await fetch(`/api/teachers/${editing!.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(teacherData),
        });
      }

      await fetchTeachers();
      setEditing(null);
      setIsAdding(false);
    } catch (error) {
      console.error("Error saving teacher:", error);
    }
  };

  if (loading) return <div className="p-8">Carregando...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3"><User className="w-8 h-8 text-indigo-600" /> Professores</h1>
          <div>
            <button onClick={handleAdd} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg"> <Plus className="w-4 h-4" /> Novo Professor</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teachers.map((t) => (
            <div key={t.id} className="bg-white rounded-2xl p-6 shadow hover:shadow-lg transition">
              <div className="flex items-center gap-4">
                {t.profile_photo_url ? (
                  <img src={t.profile_photo_url} alt={t.name} className="w-16 h-16 rounded-full object-cover" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-semibold">{t.name?.charAt(0)}</div>
                )}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{t.name}</h3>
                    <button onClick={() => handleEdit(t)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded"><Edit2 className="w-4 h-4" /></button>
                  </div>
                  {t.email && <div className="text-sm text-gray-600">{t.email}</div>}
                  {t.phone && <div className="text-sm text-gray-600">{t.phone}</div>}
                  {t.subjects && t.subjects.length > 0 && (
                    <div className="mt-3 text-sm text-gray-700">Disciplinas: {t.subjects.join(", ")}</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {editing && (
          <TeacherModal
            teacher={editing}
            onClose={() => { setEditing(null); setIsAdding(false); }}
            onSave={handleSave}
          />
        )}
      </div>
    </div>
  );
}
