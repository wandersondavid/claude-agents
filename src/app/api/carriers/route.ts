import { NextResponse } from "next/server";
import { carriersResponseSchema } from "@/lib/schemas";
import type { CarriersResponse } from "@/lib/schemas";
import { listCarriers } from "@/lib/services/carrier-service";
import { handleApiError } from "@/lib/errors";

export async function GET() {
  try {
    const result = await listCarriers();
    const response = carriersResponseSchema.parse(result);
    return NextResponse.json(response);
  } catch (error) {
    return handleApiError(error);
  }
}
