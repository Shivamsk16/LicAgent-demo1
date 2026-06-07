import { NextResponse } from "next/server";

export function apiUnauthorizedResponse(message = "Not signed in") {
  return NextResponse.json(
    {
      success: false,
      error: { code: "UNAUTHORIZED", message },
    },
    { status: 401 }
  );
}
