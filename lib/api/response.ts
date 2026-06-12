import { NextResponse } from "next/server";

export function apiError(
  code: string,
  message: string,
  status: number,
  field?: string
) {
  return NextResponse.json(
    { success: false, error: { code, message, field } },
    { status }
  );
}

export function apiSuccess<T>(
  data: T,
  status = 200,
  meta?: Record<string, unknown>
) {
  return NextResponse.json({ success: true, data, ...meta }, { status });
}
