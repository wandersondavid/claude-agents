import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { simulateRequestSchema, simulateResponseSchema } from "@/lib/schemas";
import { simulateFreight } from "@/lib/services/simulate-service";
import { ApiError, handleApiError } from "@/lib/errors";

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();

    const parsed = simulateRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError("VALIDATION_ERROR", "Invalid request body", 400, parsed.error.flatten());
    }

    const result = await simulateFreight(parsed.data);
    const response = simulateResponseSchema.parse(result);

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof ApiError) {
      return error.toResponse();
    }
    if (error instanceof ZodError) {
      return new ApiError(
        "VALIDATION_ERROR",
        "Invalid request body",
        400,
        error.flatten()
      ).toResponse();
    }
    return handleApiError(error);
  }
}
