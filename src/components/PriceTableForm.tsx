"use client";

import { useState, useCallback, useEffect } from "react";
import type {
  CarrierResponse,
  PriceTableResponse,
  PriceTableCreateRequest,
  CarriersResponse,
  PriceTableSingleResponse,
} from "@/lib/schemas";
import type { ApiErrorResponse } from "@/lib/errors";

interface PriceTableFormProps {
  editingTable: PriceTableResponse | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface WeightRangeRow {
  key: string;
  minWeight: string;
  maxWeight: string;
  price: string;
}

interface FormValues {
  carrierId: string;
  cepOriginStart: string;
  cepOriginEnd: string;
  cepDestinationStart: string;
  cepDestinationEnd: string;
  deadlineDays: string;
  active: boolean;
  weightRanges: WeightRangeRow[];
}

interface FormErrors {
  carrierId?: string;
  cepOriginStart?: string;
  cepOriginEnd?: string;
  cepDestinationStart?: string;
  cepDestinationEnd?: string;
  deadlineDays?: string;
  weightRanges?: string;
  weightRangeRows?: Record<number, { minWeight?: string; maxWeight?: string; price?: string }>;
  api?: string;
}

function formatCep(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length > 5) {
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  }
  return digits;
}

function stripCep(formatted: string): string {
  return formatted.replace(/\D/g, "");
}

function displayCep(raw: string): string {
  if (raw.length === 8) {
    return `${raw.slice(0, 5)}-${raw.slice(5)}`;
  }
  return raw;
}

function generateKey(): string {
  return Math.random().toString(36).slice(2, 10);
}

const EMPTY_RANGE: () => WeightRangeRow = () => ({
  key: generateKey(),
  minWeight: "",
  maxWeight: "",
  price: "",
});

function buildInitialValues(table: PriceTableResponse | null): FormValues {
  if (table) {
    return {
      carrierId: table.carrierId,
      cepOriginStart: displayCep(table.cepOriginStart),
      cepOriginEnd: displayCep(table.cepOriginEnd),
      cepDestinationStart: displayCep(table.cepDestinationStart),
      cepDestinationEnd: displayCep(table.cepDestinationEnd),
      deadlineDays: String(table.deadlineDays),
      active: table.active,
      weightRanges: table.weightRanges.map((wr) => ({
        key: generateKey(),
        minWeight: String(wr.minWeight),
        maxWeight: String(wr.maxWeight),
        price: String(wr.price),
      })),
    };
  }
  return {
    carrierId: "",
    cepOriginStart: "",
    cepOriginEnd: "",
    cepDestinationStart: "",
    cepDestinationEnd: "",
    deadlineDays: "",
    active: true,
    weightRanges: [EMPTY_RANGE()],
  };
}

