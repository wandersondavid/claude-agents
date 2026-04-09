import { NextResponse } from "next/server";

export type ErrorCode = "VALIDATION_ERROR" | "NOT_FOUND" | "INTERNAL_ERROR";

export interface ApiErrorResponse {
  error: {
    code: ErrorCode;
    message: string;
    details?: unknown;
  };
}

export class ApiError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly statusCode: number = 400,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }

  toResponse(): NextResponse<ApiErrorResponse> {
    return NextResponse.json(
      {
        error: {
          code: this.code,
          message: this.message,
          ...(this.details !== undefined && { details: this.details }),
        },
      },
      { status: this.statusCode }
    );
  }
}

export function handleApiError(error: unknown): NextResponse<ApiErrorResponse> {
  if (error instanceof ApiError) {
    return error.toResponse();
  }

  const message =
    error instanceof Error ? error.message : "An unexpected error occurred";

  return new ApiError("INTERNAL_ERROR", message, 500).toResponse();
}
