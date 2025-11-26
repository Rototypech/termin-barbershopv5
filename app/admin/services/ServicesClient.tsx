"use client";
import { useEffect, useState } from "react";
import { Pencil, Plus } from "lucide-react";

type Service = { id: number; name: string; priceCHF: number; duration: number };

export default function ServicesClient({ initial }: Readonly<{ initial: Service[] }>) {
  const [services, setServices] = useState<Service[]>(initial);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [form, setForm] = useState<{ name: string; description: string; priceCHF: string; duration: string }>({ name: "", description: "", priceCHF: "", duration: "30" });

  function resetForm() {
    setForm({ name: "", description: "", priceCHF: "", duration: "30" });
  }

  function openCreate() {
    setEditingService(null);
    resetForm();
    setIsDialogOpen(true);
  }

  function openEdit(s: Service) {
    setEditingService(s);
    setForm({ name: s.name, description: "", priceCHF: String(s.priceCHF), duration: String(s.duration) });
    setIsDialogOpen(true);
  }

  async function saveDialog() {
    const price = Number.parseInt(form.priceCHF, 10);
    const duration = Number.parseInt(form.duration, 10);
    if (!form.name || Number.isNaN(price) || Number.isNaN(duration) || duration % 15 !== 0) return;
    if (editingService) {
      const r = await fetch(`/api/services`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editingService.id, name: form.name, priceCHF: price, duration }) });
      if (r.ok) {
        const updated = await r.json();
        setServices((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        setIsDialogOpen(false);
        setIsDeleteConfirmOpen(false);
      }
    } else {
      const r = await fetch("/api/services", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: form.name, priceCHF: price, duration }) });
      if (r.ok) {
        const created = await r.json();
        setServices((prev) => [...prev, created]);
        setIsDialogOpen(false);
      }
    }
  }

  async function deleteService(id: number) {
    const r = await fetch(`/api/services?id=${id}`, { method: "DELETE" });
    if (r.ok) {
      setServices((prev) => prev.filter((p) => p.id !== id));
      setIsDialogOpen(false);
      setIsDeleteConfirmOpen(false);
      setDeleteConfirmationText("");
    }
  }

  const durationError = (() => {
    const d = Number.parseInt(form.duration, 10);
    if (Number.isNaN(d)) return "Dauer eingeben";
    if (d % 15 !== 0) return "Dauer muss ein Vielfaches von 15 sein";
    return "";
  })();

  useEffect(() => {
    setServices(initial);
  }, [initial]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl text-[#C5A059]">Leistungen</h1>
        <button className="flex items-center gap-2 px-4 py-2 rounded bg-[#C5A059] text-black" onClick={openCreate}>
          <Plus size={18} /> Service hinzufügen
        </button>
      </div>

      <div className="md:overflow-x-auto overflow-x-hidden -mx-6 md:mx-0">
        <table className="w-full border border-[#C5A059] bg-black">
          <thead className="bg-neutral-900">
            <tr>
              <th className="px-2 md:px-4 py-2 text-left text-[#C5A059]">Name</th>
              <th className="px-2 md:px-4 py-2 text-left text-[#C5A059]">Preise (CHF)</th>
              <th className="px-2 md:px-4 py-2 text-left text-[#C5A059]">Dauer (Min)</th>
              <th className="px-2 md:px-4 py-2 text-left text-[#C5A059]">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {services.map((s) => (
              <tr key={s.id} className="border-t border-neutral-800 hover:bg-neutral-900 cursor-pointer" onClick={() => openEdit(s)}>
                <td className="px-2 md:px-4 py-2 text-white">{s.name}</td>
                <td className="px-2 md:px-4 py-2 text-white">{s.priceCHF}</td>
                <td className="px-2 md:px-4 py-2 text-white">{s.duration}</td>
                <td className="px-2 md:px-4 py-2">
                  <button
                    className="flex items-center px-2 md:px-3 py-1 rounded text-[#C5A059] hover:bg-neutral-800 hover:text-[#d6b064] text-sm md:text-base"
                    aria-label="Verwalten"
                    onClick={(e) => { e.stopPropagation(); openEdit(s); }}
                  >
                    <Pencil className="w-4 h-4 mr-2" /> Verwalten
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isDialogOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="w-full max-w-lg p-6 rounded-lg border border-[#C5A059] bg-neutral-950">
            <div className={isDeleteConfirmOpen ? "text-xl text-red-500 mb-4" : "text-xl text-[#C5A059] mb-4"}>{isDeleteConfirmOpen ? "Unwiderrufliches Löschen des Service!" : (editingService ? "Service bearbeiten" : "Service hinzufügen")}</div>
            {isDeleteConfirmOpen ? (
              <div className="text-white space-y-3">
                <div>
                  Diese Aktion löscht den Service <span className="font-semibold">{editingService?.name}</span> sowie ALLE zugehörigen Buchungen aus der Historie.
                </div>
                <div>
                  Zur Bestätigung geben Sie den Servicenamen ein: <span className="font-semibold">{editingService?.name}</span>
                </div>
                <input
                  className={(deleteConfirmationText !== (editingService?.name ?? "") ? "border-red-600 " : "border-neutral-700 ") + "w-full px-3 py-2 rounded bg-black border text-white"}
                  placeholder="Servicenamen eingeben"
                  value={deleteConfirmationText}
                  onChange={(e) => setDeleteConfirmationText(e.target.value)}
                />
              </div>
            ) : (
              <div className="space-y-3">
                <input className="w-full px-3 py-2 rounded bg-black border border-neutral-700 text-white" placeholder="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                <textarea className="w-full px-3 py-2 rounded bg-black border border-neutral-700 text-white" placeholder="Beschreibung (optional)" rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
                <div className="flex gap-3">
                  <input className="w-full px-3 py-2 rounded bg-black border border-neutral-700 text-white" placeholder="Preis (CHF)" type="number" value={form.priceCHF} onChange={(e) => setForm((f) => ({ ...f, priceCHF: e.target.value }))} />
                  <div className="w-full">
                    <input className="w-full px-3 py-2 rounded bg-black border border-neutral-700 text-white" placeholder="Dauer (Min)" type="number" step={15} value={form.duration} onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))} />
                    {durationError && <div className="mt-1 text-red-500 text-sm">{durationError}</div>}
                  </div>
                </div>
              </div>
            )}
            <div className="mt-6 flex items-center justify-between gap-2">
              <div>
                {editingService && !isDeleteConfirmOpen && (
                  <button className="px-4 py-2 rounded bg-red-600 text-white" onClick={() => { setIsDeleteConfirmOpen(true); setDeleteConfirmationText(""); }}>Löschen</button>
                )}
              </div>
              <div className="flex gap-2">
                {isDeleteConfirmOpen ? (
                  <>
                    <button className="px-4 py-2 rounded border border-neutral-700 text-white" onClick={() => { setIsDeleteConfirmOpen(false); setDeleteConfirmationText(""); }}>Zurück</button>
                    <button className="px-4 py-2 rounded bg-red-600 text-white disabled:opacity-50" disabled={deleteConfirmationText !== (editingService?.name ?? "")} onClick={() => editingService && deleteService(editingService.id)}>Endgültig löschen</button>
                  </>
                ) : (
                  <>
                    <button className="px-4 py-2 rounded border border-neutral-700 text-white" onClick={() => setIsDialogOpen(false)}>Abbrechen</button>
                    <button className="px-4 py-2 rounded bg-[#C5A059] text-black disabled:opacity-50" disabled={!!durationError} onClick={saveDialog}>Speichern</button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