export default function PriceTableForm({
  editingTable,
  onClose,
  onSuccess,
}: PriceTableFormProps) {
  const [carriers, setCarriers] = useState<CarrierResponse[]>([]);
  const [loadingCarriers, setLoadingCarriers] = useState(true);
  const [values, setValues] = useState<FormValues>(() => buildInitialValues(editingTable));
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function fetchCarriers() {
      try {
        const res = await fetch("/api/carriers");
        if (!res.ok) throw new Error("Falha ao carregar transportadoras");
        const body: CarriersResponse = await res.json();
        if (!cancelled) {
          setCarriers(body.data);
        }
      } catch {
        if (!cancelled) {
          setErrors((prev) => ({ ...prev, api: "Erro ao carregar transportadoras" }));
        }
      } finally {
        if (!cancelled) setLoadingCarriers(false);
      }
    }
    fetchCarriers();
    return () => { cancelled = true; };
  }, []);

  const handleCepChange = useCallback(
    (field: "cepOriginStart" | "cepOriginEnd" | "cepDestinationStart" | "cepDestinationEnd", raw: string) => {
      const formatted = formatCep(raw);
      setValues((prev) => ({ ...prev, [field]: formatted }));
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    },
    []
  );

  const handleNumberFieldChange = useCallback(
    (field: "deadlineDays", raw: string) => {
      const sanitized = raw.replace(/[^0-9]/g, "");
      setValues((prev) => ({ ...prev, [field]: sanitized }));
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    },
    []
  );

  const handleRangeChange = useCallback(
    (index: number, field: "minWeight" | "maxWeight" | "price", raw: string) => {
      const sanitized = raw.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1");
      setValues((prev) => {
        const updated = [...prev.weightRanges];
        updated[index] = { ...updated[index], [field]: sanitized };
        return { ...prev, weightRanges: updated };
      });
      setErrors((prev) => {
        const updatedRows = { ...prev.weightRangeRows };
        if (updatedRows[index]) {
          updatedRows[index] = { ...updatedRows[index], [field]: undefined };
        }
        return { ...prev, weightRangeRows: updatedRows, weightRanges: undefined };
      });
    },
    []
  );

  const addRange = useCallback(() => {
    setValues((prev) => ({
      ...prev,
      weightRanges: [...prev.weightRanges, EMPTY_RANGE()],
    }));
  }, []);

  const removeRange = useCallback((index: number) => {
    setValues((prev) => {
      if (prev.weightRanges.length <= 1) return prev;
      const updated = prev.weightRanges.filter((_, i) => i !== index);
      return { ...prev, weightRanges: updated };
    });
  }, []);

  function validate(): FormErrors {
    const errs: FormErrors = {};

    if (!values.carrierId) {
      errs.carrierId = "Selecione uma transportadora";
    }

    const originStart = stripCep(values.cepOriginStart);
    if (!originStart) {
      errs.cepOriginStart = "CEP de origem inicial e obrigatorio";
    } else if (originStart.length !== 8) {
      errs.cepOriginStart = "CEP deve ter 8 digitos";
    }

    const originEnd = stripCep(values.cepOriginEnd);
    if (!originEnd) {
      errs.cepOriginEnd = "CEP de origem final e obrigatorio";
    } else if (originEnd.length !== 8) {
      errs.cepOriginEnd = "CEP deve ter 8 digitos";
    } else if (originStart.length === 8 && originEnd < originStart) {
      errs.cepOriginEnd = "CEP final deve ser >= CEP inicial";
    }

    const destStart = stripCep(values.cepDestinationStart);
    if (!destStart) {
      errs.cepDestinationStart = "CEP de destino inicial e obrigatorio";
    } else if (destStart.length !== 8) {
      errs.cepDestinationStart = "CEP deve ter 8 digitos";
    }

    const destEnd = stripCep(values.cepDestinationEnd);
    if (!destEnd) {
      errs.cepDestinationEnd = "CEP de destino final e obrigatorio";
    } else if (destEnd.length !== 8) {
      errs.cepDestinationEnd = "CEP deve ter 8 digitos";
    } else if (destStart.length === 8 && destEnd < destStart) {
      errs.cepDestinationEnd = "CEP final deve ser >= CEP inicial";
    }

    const deadline = parseInt(values.deadlineDays, 10);
    if (!values.deadlineDays || isNaN(deadline)) {
      errs.deadlineDays = "Prazo e obrigatorio";
    } else if (deadline < 1) {
      errs.deadlineDays = "Prazo minimo e 1 dia";
    }

    if (values.weightRanges.length === 0) {
      errs.weightRanges = "Pelo menos uma faixa de peso e obrigatoria";
    }

    const rowErrors: Record<number, { minWeight?: string; maxWeight?: string; price?: string }> = {};
    values.weightRanges.forEach((range, i) => {
      const rowErr: { minWeight?: string; maxWeight?: string; price?: string } = {};
      const min = parseFloat(range.minWeight);
      const max = parseFloat(range.maxWeight);
      const price = parseFloat(range.price);

      if (range.minWeight === "" || isNaN(min)) {
        rowErr.minWeight = "Obrigatorio";
      } else if (min < 0) {
        rowErr.minWeight = "Deve ser >= 0";
      }

      if (range.maxWeight === "" || isNaN(max)) {
        rowErr.maxWeight = "Obrigatorio";
      } else if (max <= 0) {
        rowErr.maxWeight = "Deve ser > 0";
      } else if (!isNaN(min) && max <= min) {
        rowErr.maxWeight = "Deve ser > peso min.";
      }

      if (range.price === "" || isNaN(price)) {
        rowErr.price = "Obrigatorio";
      } else if (price <= 0) {
        rowErr.price = "Deve ser > 0";
      }

      if (Object.keys(rowErr).length > 0) {
        rowErrors[i] = rowErr;
      }
    });

    if (Object.keys(rowErrors).length > 0) {
      errs.weightRangeRows = rowErrors;
    }

    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fieldErrors = validate();
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    setErrors({});

    const payload: PriceTableCreateRequest = {
      carrierId: values.carrierId,
      cepOriginStart: stripCep(values.cepOriginStart),
      cepOriginEnd: stripCep(values.cepOriginEnd),
      cepDestinationStart: stripCep(values.cepDestinationStart),
      cepDestinationEnd: stripCep(values.cepDestinationEnd),
      deadlineDays: parseInt(values.deadlineDays, 10),
      active: values.active,
      weightRanges: values.weightRanges.map((r) => ({
        minWeight: parseFloat(r.minWeight),
        maxWeight: parseFloat(r.maxWeight),
        price: parseFloat(r.price),
      })),
    };

    try {
      const isEdit = editingTable !== null;
      const url = isEdit ? `/api/price-tables/${editingTable.id}` : "/api/price-tables";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

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
        throw new Error(`Erro ao salvar tabela (status ${res.status})`);
      }

      // Validate response shape
      const responseBody = await res.json() as PriceTableSingleResponse;
      if (!responseBody.data?.id) {
        throw new Error("Resposta inesperada do servidor");
      }

      onSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro inesperado ao salvar";
      setErrors({ api: message });
    } finally {
      setSubmitting(false);
    }
  }

  const isEdit = editingTable !== null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-8 sm:pt-16"
      role="dialog"
      aria-modal="true"
      aria-label={isEdit ? "Editar tabela de preco" : "Nova tabela de preco"}
    >
      <div className="w-full max-w-2xl rounded-xl border border-zinc-200 bg-white shadow-xl">
        {/* Modal header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-zinc-900">
            {isEdit ? "Editar Tabela de Preco" : "Nova Tabela de Preco"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
            aria-label="Fechar"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal body */}
        <form onSubmit={handleSubmit} noValidate className="space-y-5 px-6 py-5">
          {/* API error */}
          {errors.api && (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-700">{errors.api}</p>
            </div>
          )}

          {/* Carrier selector */}
          <div>
            <label htmlFor="carrierId" className="block text-sm font-medium text-zinc-700">
              Transportadora
            </label>
            {loadingCarriers ? (
              <div className="mt-1 h-10 animate-pulse rounded-lg bg-zinc-100" />
            ) : (
              <select
                id="carrierId"
                value={values.carrierId}
                onChange={(e) => {
                  setValues((prev) => ({ ...prev, carrierId: e.target.value }));
                  setErrors((prev) => ({ ...prev, carrierId: undefined }));
                }}
                aria-invalid={!!errors.carrierId}
                className={`mt-1 block w-full rounded-lg border px-3 py-2.5 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.carrierId ? "border-red-400 bg-red-50" : "border-zinc-300 bg-white"
                }`}
              >
                <option value="">Selecione...</option>
                {carriers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            )}
            {errors.carrierId && (
              <p className="mt-1 text-xs text-red-600">{errors.carrierId}</p>
            )}
          </div>

          {/* CEP Origin */}
          <fieldset>
            <legend className="text-sm font-medium text-zinc-700">Faixa de CEP de Origem</legend>
            <div className="mt-1 grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="cepOriginStart" className="block text-xs text-zinc-500">
                  Inicio
                </label>
                <input
                  id="cepOriginStart"
                  type="text"
                  inputMode="numeric"
                  placeholder="00000-000"
                  value={values.cepOriginStart}
                  onChange={(e) => handleCepChange("cepOriginStart", e.target.value)}
                  aria-invalid={!!errors.cepOriginStart}
                  className={`mt-0.5 block w-full rounded-lg border px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.cepOriginStart ? "border-red-400 bg-red-50" : "border-zinc-300 bg-white"
                  }`}
                />
                {errors.cepOriginStart && (
                  <p className="mt-0.5 text-xs text-red-600">{errors.cepOriginStart}</p>
                )}
              </div>
              <div>
                <label htmlFor="cepOriginEnd" className="block text-xs text-zinc-500">
                  Fim
                </label>
                <input
                  id="cepOriginEnd"
                  type="text"
                  inputMode="numeric"
                  placeholder="00000-000"
                  value={values.cepOriginEnd}
                  onChange={(e) => handleCepChange("cepOriginEnd", e.target.value)}
                  aria-invalid={!!errors.cepOriginEnd}
                  className={`mt-0.5 block w-full rounded-lg border px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.cepOriginEnd ? "border-red-400 bg-red-50" : "border-zinc-300 bg-white"
                  }`}
                />
                {errors.cepOriginEnd && (
                  <p className="mt-0.5 text-xs text-red-600">{errors.cepOriginEnd}</p>
                )}
              </div>
            </div>
          </fieldset>

          {/* CEP Destination */}
          <fieldset>
            <legend className="text-sm font-medium text-zinc-700">Faixa de CEP de Destino</legend>
            <div className="mt-1 grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="cepDestinationStart" className="block text-xs text-zinc-500">
                  Inicio
                </label>
                <input
                  id="cepDestinationStart"
                  type="text"
                  inputMode="numeric"
                  placeholder="00000-000"
                  value={values.cepDestinationStart}
                  onChange={(e) => handleCepChange("cepDestinationStart", e.target.value)}
                  aria-invalid={!!errors.cepDestinationStart}
                  className={`mt-0.5 block w-full rounded-lg border px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.cepDestinationStart ? "border-red-400 bg-red-50" : "border-zinc-300 bg-white"
                  }`}
                />
                {errors.cepDestinationStart && (
                  <p className="mt-0.5 text-xs text-red-600">{errors.cepDestinationStart}</p>
                )}
              </div>
              <div>
                <label htmlFor="cepDestinationEnd" className="block text-xs text-zinc-500">
                  Fim
                </label>
                <input
                  id="cepDestinationEnd"
                  type="text"
                  inputMode="numeric"
                  placeholder="00000-000"
                  value={values.cepDestinationEnd}
                  onChange={(e) => handleCepChange("cepDestinationEnd", e.target.value)}
                  aria-invalid={!!errors.cepDestinationEnd}
                  className={`mt-0.5 block w-full rounded-lg border px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.cepDestinationEnd ? "border-red-400 bg-red-50" : "border-zinc-300 bg-white"
                  }`}
                />
                {errors.cepDestinationEnd && (
                  <p className="mt-0.5 text-xs text-red-600">{errors.cepDestinationEnd}</p>
                )}
              </div>
            </div>
          </fieldset>

          {/* Deadline + Active */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="deadlineDays" className="block text-sm font-medium text-zinc-700">
                Prazo (dias uteis)
              </label>
              <input
                id="deadlineDays"
                type="text"
                inputMode="numeric"
                placeholder="Ex: 5"
                value={values.deadlineDays}
                onChange={(e) => handleNumberFieldChange("deadlineDays", e.target.value)}
                aria-invalid={!!errors.deadlineDays}
                className={`mt-1 block w-full rounded-lg border px-3 py-2.5 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.deadlineDays ? "border-red-400 bg-red-50" : "border-zinc-300 bg-white"
                }`}
              />
              {errors.deadlineDays && (
                <p className="mt-1 text-xs text-red-600">{errors.deadlineDays}</p>
              )}
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 py-2.5">
                <input
                  type="checkbox"
                  checked={values.active}
                  onChange={(e) => setValues((prev) => ({ ...prev, active: e.target.checked }))}
                  className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-zinc-700">Ativa</span>
              </label>
            </div>
          </div>

          {/* Weight ranges */}
          <fieldset>
            <legend className="text-sm font-medium text-zinc-700">Faixas de Peso</legend>
            {errors.weightRanges && (
              <p className="mt-1 text-xs text-red-600">{errors.weightRanges}</p>
            )}
            <div className="mt-2 space-y-2">
              {/* Header */}
              <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 text-xs font-medium text-zinc-500">
                <span>Peso min. (kg)</span>
                <span>Peso max. (kg)</span>
                <span>Preco (R$)</span>
                <span className="w-8" />
              </div>
              {values.weightRanges.map((range, index) => {
                const rowErr = errors.weightRangeRows?.[index];
                return (
                  <div key={range.key} className="grid grid-cols-[1fr_1fr_1fr_auto] items-start gap-2">
                    <div>
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="0"
                        value={range.minWeight}
                        onChange={(e) => handleRangeChange(index, "minWeight", e.target.value)}
                        aria-label={`Peso minimo faixa ${index + 1}`}
                        aria-invalid={!!rowErr?.minWeight}
                        className={`block w-full rounded-lg border px-2.5 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          rowErr?.minWeight ? "border-red-400 bg-red-50" : "border-zinc-300 bg-white"
                        }`}
                      />
                      {rowErr?.minWeight && (
                        <p className="mt-0.5 text-xs text-red-600">{rowErr.minWeight}</p>
                      )}
                    </div>
                    <div>
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="10"
                        value={range.maxWeight}
                        onChange={(e) => handleRangeChange(index, "maxWeight", e.target.value)}
                        aria-label={`Peso maximo faixa ${index + 1}`}
                        aria-invalid={!!rowErr?.maxWeight}
                        className={`block w-full rounded-lg border px-2.5 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          rowErr?.maxWeight ? "border-red-400 bg-red-50" : "border-zinc-300 bg-white"
                        }`}
                      />
                      {rowErr?.maxWeight && (
                        <p className="mt-0.5 text-xs text-red-600">{rowErr.maxWeight}</p>
                      )}
                    </div>
                    <div>
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="25.90"
                        value={range.price}
                        onChange={(e) => handleRangeChange(index, "price", e.target.value)}
                        aria-label={`Preco faixa ${index + 1}`}
                        aria-invalid={!!rowErr?.price}
                        className={`block w-full rounded-lg border px-2.5 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          rowErr?.price ? "border-red-400 bg-red-50" : "border-zinc-300 bg-white"
                        }`}
                      />
                      {rowErr?.price && (
                        <p className="mt-0.5 text-xs text-red-600">{rowErr.price}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeRange(index)}
                      disabled={values.weightRanges.length <= 1}
                      className="mt-0.5 rounded-lg p-2 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
                      aria-label={`Remover faixa ${index + 1}`}
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
            <button
              type="button"
              onClick={addRange}
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Adicionar faixa
            </button>
          </fieldset>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-zinc-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || loadingCarriers}
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Salvando...
                </span>
              ) : isEdit ? (
                "Salvar Alteracoes"
              ) : (
                "Criar Tabela"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
