"use client";
import { useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import { loadHabits, saveHabits, mergeImported, exportHabitsJson } from "@/lib/localHabits";

export default function HabitImportExport({ onChange }) {
  const fileRef = useRef(null);
  const [message, setMessage] = useState("");

  const exportNow = () => {
    const blob = new Blob([exportHabitsJson(loadHabits())], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `habits-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      const { next, added, merged, skipped } = mergeImported(loadHabits(), data);
      saveHabits(next);
      onChange?.(next);
      setMessage(`Imported: ${added} new, ${merged} updated${skipped ? `, ${skipped} skipped` : ""}.`);
    } catch (err) {
      setMessage(`Import failed: ${err.message}`);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <input ref={fileRef} type="file" accept="application/json,.json" onChange={importFile} className="hidden" />
      <button
        onClick={() => fileRef.current?.click()}
        className="inline-flex items-center gap-1.5 rounded-md border border-[#d6d3cd] bg-white px-3 py-1.5 hover:bg-[#f1efeb]"
      >
        <Upload className="h-4 w-4" /> Import JSON
      </button>
      <button
        onClick={exportNow}
        className="inline-flex items-center gap-1.5 rounded-md border border-[#d6d3cd] bg-white px-3 py-1.5 hover:bg-[#f1efeb]"
      >
        <Download className="h-4 w-4" /> Export JSON
      </button>
      {message && <span className="text-[#4a4843]">{message}</span>}
    </div>
  );
}
