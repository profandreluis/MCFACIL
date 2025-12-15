import { useState, useEffect, useRef } from "react";
import { X, User, Phone, BookOpen, Users, GraduationCap, Upload, Camera } from "lucide-react";

interface StudentModalProps {
  student: any;
  onClose: () => void;
  onSave: (studentData: any) => void;
}

export default function StudentModal({ student, onClose, onSave }: StudentModalProps) {
  const [formData, setFormData] = useState({
    name: student.name || "",
    number: student.number || "",
    status: student.status || "Ativo",
    phone: student.phone || "",
    profile_photo_url: student.profile_photo_url || "",
    life_project: student.life_project || "",
    youth_club_semester_1: student.youth_club_semester_1 || "",
    youth_club_semester_2: student.youth_club_semester_2 || "",
    elective_semester_1: student.elective_semester_1 || "",
    elective_semester_2: student.elective_semester_2 || "",
    tutor_teacher: student.tutor_teacher || "",
    guardian_1: student.guardian_1 || "",
    guardian_2: student.guardian_2 || "",
  });
  
  const [uploading, setUploading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string>(student.profile_photo_url || "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    
    // Upload to server if student already exists
    if (student.id) {
      setUploading(true);
      try {
        const uploadForm = new FormData();
        uploadForm.append("photo", file);
        
        const response = await fetch(`/api/students/${student.id}/photo`, {
          method: "POST",
          body: formData,
        });
        
        if (!response.ok) {
          const error = await response.json();
          alert(error.error || "Erro ao fazer upload da foto");
          setPhotoPreview(student.profile_photo_url || "");
          return;
        }
        
        const { url } = await response.json();
        setFormData((prev) => ({ ...prev, profile_photo_url: url }));
      } catch (error) {
        console.error("Error uploading photo:", error);
        alert("Erro ao fazer upload da foto");
        setPhotoPreview(student.profile_photo_url || "");
      } finally {
        setUploading(false);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <User className="w-6 h-6" />
            <h2 className="text-xl font-bold">Dados do Aluno</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Foto de Perfil */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Camera className="w-5 h-5 text-indigo-600" />
              Foto de Perfil
            </h3>
            
            <div className="flex items-center gap-6">
              <div className="relative">
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="w-32 h-32 rounded-full object-cover border-4 border-indigo-100"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center border-4 border-indigo-100">
                    <User className="w-16 h-16 text-indigo-400" />
                  </div>
                )}
                {uploading && (
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  </div>
                )}
              </div>
              
              <div className="flex-1 space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={!student.id}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!student.id || uploading}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Upload className="w-4 h-4" />
                  {uploading ? "Enviando..." : "Fazer Upload"}
                </button>
                {!student.id && (
                  <p className="text-sm text-gray-500">
                    Salve o aluno primeiro para adicionar uma foto
                  </p>
                )}
                <p className="text-sm text-gray-500">
                  Formatos aceitos: JPG, PNG, WebP, GIF (máx. 5MB)
                </p>
              </div>
            </div>
          </div>

          {/* Informações Básicas */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-600" />
              Informações Básicas
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número
                </label>
                <input
                  type="number"
                  value={formData.number}
                  onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="Ativo">Ativo</option>
                  <option value="Inativo">Inativo</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  Telefone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>
          </div>

          {/* Projeto de Vida */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-purple-600" />
              Projeto de Vida
            </h3>
            
            <div>
              <textarea
                value={formData.life_project}
                onChange={(e) => setFormData({ ...formData, life_project: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                rows={3}
                placeholder="Descreva o projeto de vida do aluno..."
              />
            </div>
          </div>

          {/* Clubes Juvenis e Eletivas */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-green-600" />
              Clubes e Eletivas
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Club Juvenil - 1º Semestre
                </label>
                <input
                  type="text"
                  value={formData.youth_club_semester_1}
                  onChange={(e) => setFormData({ ...formData, youth_club_semester_1: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Club Juvenil - 2º Semestre
                </label>
                <input
                  type="text"
                  value={formData.youth_club_semester_2}
                  onChange={(e) => setFormData({ ...formData, youth_club_semester_2: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Eletiva - 1º Semestre
                </label>
                <input
                  type="text"
                  value={formData.elective_semester_1}
                  onChange={(e) => setFormData({ ...formData, elective_semester_1: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Eletiva - 2º Semestre
                </label>
                <input
                  type="text"
                  value={formData.elective_semester_2}
                  onChange={(e) => setFormData({ ...formData, elective_semester_2: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Professor Tutor e Responsáveis */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-orange-600" />
              Professor e Responsáveis
            </h3>
            
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Professor Tutor
                </label>
                <input
                  type="text"
                  value={formData.tutor_teacher}
                  onChange={(e) => setFormData({ ...formData, tutor_teacher: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Responsável 1
                </label>
                <input
                  type="text"
                  value={formData.guardian_1}
                  onChange={(e) => setFormData({ ...formData, guardian_1: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Responsável 2
                </label>
                <input
                  type="text"
                  value={formData.guardian_2}
                  onChange={(e) => setFormData({ ...formData, guardian_2: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md font-medium"
            >
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
