"use client";

import { useState, useEffect, useCallback } from "react";
import type {
  CarrierResponse,
  CarriersResponse,
  PriceTableResponse,
  PriceTableListResponse,
} from "@/lib/schemas";
import type { ApiErrorResponse } from "@/lib/errors";

interface PriceTableListProps {
  onEdit: (table: PriceTableResponse) => void;
  onCreate: () => void;
  refreshKey: number;
}

function formatCepDisplay(raw: string): string {
  if (raw.length === 8) {
    return `${raw.slice(0, 5)}-${raw.slice(5)}`;
  }
  return raw;
}

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function PriceTableList({ onEdit, onCreate, refreshKey }: PriceTableListProps) {
  const [tables, setTables] = useState<PriceTableResponse[]>([]);
  const [meta, setMeta] = useState<{ total: number; page: number; limit: number; totalPages: number }>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });
  const [carriers, setCarriers] = useState<CarrierResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterCarrierId, setFilterCarrierId] = useState("");
  const [filterActive, setFilterActive] = useState<"" | "true" | "false">("");
  const [currentPage, setCurrentPage] = useState(1);

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch carriers for filter dropdown
  useEffect(() => {
    let cancelled = false;
    async function fetchCarriers() {
      try {
        const res = await fetch("/api/carriers");
        if (!res.ok) return;
        const body: CarriersResponse = await res.json();
        if (!cancelled) setCarriers(body.data);
      } catch {
        // Carrier filter is a convenience — failing silently is acceptable here
        // because the main table data still loads independently
      }
    }
    fetchCarriers();
    return () => { cancelled = true; };
  }, []);

  // Fetch price tables
  const fetchTables = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    params.set("page", String(currentPage));
    params.set("limit", "20");
    if (filterCarrierId) params.set("carrierId", filterCarrierId);
    if (filterActive) params.set("active", filterActive);

    try {
      const res = await fetch(`/api/price-tables?${params.toString()}`);
      if (!res.ok) {
        const body: unknown = await res.json().catch(() => null);
        if (
          body &&
          typeof body === "object" &&
          "error" in body &&
          typeof (body as ApiErrorResponse).error?.message === "string"
        ) {
          throw new Error((body as ApiErrorResponse).error.message);
        }
        throw new Error(`Erro ao carregar tabelas (status ${res.status})`);
      }
      const data: PriceTableListResponse = await res.json();
      setTables(data.data);
      setMeta(data.meta);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro inesperado";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [currentPage, filterCarrierId, filterActive]);

  useEffect(() => {
    fetchTables();
  }, [fetchTables, refreshKey]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterCarrierId, filterActive]);

  async function handleDelete(id: string) {
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/price-tables/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body: unknown = await res.json().catch(() => null);
        if (
          body &&
          typeof body === "object" &&
          "error" in body &&
          typeof (body as ApiErrorResponse).error?.message === "string"
        ) {
          throw new Error((body as ApiErrorResponse).error.message);
        }
        throw new Error(`Erro ao excluir tabela (status ${res.status})`);
      }
      setDeletingId(null);
      fetchTables();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro inesperado";
      setError(message);
      setDeletingId(null);
    } finally {
      setDeleteLoading(false);
    }
  }

  // Page numbers to display
  function getPageNumbers(): number[] {
    const pages: number[] = [];
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(meta.totalPages, currentPage + 2);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  return (
    <div className="space-y-4">
      {/* Toolbar: Filters + New button */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          {/* Carrier filter */}
          <div>
            <label htmlFor="filterCarrier" className="block text-xs font-medium text-zinc-600">
              Transportadora
            </label>
            <select
              id="filterCarrier"
              value={filterCarrierId}
              onChange={(e) => setFilterCarrierId(e.target.value)}
              className="mt-0.5 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 sm:w-48"
            >
              <option value="">Todas</option>
              {carriers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div>
            <label htmlFor="filterActive" className="block text-xs font-medium text-zinc-600">
              Status
            </label>
            <select
              id="filterActive"
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value as "" | "true" | "false")}
              className="mt-0.5 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 sm:w-36"
            >
              <option value="">Todos</option>
              <option value="true">Ativa</option>
              <option value="false">Inativa</option>
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={onCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nova Tabela
        </button>
      </div>

      {/* Error */}
      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50">
              <th className="px-4 py-3 font-semibold text-zinc-700">Transportadora</th>
              <th className="px-4 py-3 font-semibold text-zinc-700">CEP Origem</th>
              <th className="px-4 py-3 font-semibold text-zinc-700">CEP Destino</th>
              <th className="px-4 py-3 font-semibold text-zinc-700">Prazo</th>
              <th className="px-4 py-3 font-semibold text-zinc-700">Faixas de Peso</th>
              <th className="px-4 py-3 font-semibold text-zinc-700">Status</th>
              <th className="px-4 py-3 font-semibold text-zinc-700">Acoes</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              // Skeleton rows
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={`skeleton-${i}`} className="border-b border-zinc-100">
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={`skeleton-${i}-${j}`} className="px-4 py-3">
                      <div className="h-4 animate-pulse rounded bg-zinc-100" />
                    </td>
                  ))}
                </tr>
              ))
            ) : tables.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-zinc-500">
                  Nenhuma tabela de preco encontrada.
                </td>
              </tr>
            ) : (
              tables.map((table, index) => (
                <tr
                  key={table.id}
                  className={`border-b border-zinc-100 transition-colors hover:bg-zinc-50 ${
                    index % 2 === 1 ? "bg-zinc-50/50" : ""
                  }`}
                >
                  <td className="px-4 py-3 font-medium text-zinc-900">
                    {table.carrier.name}
                    <span className="ml-1.5 text-xs text-zinc-400">({table.carrier.code})</span>
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    <span className="font-mono text-xs">
                      {formatCepDisplay(table.cepOriginStart)} - {formatCepDisplay(table.cepOriginEnd)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    <span className="font-mono text-xs">
                      {formatCepDisplay(table.cepDestinationStart)} - {formatCepDisplay(table.cepDestinationEnd)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {table.deadlineDays} {table.deadlineDays === 1 ? "dia" : "dias"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-0.5">
                      {table.weightRanges.map((wr) => (
                        <div key={wr.id} className="text-xs text-zinc-600">
                          {wr.minWeight}-{wr.maxWeight} kg: {formatCurrency(wr.price)}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {table.active ? (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                        Ativa
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-500">
                        Inativa
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onEdit(table)}
                        className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                        aria-label={`Editar tabela ${table.carrier.name}`}
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingId(table.id)}
                        className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600"
                        aria-label={`Excluir tabela ${table.carrier.name}`}
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <nav aria-label="Paginacao" className="flex items-center justify-between">
          <p className="text-sm text-zinc-500">
            Mostrando {(meta.page - 1) * meta.limit + 1} a{" "}
            {Math.min(meta.page * meta.limit, meta.total)} de {meta.total} registros
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Pagina anterior"
            >
              Anterior
            </button>
            {getPageNumbers().map((pageNum) => (
              <button
                key={pageNum}
                type="button"
                onClick={() => setCurrentPage(pageNum)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  pageNum === currentPage
                    ? "bg-blue-600 text-white"
                    : "border border-zinc-300 text-zinc-700 hover:bg-zinc-50"
                }`}
                aria-label={`Pagina ${pageNum}`}
                aria-current={pageNum === currentPage ? "page" : undefined}
              >
                {pageNum}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(meta.totalPages, p + 1))}
              disabled={currentPage >= meta.totalPages}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Proxima pagina"
            >
              Proximo
            </button>
          </div>
        </nav>
      )}

      {/* Delete confirmation dialog */}
      {deletingId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="alertdialog"
          aria-modal="true"
          aria-label="Confirmar exclusao"
        >
          <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-6 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
                <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-semibold text-zinc-900">Excluir tabela de preco</h3>
                <p className="mt-1 text-sm text-zinc-600">
                  Tem certeza que deseja excluir esta tabela? Esta acao nao pode ser desfeita.
                </p>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                disabled={deleteLoading}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deletingId)}
                disabled={deleteLoading}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleteLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Excluindo...
                  </span>
                ) : (
                  "Excluir"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
