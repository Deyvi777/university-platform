"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { type ProgramSummary } from "@/lib/api/programs";

import { ProgramCards } from "./program-cards";

export function ProgramsGrid({ programs }: { programs: ProgramSummary[] }) {
  const searchParams = useSearchParams();
  const categoria = searchParams.get("categoria");

  // Pestañas derivadas de las categorías presentes en los programas.
  const categories = useMemo(() => {
    const bySlug = new Map<string, string>();
    for (const p of programs) {
      if (!bySlug.has(p.category.slug)) {
        bySlug.set(p.category.slug, p.category.name);
      }
    }
    return [...bySlug.entries()].map(([slug, name]) => ({ slug, name }));
  }, [programs]);

  const isValidTab = (slug: string | null): slug is string =>
    !!slug && categories.some((c) => c.slug === slug);

  // La URL (?categoria=<slug>, desde el navbar) inicializa la pestaña, pero el
  // usuario puede cambiarla con los botones. Sincronizamos en render cuando el
  // parámetro cambia, sin efectos (patrón recomendado por React).
  const [activeTab, setActiveTab] = useState<string>(
    isValidTab(categoria) ? categoria : "TODOS",
  );
  const [prevCategoria, setPrevCategoria] = useState(categoria);
  if (categoria !== prevCategoria) {
    setPrevCategoria(categoria);
    if (isValidTab(categoria)) {
      setActiveTab(categoria);
    }
  }

  const tabs = [{ slug: "TODOS", name: "Todos" }, ...categories];

  const visible =
    activeTab === "TODOS"
      ? programs
      : programs.filter((p) => p.category.slug === activeTab);

  return (
    <>
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        {tabs.map((tab) => (
          <button
            key={tab.slug}
            type="button"
            onClick={() => setActiveTab(tab.slug)}
            className={`rounded-full px-5 py-2 text-sm transition-colors ${
              activeTab === tab.slug
                ? "bg-amber-400 font-semibold text-slate-950"
                : "border border-white/25 font-medium text-white hover:border-white/60 hover:bg-white/10"
            }`}
          >
            {tab.name}
          </button>
        ))}
      </div>

      <ProgramCards programs={visible} />
    </>
  );
}
