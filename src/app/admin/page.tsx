"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import PriceTableList from "@/components/PriceTableList";
import PriceTableForm from "@/components/PriceTableForm";
import type { PriceTableResponse } from "@/lib/schemas";

export default function AdminPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingTable, setEditingTable] = useState<PriceTableResponse | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreate = useCallback(() => {
    setEditingTable(null);
    setShowForm(true);
  }, []);

  const handleEdit = useCallback((table: PriceTableResponse) => {
    setEditingTable(table);
    setShowForm(true);
  }, []);

  const handleCloseForm = useCallback(() => {
    setShowForm(false);
    setEditingTable(null);
  }, []);

  const handleFormSuccess = useCallback(() => {
    setShowForm(false);
    setEditingTable(null);
    setRefreshKey((prev) => prev + 1);
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600">
                <svg
                  className="h-5 w-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-zinc-900">
                  Administracao - Tabelas de Preco
                </h1>
                <p className="text-xs text-zinc-500">
                  Gerencie as tabelas de preco das transportadoras
                </p>
              </div>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Voltar ao Simulador
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <PriceTableList
          onEdit={handleEdit}
          onCreate={handleCreate}
          refreshKey={refreshKey}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
          <p className="text-center text-xs text-zinc-400">
            Simulador de Frete &mdash; Painel Administrativo
          </p>
        </div>
      </footer>

      {/* Form modal */}
      {showForm && (
        <PriceTableForm
          editingTable={editingTable}
          onClose={handleCloseForm}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
}
