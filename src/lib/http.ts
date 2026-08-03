import { NextResponse } from "next/server";

export function json(data: unknown, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

export function apiError(status: number, message: string, code?: string) {
  return NextResponse.json({ error: message, code }, { status });
}

export const unauthorized = () => apiError(401, "Not signed in", "UNAUTHORIZED");
export const notFound = () => apiError(404, "Not found", "NOT_FOUND");

export function badRequest(message = "Invalid request") {
  return apiError(400, message, "BAD_REQUEST");
}
