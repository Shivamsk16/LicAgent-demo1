import { IMPORT_TEMPLATES, type ImportType } from "@/lib/import/templates";
import { apiError } from "@/lib/api/response";

const TYPES: ImportType[] = ["customers", "policies", "payments"];

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ type: string }> }
) {
  const { type } = await params;
  if (!TYPES.includes(type as ImportType)) {
    return apiError("NOT_FOUND", "Unknown import type", 404);
  }

  const csv = IMPORT_TEMPLATES[type as ImportType];
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${type}-import-template.csv"`,
    },
  });
}
