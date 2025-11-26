"use client";
import { useEffect, useMemo, useState } from "react";
import { Pencil } from "lucide-react";

const DATE_FORMATTER = new Intl.DateTimeFormat("de-CH", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Zurich" });
const TIME_FORMATTER = new Intl.DateTimeFormat("de-CH", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Europe/Zurich" });

type Booking = {
  id: number;
  date: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  status: "BESTAETIGT" | "STORNIERT" | "NO_SHOW" | "ABGESCHLOSSEN";
  notes?: string | null;
  service?: { name: string; priceCHF: number } | null;
};

type Service = { id: number; name: string };

export default function AdminClient({ initial, initialServices }: Readonly<{ initial: Booking[]; initialServices: Service[] }>) {
  const [bookings, setBookings] = useState<Booking[]>(initial);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
  const [filterClient, setFilterClient] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterService, setFilterService] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "BESTAETIGT" | "STORNIERT" | "NO_SHOW" | "ABGESCHLOSSEN">("ALL");
  const [servicesList] = useState<Service[]>(initialServices);
  const [filterYear, setFilterYear] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterDay, setFilterDay] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const yearsList = useMemo(() => {
    const ys = new Set<number>();
    for (const b of bookings) {
      ys.add(new Date(b.date).getFullYear());
    }
    const arr = Array.from(ys).sort((a, b) => a - b);
    if (arr.length === 0) {
      const cy = new Date().getFullYear();
      return [cy, cy + 1];
    }
    return arr;
  }, [bookings]);

  function daysInMonth(year: number, month: number) {
    if (!year || !month) return 31;
    return new Date(year, month, 0).getDate();
  }

  const daysList = useMemo(() => {
    const y = Number.parseInt(filterYear || "0", 10);
    const m = Number.parseInt(filterMonth || "0", 10);
    const max = daysInMonth(y, m);
    return Array.from({ length: max }, (_, i) => i + 1);
  }, [filterYear, filterMonth]);

  useEffect(() => {
    if (filterDay) {
      const y = Number.parseInt(filterYear || "0", 10);
      const m = Number.parseInt(filterMonth || "0", 10);
      const max = daysInMonth(y, m);
      const d = Number.parseInt(filterDay, 10);
      if (d > max) setFilterDay(String(max));
    }
  }, [filterYear, filterMonth, filterDay]);

  useEffect(() => {
    if (filterYear && filterMonth && filterDay) {
      const y = filterYear;
      const m = String(Number.parseInt(filterMonth, 10)).padStart(2, "0");
      const d = String(Number.parseInt(filterDay, 10)).padStart(2, "0");
      setFilterDate(`${y}-${m}-${d}`);
    } else {
      setFilterDate("");
    }
  }, [filterYear, filterMonth, filterDay]);

  useEffect(() => {
    setBookings(initial);
  }, [initial]);

  const filteredBookings = bookings.filter((b) => {
    const d = new Date(b.date);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const clientHaystack = `${b.clientName} ${b.clientPhone} ${b.clientEmail ?? ""}`.toLowerCase();
    const serviceHaystack = `${b.service?.name ?? ""}`.toLowerCase();
    const passClient = filterClient ? clientHaystack.includes(filterClient.toLowerCase()) : true;
    const passDate = filterDate ? dateStr === filterDate : true;
    const passService = filterService === "ALL" ? true : serviceHaystack === filterService.toLowerCase();
    const passStatus = filterStatus === "ALL" ? true : b.status === filterStatus;
    return passClient && passDate && passService && passStatus;
  });

  return (
    <div className="overflow-x-auto">
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg bg-neutral-900 border border-[#C5A059] text-white shadow-2xl">
          {toastMessage}
        </div>
      )}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <input
            className="px-3 py-2 rounded bg-black border border-neutral-700 text-white"
            placeholder="Kunde suchen..."
            value={filterClient}
            onChange={(e) => setFilterClient(e.target.value)}
          />
        </div>
        <select
          className="px-3 py-2 rounded bg-black border border-neutral-700 text-white"
          value={filterDay}
          onChange={(e) => setFilterDay(e.target.value)}
        >
          <option value="">Tag</option>
          {daysList.map((d) => (
            <option key={d} value={String(d)}>{d}</option>
          ))}
        </select>
        <select
          className="px-3 py-2 rounded bg-black border border-neutral-700 text-white"
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
        >
          <option value="">Monat</option>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <option key={m} value={String(m)}>{m}</option>
          ))}
        </select>
        <select
          className="px-3 py-2 rounded bg-black border border-neutral-700 text-white"
          value={filterYear}
          onChange={(e) => setFilterYear(e.target.value)}
        >
          <option value="">Jahr</option>
          {yearsList.map((y) => (
            <option key={y} value={String(y)}>{y}</option>
          ))}
        </select>
        <select
          className="px-3 py-2 rounded bg-black border border-neutral-700 text-white"
          value={filterService}
          onChange={(e) => setFilterService(e.target.value)}
        >
          <option value="ALL">Alle Services</option>
          {servicesList.map((s) => (
            <option key={s.id} value={s.name.toLowerCase()}>{s.name}</option>
          ))}
        </select>
        <select
          className="px-3 py-2 rounded bg-black border border-neutral-700 text-white"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as "ALL" | "BESTAETIGT" | "STORNIERT" | "NO_SHOW" | "ABGESCHLOSSEN")}
        >
          <option value="ALL">Alle</option>
          <option value="BESTAETIGT">Bestätigt</option>
          <option value="STORNIERT">Storniert</option>
          <option value="ABGESCHLOSSEN">Abgeschlossen</option>
          <option value="NO_SHOW">No Show</option>
        </select>
        <button
          className="px-3 py-2 rounded border border-neutral-700 text-white"
          onClick={() => { setFilterClient(""); setFilterDate(""); setFilterService("ALL"); setFilterStatus("ALL"); setFilterYear(""); setFilterMonth(""); setFilterDay(""); }}
        >
          Filter zurücksetzen
        </button>
      </div>
      <table className="min-w-full border border-[#C5A059] bg-black">
        <thead className="bg-neutral-900">
          <tr>
            <th className="px-4 py-2 text-left text-[#C5A059]">Datum</th>
            <th className="px-4 py-2 text-left text-[#C5A059]">Zeit</th>
            <th className="px-4 py-2 text-left text-[#C5A059]">Kunde</th>
            <th className="px-4 py-2 text-left text-[#C5A059]">Service</th>
            <th className="px-4 py-2 text-left text-[#C5A059]">Status</th>
            <th className="px-4 py-2 text-left text-[#C5A059]">Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {filteredBookings.map((b) => {
            const d = new Date(b.date);
            const datum = DATE_FORMATTER.format(d);
            const zeit = TIME_FORMATTER.format(d);
            return (
              <tr key={b.id} className="border-t border-neutral-800">
                <td className="px-4 py-2">{datum}</td>
                <td className="px-4 py-2">{zeit}</td>
                <td className="px-4 py-2">{b.clientName} – {b.clientPhone}</td>
                <td className="px-4 py-2">{b.service?.name}</td>
                <td className="px-4 py-2">
                  {b.status === "BESTAETIGT" && (
                    <span className="inline-block px-2 py-1 rounded bg-green-900 text-green-100 text-xs">Bestätigt</span>
                  )}
                  {b.status === "ABGESCHLOSSEN" && (
                    <span className="inline-block px-2 py-1 rounded bg-neutral-700 text-neutral-300 text-xs">Abgeschlossen</span>
                  )}
                  {b.status === "STORNIERT" && (
                    <span className="inline-block px-2 py-1 rounded bg-red-900 text-red-100 text-xs">Storniert</span>
                  )}
                  {b.status === "NO_SHOW" && (
                    <span className="inline-block px-2 py-1 rounded bg-orange-900 text-orange-100 text-xs">No Show</span>
                  )}
                </td>
                <td className="px-4 py-2">
                  <button
                    className="flex items-center px-3 py-1 rounded text-[#C5A059] hover:bg-neutral-800 hover:text-[#d6b064]"
                    aria-label="Verwalten"
                    onClick={() => { setSelectedBooking(b); setIsDialogOpen(true); setIsCancelConfirmOpen(false); }}
                  >
                    <Pencil className="w-4 h-4 mr-2" /> Verwalten
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

            {isDialogOpen && selectedBooking && (
              <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                <div className="w-full max-w-lg p-6 rounded-lg border border-[#C5A059] bg-neutral-950">
                  <div className={isCancelConfirmOpen ? "text-xl text-red-500 mb-4" : "text-xl text-[#C5A059] mb-4"}>
                    {isCancelConfirmOpen ? "Stornierung bestätigen" : "Buchungsdetails"}
                  </div>
                  {isCancelConfirmOpen ? (
                    <div className="text-white space-y-3">
                <div>
                  Möchten Sie den Termin des Kunden <span className="font-semibold">{selectedBooking.clientName}</span> am <span className="font-semibold">{DATE_FORMATTER.format(new Date(selectedBooking.date))}</span> um <span className="font-semibold">{TIME_FORMATTER.format(new Date(selectedBooking.date))}</span> wirklich stornieren?
                </div>
                <div>Diese Aktion ist unwiderruflich.</div>
              </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 text-white">
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-neutral-400">Kunde</div>
                  <div>{selectedBooking.clientName}</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-neutral-400">Telefon</div>
                  <div>{selectedBooking.clientPhone}</div>
                </div>
                {selectedBooking.clientEmail && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-neutral-400">E‑Mail</div>
                    <div>{selectedBooking.clientEmail}</div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-neutral-400">Datum</div>
                  <div>{DATE_FORMATTER.format(new Date(selectedBooking.date))}</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-neutral-400">Zeit</div>
                  <div>{TIME_FORMATTER.format(new Date(selectedBooking.date))}</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-neutral-400">Service</div>
                  <div>{selectedBooking.service?.name}</div>
                </div>
                {selectedBooking.service?.priceCHF !== undefined && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-neutral-400">Preis</div>
                    <div>{selectedBooking.service?.priceCHF} CHF</div>
                  </div>
                )}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="text-neutral-400">Status</div>
                        <div><span className="inline-block px-2 py-1 rounded bg-neutral-800 text-green-400 text-xs">Bestätigt</span></div>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        <div className="text-neutral-400">Kundenhinweise</div>
                        <div className={selectedBooking.notes ? "bg-neutral-900 p-3 border border-neutral-800 italic" : "text-neutral-400"}>
                          {selectedBooking.notes ? selectedBooking.notes : "Keine Hinweise"}
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="mt-6 flex items-center justify-between gap-2">
                    <div>
                      {!isCancelConfirmOpen && selectedBooking.status === "BESTAETIGT" && (
                        <button className="px-4 py-2 rounded bg-red-600 text-white" onClick={() => setIsCancelConfirmOpen(true)}>Termin stornieren</button>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {isCancelConfirmOpen ? (
                        <>
                          <button className="px-4 py-2 rounded border border-neutral-700 text-white" onClick={() => setIsCancelConfirmOpen(false)}>Zurück</button>
                          <button
                            className="px-4 py-2 rounded bg-red-600 text-white"
                            onClick={async () => {
                              if (!selectedBooking) return;
                              const r = await fetch(`/api/bookings/${selectedBooking.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "STORNIERT" }) });
                              if (r.ok) {
                                setIsDialogOpen(false);
                                setIsCancelConfirmOpen(false);
                                setBookings((prev) => prev.map((p) => p.id === selectedBooking.id ? { ...p, status: "STORNIERT" } : p));
                                setSelectedBooking(null);
                                setToastMessage("Termin storniert");
                                setTimeout(() => setToastMessage(null), 3000);
                              }
                            }}
                          >
                            Endgültig stornieren
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="px-4 py-2 rounded border border-orange-600 text-orange-500 hover:bg-orange-900"
                            onClick={async () => {
                              if (!selectedBooking) return;
                              const r = await fetch(`/api/bookings/${selectedBooking.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "NO_SHOW" }) });
                              if (r.ok) {
                                setIsDialogOpen(false);
                                setBookings((prev) => prev.map((p) => p.id === selectedBooking.id ? { ...p, status: "NO_SHOW" } : p));
                                setSelectedBooking(null);
                                setToastMessage("No Show markiert");
                                setTimeout(() => setToastMessage(null), 3000);
                              }
                            }}
                          >
                            Nicht erschienen (No Show)
                          </button>
                          <button className="px-4 py-2 rounded border border-neutral-700 text-white" onClick={() => { setIsDialogOpen(false); setSelectedBooking(null); }}>Zurück</button>
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
