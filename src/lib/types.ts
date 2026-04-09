/**
 * Shared frontend types for the freight simulator.
 * Types here are derived from the backend schemas in @/lib/schemas.ts
 * to maintain a single source of truth.
 */

import type { SimulateRequest, SimulateResponse } from "@/lib/schemas";
import type { ApiErrorResponse } from "@/lib/errors";

// Re-export backend types for convenient frontend use
export type { SimulateRequest, SimulateResponse, ApiErrorResponse };

// Derived types for individual result items
export type SimulationResult = SimulateResponse["results"][number];
export type SimulationInput = SimulateResponse["input"];

// Sort options for carrier comparison
export type SortOption = "price" | "deadline";

// History entry stored in localStorage
export interface HistoryEntry {
  id: string;
  date: string;
  originCep: string;
  destinationCep: string;
  weight: number;
  dimensions: {
    height: number;
    width: number;
    length: number;
  };
  results: SimulateResponse["results"];
}

// Form field values (CEP formatted with mask, numbers as strings for input)
export interface SimulationFormValues {
  originCep: string;
  destinationCep: string;
  weight: string;
  height: string;
  width: string;
  length: string;
}
