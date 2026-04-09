"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import SimulationForm from "@/components/SimulationForm";
import SimulationResults from "@/components/SimulationResults";
import SimulationHistory, {
  saveToHistory,
} from "@/components/SimulationHistory";
import type {
  SimulateRequest,
  SimulateResponse,
  SimulationFormValues,
  ApiErrorResponse,
} from "@/lib/types";

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SimulateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [initialValues, setInitialValues] = useState<
    SimulationFormValues | undefined
  >(undefined);
  const [historyRefresh, setHistoryRefresh] = useState(0);

  // Listen for history-cleared events from the history component
  useEffect(() => {
    function handleHistoryCleared() {
      setHistoryRefresh((prev) => prev + 1);
    }
    window.addEventListener("history-cleared", handleHistoryCleared);
    return () => {
      window.removeEventListener("history-cleared", handleHistoryCleared);
    };
  }, []);

  const handleSubmit = useCallback(async (data: SimulateRequest) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const body: unknown = await response.json().catch(() => null);
        if (
          body &&
          typeof body === "object" &&
          "error" in body &&
          typeof (body as ApiErrorResponse).error?.message === "string"
        ) {
          throw new Error((body as ApiErrorResponse).error.message);
        }
        throw new Error(
          `Erro ao simular frete (status ${response.status})`
        );
      }

      const responseData: SimulateResponse = await response.json();
      setResult(responseData);

      // Save to history
      const historyEntry = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        originCep: data.originCep,
        destinationCep: data.destinationCep,
        weight: data.weight,
        dimensions: {
          height: data.height,
          width: data.width,
          length: data.length,
        },
        results: responseData.results,
      };
      saveToHistory(historyEntry);
      setHistoryRefresh((prev) => prev + 1);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Erro inesperado ao simular frete";
      setError(message);
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleRedo = useCallback((values: SimulationFormValues) => {
    setInitialValues(values);
    setFormKey((prev) => prev + 1);
    setResult(null);
    setError(null);
    // Scroll to top so the user sees the form
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-4 sm:px-6">
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
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-zinc-900">
                  Simulador de Frete
                </h1>
                <p className="text-xs text-zinc-500">
                  Calcule o melhor frete para sua encomenda
                </p>
              </div>
            </div>
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Admin
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
        <div className="space-y-8">
          {/* Form section */}
          <section aria-label="Formulario de simulacao">
            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-zinc-800">
                Dados do Envio
              </h2>
              <SimulationForm
                key={formKey}
                onSubmit={handleSubmit}
                isLoading={isLoading}
                initialValues={initialValues}
              />
            </div>
          </section>

          {/* Error display */}
          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 p-4"
            >
              <div className="flex items-start gap-3">
                <svg
                  className="mt-0.5 h-5 w-5 shrink-0 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <p className="text-sm font-medium text-red-800">
                    Erro na simulacao
                  </p>
                  <p className="mt-1 text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Results section */}
          {result && (
            <section aria-label="Resultados da simulacao">
              <SimulationResults data={result} />
            </section>
          )}

          {/* History section */}
          <SimulationHistory
            onRedo={handleRedo}
            refreshKey={historyRefresh}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-4 sm:px-6">
          <p className="text-center text-xs text-zinc-400">
            Simulador de Frete &mdash; Os valores apresentados sao estimativas
          </p>
        </div>
      </footer>
    </div>
  );
}
