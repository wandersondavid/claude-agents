"use client";

import { useState, useCallback } from "react";
import type { HistoryEntry, SimulationFormValues } from "@/lib/types";

const HISTORY_KEY = "freight-simulator-history";
const MAX_ENTRIES = 20;

interface SimulationHistoryProps {
  onRedo: (values: SimulationFormValues) => void;
  /** Trigger re-render when history changes externally */
  refreshKey: number;
}

function formatCepDisplay(cep: string): string {
  if (cep.length === 8) {
    return `${cep.slice(0, 5)}-${cep.slice(5)}`;
  }
  return cep;
}

function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(isoDate: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(isoDate));
}

export function loadHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Basic shape validation — ensure each entry has required fields
    return parsed.filter(
      (entry): entry is HistoryEntry =>
        typeof entry === "object" &&
        entry !== null &&
        typeof entry.id === "string" &&
        typeof entry.date === "string" &&
        typeof entry.originCep === "string" &&
        typeof entry.destinationCep === "string" &&
        typeof entry.weight === "number" &&
        typeof entry.dimensions === "object" &&
        Array.isArray(entry.results)
    );
  } catch {
    return [];
  }
}

export function saveToHistory(entry: HistoryEntry): void {
  if (typeof window === "undefined") return;
  const current = loadHistory();
  const updated = [entry, ...current].slice(0, MAX_ENTRIES);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
}

export function clearHistory(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(HISTORY_KEY);
}

export default function SimulationHistory({
  onRedo,
  refreshKey,
}: SimulationHistoryProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  // Use refreshKey to trigger re-read of history
  // refreshKey prop forces re-render, which re-reads localStorage
  const entries = refreshKey >= 0 ? loadHistory() : [];

  const handleRedo = useCallback(
    (entry: HistoryEntry) => {
      const values: SimulationFormValues = {
        originCep: formatCepDisplay(entry.originCep),
        destinationCep: formatCepDisplay(entry.destinationCep),
        weight: String(entry.weight),
        height: String(entry.dimensions.height),
        width: String(entry.dimensions.width),
        length: String(entry.dimensions.length),
      };
      onRedo(values);
    },
    [onRedo]
  );

  const handleClear = useCallback(() => {
    clearHistory();
    setShowConfirm(false);
    // The parent will re-render via refreshKey change
    // But we also need to force local state, so we trigger via a trick:
    // The parent controls refreshKey, so we dispatch a custom event
    window.dispatchEvent(new CustomEvent("history-cleared"));
  }, []);

  if (entries.length === 0) {
    return null;
  }

  return (
    <section aria-label="Historico de simulacoes" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-800">
          Historico de Simulacoes
        </h2>
        {showConfirm ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-600">Tem certeza?</span>
            <button
              type="button"
              onClick={handleClear}
              className="rounded-md bg-red-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-red-700"
            >
              Confirmar
            </button>
            <button
              type="button"
              onClick={() => setShowConfirm(false)}
              className="rounded-md border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowConfirm(true)}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100"
          >
            Limpar historico
          </button>
        )}
      </div>

      <div className="space-y-2">
        {entries.map((entry) => {
          // Find cheapest result
          const cheapest =
            entry.results.length > 0
              ? entry.results.reduce((min, r) =>
                  r.price < min.price ? r : min
                )
              : null;

          return (
            <div
              key={entry.id}
              className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                  <span className="text-zinc-500">{formatDate(entry.date)}</span>
                  <span className="font-medium text-zinc-800">
                    {formatCepDisplay(entry.originCep)} →{" "}
                    {formatCepDisplay(entry.destinationCep)}
                  </span>
                  <span className="text-zinc-500">{entry.weight} kg</span>
                  {cheapest && (
                    <span className="text-sm font-medium text-emerald-700">
                      a partir de {formatBRL(cheapest.price)}
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleRedo(entry)}
                className="shrink-0 rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100"
              >
                Refazer
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
