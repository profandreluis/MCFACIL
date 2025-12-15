import { useState, useRef } from "react";
import { X, User, Phone, Upload, Camera, Tag, Target } from "lucide-react";

interface TeacherModalProps {
  teacher: any;
  onClose: () => void;
  onSave: (teacherData: any) => void;
}

export default function TeacherModal({ teacher, onClose, onSave }: TeacherModalProps) {
  const [formData, setFormData] = useState({
    name: teacher.name || "",
    email: teacher.email || "",
    phone: teacher.phone || "",
    profile_photo_url: teacher.profile_photo_url || "",
    subjects: teacher.subjects || [],
    yearly_goals: teacher.yearly_goals || [],
  });

  const [uploading, setUploading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string>(teacher.profile_photo_url || "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);

    if (teacher.id) {
      setUploading(true);
      try {
        const fd = new FormData();
        fd.append("photo", file);

        const response = await fetch(`/api/teachers/${teacher.id}/photo`, {
          method: "POST",
          body: fd,
        });

        if (!response.ok) {
          const err = await response.json();
          alert(err.error || "Erro ao enviar foto");
          setPhotoPreview(teacher.profile_photo_url || "");
          return;
        }

        const { url } = await response.json();
        setFormData({ ...formData, profile_photo_url: url });
      } catch (error) {
        console.error(error);
        alert("Erro ao enviar foto");
        setPhotoPreview(teacher.profile_photo_url || "");
      } finally {
        setUploading(false);
      }
    }
  };

  const handleAddSubject = (value: string) => {
    if (!value) return;
    setFormData({ ...formData, subjects: [...formData.subjects, value] });
  };

  const handleRemoveSubject = (index: number) => {
    const next = formData.subjects.filter((_: any, i: number) => i !== index);
    setFormData({ ...formData, subjects: next });
  };

  const handleAddGoal = () => {
    setFormData({ ...formData, yearly_goals: [...formData.yearly_goals, ""] });
  };

  const handleChangeGoal = (index: number, value: string) => {
    const goals = [...formData.yearly_goals];
    goals[index] = value;
    setFormData({ ...formData, yearly_goals: goals });
  };

  const handleRemoveGoal = (index: number) => {
    const goals = formData.yearly_goals.filter((_: any, i: number) => i !== index);
    setFormData({ ...formData, yearly_goals: goals });
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
            <h2 className="text-xl font-bold">Cadastro do Professor</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Camera className="w-5 h-5 text-indigo-600" /> Foto de Perfil
            </h3>

            <div className="flex items-center gap-6">
              <div className="relative">
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="w-32 h-32 rounded-full object-cover border-4 border-indigo-100" />
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
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" disabled={!teacher.id} />
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={!teacher.id || uploading} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  <Upload className="w-4 h-4" /> {uploading ? "Enviando..." : "Fazer Upload"}
                </button>
                {!teacher.id && <p className="text-sm text-gray-500">Salve o professor primeiro para adicionar uma foto</p>}
                <p className="text-sm text-gray-500">Formatos: JPG, PNG, WebP, GIF (máx. 5MB)</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2"><User className="w-5 h-5 text-indigo-600" /> Informações</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo *</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><Phone className="w-4 h-4" /> Telefone</label>
                <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="(00) 00000-0000" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2"><Tag className="w-5 h-5 text-green-600" /> Disciplinas</h3>
            <div>
              <div className="flex gap-2 flex-wrap">
                {formData.subjects.map((s: string, i: number) => (
                  <span key={i} className="flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm">
                    {s}
                    <button type="button" onClick={() => handleRemoveSubject(i)} className="p-1 text-indigo-500 hover:bg-indigo-100 rounded">×</button>
                  </span>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <input id="new-subject" type="text" placeholder="Adicionar disciplina" className="flex-1 px-3 py-2 border rounded" />
                <button type="button" onClick={() => { const el = document.getElementById("new-subject") as HTMLInputElement | null; if (!el) return; handleAddSubject(el.value); el.value = ""; }} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Adicionar</button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2"><Target className="w-5 h-5 text-orange-600" /> Metas do Ano</h3>
            <div className="space-y-2">
              {formData.yearly_goals.map((g: string, i: number) => (
                <div key={i} className="flex gap-2 items-start">
                  <textarea value={g} onChange={(e) => handleChangeGoal(i, e.target.value)} className="flex-1 px-3 py-2 border rounded" rows={2} />
                  <button type="button" onClick={() => handleRemoveGoal(i)} className="px-3 py-2 text-red-600 hover:bg-red-50 rounded">Remover</button>
                </div>
              ))}
              <button type="button" onClick={handleAddGoal} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Adicionar Meta</button>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg">Cancelar</button>
            <button type="submit" className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg">Salvar</button>
          </div>
        </form>
      </div>
    </div>
  );
}
