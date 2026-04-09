"use client";

import { useState, useCallback } from "react";
import type { SimulationFormValues, SimulateRequest } from "@/lib/types";

interface SimulationFormProps {
  onSubmit: (data: SimulateRequest) => Promise<void>;
  isLoading: boolean;
  initialValues?: SimulationFormValues;
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

interface FieldError {
  originCep?: string;
  destinationCep?: string;
  weight?: string;
  height?: string;
  width?: string;
  length?: string;
}

const EMPTY_FORM: SimulationFormValues = {
  originCep: "",
  destinationCep: "",
  weight: "",
  height: "",
  width: "",
  length: "",
};

export default function SimulationForm({
  onSubmit,
  isLoading,
  initialValues,
}: SimulationFormProps) {
  const [values, setValues] = useState<SimulationFormValues>(
    initialValues ?? EMPTY_FORM
  );
  const [errors, setErrors] = useState<FieldError>({});

  const handleCepChange = useCallback(
    (field: "originCep" | "destinationCep", raw: string) => {
      const formatted = formatCep(raw);
      setValues((prev) => ({ ...prev, [field]: formatted }));
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    },
    []
  );

  const handleNumberChange = useCallback(
    (field: "weight" | "height" | "width" | "length", raw: string) => {
      // Allow empty, digits, and one decimal point (for weight)
      const sanitized =
        field === "weight"
          ? raw.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1")
          : raw.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1");
      setValues((prev) => ({ ...prev, [field]: sanitized }));
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    },
    []
  );

  function validate(): FieldError {
    const errs: FieldError = {};

    const originDigits = stripCep(values.originCep);
    if (!originDigits) {
      errs.originCep = "CEP de origem e obrigatorio";
    } else if (originDigits.length !== 8) {
      errs.originCep = "CEP deve ter 8 digitos";
    }

    const destDigits = stripCep(values.destinationCep);
    if (!destDigits) {
      errs.destinationCep = "CEP de destino e obrigatorio";
    } else if (destDigits.length !== 8) {
      errs.destinationCep = "CEP deve ter 8 digitos";
    }

    const weight = parseFloat(values.weight);
    if (!values.weight || isNaN(weight)) {
      errs.weight = "Peso e obrigatorio";
    } else if (weight < 0.1) {
      errs.weight = "Peso minimo e 0,1 kg";
    } else if (weight > 150) {
      errs.weight = "Peso maximo e 150 kg";
    }

    const height = parseFloat(values.height);
    if (!values.height || isNaN(height)) {
      errs.height = "Altura e obrigatoria";
    } else if (height < 1) {
      errs.height = "Altura minima e 1 cm";
    } else if (height > 200) {
      errs.height = "Altura maxima e 200 cm";
    }

    const width = parseFloat(values.width);
    if (!values.width || isNaN(width)) {
      errs.width = "Largura e obrigatoria";
    } else if (width < 1) {
      errs.width = "Largura minima e 1 cm";
    } else if (width > 200) {
      errs.width = "Largura maxima e 200 cm";
    }

    const length = parseFloat(values.length);
    if (!values.length || isNaN(length)) {
      errs.length = "Comprimento e obrigatorio";
    } else if (length < 1) {
      errs.length = "Comprimento minimo e 1 cm";
    } else if (length > 200) {
      errs.length = "Comprimento maximo e 200 cm";
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

    const request: SimulateRequest = {
      originCep: stripCep(values.originCep),
      destinationCep: stripCep(values.destinationCep),
      weight: parseFloat(values.weight),
      height: parseFloat(values.height),
      width: parseFloat(values.width),
      length: parseFloat(values.length),
    };

    await onSubmit(request);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Origin CEP */}
        <div>
          <label
            htmlFor="originCep"
            className="block text-sm font-medium text-zinc-700"
          >
            CEP de Origem
          </label>
          <input
            id="originCep"
            type="text"
            inputMode="numeric"
            placeholder="00000-000"
            value={values.originCep}
            onChange={(e) => handleCepChange("originCep", e.target.value)}
            aria-invalid={!!errors.originCep}
            aria-describedby={errors.originCep ? "originCep-error" : undefined}
            className={`mt-1 block w-full rounded-lg border px-3 py-2.5 text-sm text-zinc-900 shadow-sm transition-colors placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.originCep
                ? "border-red-400 bg-red-50"
                : "border-zinc-300 bg-white"
            }`}
          />
          {errors.originCep && (
            <p id="originCep-error" className="mt-1 text-xs text-red-600">
              {errors.originCep}
            </p>
          )}
        </div>

        {/* Destination CEP */}
        <div>
          <label
            htmlFor="destinationCep"
            className="block text-sm font-medium text-zinc-700"
          >
            CEP de Destino
          </label>
          <input
            id="destinationCep"
            type="text"
            inputMode="numeric"
            placeholder="00000-000"
            value={values.destinationCep}
            onChange={(e) => handleCepChange("destinationCep", e.target.value)}
            aria-invalid={!!errors.destinationCep}
            aria-describedby={
              errors.destinationCep ? "destinationCep-error" : undefined
            }
            className={`mt-1 block w-full rounded-lg border px-3 py-2.5 text-sm text-zinc-900 shadow-sm transition-colors placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.destinationCep
                ? "border-red-400 bg-red-50"
                : "border-zinc-300 bg-white"
            }`}
          />
          {errors.destinationCep && (
            <p
              id="destinationCep-error"
              className="mt-1 text-xs text-red-600"
            >
              {errors.destinationCep}
            </p>
          )}
        </div>
      </div>

      {/* Weight */}
      <div>
        <label
          htmlFor="weight"
          className="block text-sm font-medium text-zinc-700"
        >
          Peso (kg)
        </label>
        <input
          id="weight"
          type="text"
          inputMode="decimal"
          placeholder="Ex: 2.5"
          value={values.weight}
          onChange={(e) => handleNumberChange("weight", e.target.value)}
          aria-invalid={!!errors.weight}
          aria-describedby={errors.weight ? "weight-error" : undefined}
          className={`mt-1 block w-full rounded-lg border px-3 py-2.5 text-sm text-zinc-900 shadow-sm transition-colors placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.weight
              ? "border-red-400 bg-red-50"
              : "border-zinc-300 bg-white"
          }`}
        />
        {errors.weight && (
          <p id="weight-error" className="mt-1 text-xs text-red-600">
            {errors.weight}
          </p>
        )}
      </div>

      {/* Dimensions */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label
            htmlFor="height"
            className="block text-sm font-medium text-zinc-700"
          >
            Altura (cm)
          </label>
          <input
            id="height"
            type="text"
            inputMode="decimal"
            placeholder="Ex: 30"
            value={values.height}
            onChange={(e) => handleNumberChange("height", e.target.value)}
            aria-invalid={!!errors.height}
            aria-describedby={errors.height ? "height-error" : undefined}
            className={`mt-1 block w-full rounded-lg border px-3 py-2.5 text-sm text-zinc-900 shadow-sm transition-colors placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.height
                ? "border-red-400 bg-red-50"
                : "border-zinc-300 bg-white"
            }`}
          />
          {errors.height && (
            <p id="height-error" className="mt-1 text-xs text-red-600">
              {errors.height}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="width"
            className="block text-sm font-medium text-zinc-700"
          >
            Largura (cm)
          </label>
          <input
            id="width"
            type="text"
            inputMode="decimal"
            placeholder="Ex: 20"
            value={values.width}
            onChange={(e) => handleNumberChange("width", e.target.value)}
            aria-invalid={!!errors.width}
            aria-describedby={errors.width ? "width-error" : undefined}
            className={`mt-1 block w-full rounded-lg border px-3 py-2.5 text-sm text-zinc-900 shadow-sm transition-colors placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.width
                ? "border-red-400 bg-red-50"
                : "border-zinc-300 bg-white"
            }`}
          />
          {errors.width && (
            <p id="width-error" className="mt-1 text-xs text-red-600">
              {errors.width}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="length"
            className="block text-sm font-medium text-zinc-700"
          >
            Comprimento (cm)
          </label>
          <input
            id="length"
            type="text"
            inputMode="decimal"
            placeholder="Ex: 40"
            value={values.length}
            onChange={(e) => handleNumberChange("length", e.target.value)}
            aria-invalid={!!errors.length}
            aria-describedby={errors.length ? "length-error" : undefined}
            className={`mt-1 block w-full rounded-lg border px-3 py-2.5 text-sm text-zinc-900 shadow-sm transition-colors placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.length
                ? "border-red-400 bg-red-50"
                : "border-zinc-300 bg-white"
            }`}
          />
          {errors.length && (
            <p id="length-error" className="mt-1 text-xs text-red-600">
              {errors.length}
            </p>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg
              className="h-4 w-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Simulando...
          </span>
        ) : (
          "Simular Frete"
        )}
      </button>
    </form>
  );
}
