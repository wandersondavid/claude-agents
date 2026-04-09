import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  priceTableListQuerySchema,
  priceTableCreateSchema,
  priceTableListResponseSchema,
  priceTableSingleResponseSchema,
} from "@/lib/schemas";
import {
  listPriceTables,
  createPriceTable,
} from "@/lib/services/price-table-service";
import { ApiError, handleApiError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const queryParsed = priceTableListQuerySchema.safeParse({
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      carrierId: searchParams.get("carrierId") ?? undefined,
      active: searchParams.get("active") ?? undefined,
    });

    if (!queryParsed.success) {
      throw new ApiError(
        "VALIDATION_ERROR",
        "Invalid query parameters",
        400,
        queryParsed.error.flatten()
      );
    }

    const result = await listPriceTables(queryParsed.data);
    const response = priceTableListResponseSchema.parse(result);
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof ApiError) {
      return error.toResponse();
    }
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();

    const parsed = priceTableCreateSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(
        "VALIDATION_ERROR",
        "Invalid request body",
        400,
        parsed.error.flatten()
      );
    }

    const result = await createPriceTable(parsed.data);
    const response = priceTableSingleResponseSchema.parse({ data: result });
    return NextResponse.json(response, { status: 201 });
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
