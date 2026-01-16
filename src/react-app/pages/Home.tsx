import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Plus, BookOpen, Users } from "lucide-react";

interface ClassItem {
  id: number;
  name: string;
  school_year: string;
  created_at: string;
}

export default function HomePage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const response = await fetch("/api/classes");
      const data = await response.json();
      setClasses(data);
    } catch (error) {
      console.error("Error fetching classes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClass = async () => {
    const name = prompt("Nome da turma:");
    if (!name) return;
    
    const school_year = prompt("Ano letivo:");
    
    try {
      await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, school_year }),
      });
      
      fetchClasses();
    } catch (error) {
      console.error("Error creating class:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <BookOpen className="w-10 h-10 text-indigo-600" />
              Gestão Escolar
            </h1>
            <p className="text-lg text-gray-600">
              Sistema de gerenciamento de atividades e notas
            </p>
          </div>
          <button
            onClick={handleCreateClass}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5" />
            Nova Turma
          </button>
        </div>

        {classes.length === 0 ? (
          <div className="text-center py-20">
            <Users className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-700 mb-2">
              Nenhuma turma cadastrada
            </h2>
            <p className="text-gray-500 mb-6">
              Comece criando sua primeira turma
            </p>
            <button
              onClick={handleCreateClass}
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all"
            >
              <Plus className="w-5 h-5" />
              Criar Turma
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((classItem) => (
              <button
                key={classItem.id}
                onClick={() => navigate(`/class/${classItem.id}`)}
                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-1 border border-gray-100 text-left group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-indigo-100 rounded-xl group-hover:bg-indigo-200 transition-colors">
                    <Users className="w-6 h-6 text-indigo-600" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {classItem.name}
                </h3>
                {classItem.school_year && (
                  <p className="text-gray-600">Ano: {classItem.school_year}</p>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
