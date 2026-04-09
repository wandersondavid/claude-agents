"use client";

import { useState, useMemo } from "react";
import type {
  SimulateResponse,
  SimulationResult,
  SortOption,
} from "@/lib/types";

interface SimulationResultsProps {
  data: SimulateResponse;
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

function formatWeight(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function getCarrierBadgeClasses(code: string): string {
  const upper = code.toUpperCase();
  if (upper === "PAC") {
    return "bg-blue-100 text-blue-800 border-blue-200";
  }
  if (upper === "SEDEX") {
    return "bg-red-100 text-red-800 border-red-200";
  }
  // PRIVATE or any other
  return "bg-green-100 text-green-800 border-green-200";
}

export default function SimulationResults({ data }: SimulationResultsProps) {
  const [sortBy, setSortBy] = useState<SortOption>("price");

  const { sortedResults, cheapestIndex, fastestIndex } = useMemo(() => {
    if (data.results.length === 0) {
      return { sortedResults: [], cheapestIndex: -1, fastestIndex: -1 };
    }

    // Find cheapest and fastest among original results
    let cheapestIdx = 0;
    let fastestIdx = 0;
    for (let i = 1; i < data.results.length; i++) {
      if (data.results[i].price < data.results[cheapestIdx].price) {
        cheapestIdx = i;
      }
      if (data.results[i].deadlineDays < data.results[fastestIdx].deadlineDays) {
        fastestIdx = i;
      }
    }

    // Create indexed results for stable tag tracking
    const indexed = data.results.map((r, i) => ({ ...r, _origIndex: i }));

    const sorted = [...indexed].sort((a, b) => {
      if (sortBy === "price") return a.price - b.price;
      return a.deadlineDays - b.deadlineDays;
    });

    return {
      sortedResults: sorted,
      cheapestIndex: cheapestIdx,
      fastestIndex: fastestIdx,
    };
  }, [data.results, sortBy]);

  if (data.results.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-6 text-center">
        <p className="text-sm text-zinc-500">
          Nenhuma opcao de frete encontrada para os dados informados.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Input summary */}
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
        <h3 className="mb-2 text-sm font-semibold text-zinc-600 uppercase tracking-wide">
          Resumo da Simulacao
        </h3>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-zinc-700 sm:grid-cols-4">
          <div>
            <span className="text-zinc-500">Origem:</span>{" "}
            {formatCepDisplay(data.input.originCep)}
          </div>
          <div>
            <span className="text-zinc-500">Destino:</span>{" "}
            {formatCepDisplay(data.input.destinationCep)}
          </div>
          <div>
            <span className="text-zinc-500">Peso real:</span>{" "}
            {formatWeight(data.input.weight)} kg
          </div>
          <div>
            <span className="text-zinc-500">Peso cubico:</span>{" "}
            {formatWeight(data.input.cubicWeight)} kg
          </div>
          <div>
            <span className="text-zinc-500">Peso efetivo:</span>{" "}
            <span className="font-medium">
              {formatWeight(data.input.effectiveWeight)} kg
            </span>
          </div>
          <div>
            <span className="text-zinc-500">Dimensoes:</span>{" "}
            {data.input.height} x {data.input.width} x {data.input.length} cm
          </div>
        </div>
      </div>

      {/* Sort toggle */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-700">
          {data.results.length} opcao{data.results.length !== 1 ? "es" : ""}{" "}
          encontrada{data.results.length !== 1 ? "s" : ""}
        </h3>
        <div className="flex rounded-lg border border-zinc-300 bg-white text-sm">
          <button
            type="button"
            onClick={() => setSortBy("price")}
            className={`px-3 py-1.5 rounded-l-lg transition-colors ${
              sortBy === "price"
                ? "bg-blue-600 text-white"
                : "text-zinc-600 hover:bg-zinc-100"
            }`}
            aria-pressed={sortBy === "price"}
          >
            Ordenar por preco
          </button>
          <button
            type="button"
            onClick={() => setSortBy("deadline")}
            className={`px-3 py-1.5 rounded-r-lg transition-colors ${
              sortBy === "deadline"
                ? "bg-blue-600 text-white"
                : "text-zinc-600 hover:bg-zinc-100"
            }`}
            aria-pressed={sortBy === "deadline"}
          >
            Ordenar por prazo
          </button>
        </div>
      </div>

      {/* Result cards */}
      <div className="space-y-3">
        {sortedResults.map(
          (result: SimulationResult & { _origIndex: number }) => {
            const isCheapest = result._origIndex === cheapestIndex;
            const isFastest = result._origIndex === fastestIndex;

            return (
              <div
                key={`${result.carrier.code}-${result._origIndex}`}
                className={`relative rounded-lg border bg-white p-4 shadow-sm transition-shadow hover:shadow-md ${
                  isCheapest || isFastest
                    ? "border-blue-200 ring-1 ring-blue-100"
                    : "border-zinc-200"
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  {/* Left: carrier info */}
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${getCarrierBadgeClasses(
                        result.carrier.code
                      )}`}
                    >
                      {result.carrier.code}
                    </span>
                    <span className="text-base font-medium text-zinc-900">
                      {result.carrier.name}
                    </span>
                  </div>

                  {/* Right: price and deadline */}
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xs text-zinc-500">Prazo</p>
                      <p className="text-sm font-medium text-zinc-800">
                        {result.deadlineDays} dia{result.deadlineDays !== 1 ? "s" : ""}{" "}
                        {result.deadlineDays !== 1 ? "uteis" : "util"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-zinc-500">Valor</p>
                      <p className="text-lg font-bold text-zinc-900">
                        {formatBRL(result.price)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tags */}
                {(isCheapest || isFastest) && (
                  <div className="mt-2 flex gap-2">
                    {isCheapest && (
                      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                        Mais barato
                      </span>
                    )}
                    {isFastest && (
                      <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                        Mais rapido
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          }
        )}
      </div>
    </div>
  );
}
