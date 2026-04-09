import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  priceTableUpdateSchema,
  priceTableSingleResponseSchema,
  deleteResponseSchema,
} from "@/lib/schemas";
import {
  getPriceTableById,
  updatePriceTable,
  deletePriceTable,
} from "@/lib/services/price-table-service";
import { ApiError, handleApiError } from "@/lib/errors";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params;
    const result = await getPriceTableById(id);
    const response = priceTableSingleResponseSchema.parse({ data: result });
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof ApiError) {
      return error.toResponse();
    }
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params;
    const body: unknown = await request.json();

    const parsed = priceTableUpdateSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(
        "VALIDATION_ERROR",
        "Invalid request body",
        400,
        parsed.error.flatten()
      );
    }

    const result = await updatePriceTable(id, parsed.data);
    const response = priceTableSingleResponseSchema.parse({ data: result });
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

export async function DELETE(_request: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params;
    await deletePriceTable(id);
    const response = deleteResponseSchema.parse({ success: true });
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof ApiError) {
      return error.toResponse();
    }
    return handleApiError(error);
  }
}
