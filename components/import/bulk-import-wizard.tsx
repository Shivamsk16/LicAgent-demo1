"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";

const TYPES = [
  { id: "customers", label: "Customers" },
  { id: "policies", label: "Policies" },
  { id: "payments", label: "Payments" },
] as const;

type ImportType = (typeof TYPES)[number]["id"];

export function BulkImportWizard() {
  const [importType, setImportType] = useState<ImportType>("customers");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<{
    headers: string[];
    preview: Record<string, string>[];
    totalRows: number;
  } | null>(null);
  const [result, setResult] = useState<{
    success: number;
    failed: number;
    errors: { row: number; error: string }[];
    status: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [skipErrors, setSkipErrors] = useState(true);

  async function handlePreview() {
    if (!file) return;
    setLoading(true);
    setResult(null);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("preview", "true");
    const res = await fetch(`/api/import/${importType}`, { method: "POST", body: fd });
    const json = await res.json();
    setLoading(false);
    if (json.success) setPreview(json.data);
    else alert(json.error?.message ?? "Preview failed");
  }

  async function runImport() {
    if (!file) return;
    setLoading(true);
    const fd = new FormData();
    fd.append("file", file);
    if (skipErrors) fd.append("skip_errors", "true");
    const res = await fetch(`/api/import/${importType}`, { method: "POST", body: fd });
    const json = await res.json();
    setLoading(false);
    if (json.success) {
      setResult({
        success: json.data.success,
        failed: json.data.failed,
        errors: json.data.errors ?? [],
        status: json.data.status,
      });
    } else {
      alert(json.error?.message ?? "Import failed");
    }
  }

  function downloadTemplate() {
    window.open(`/api/import/templates/${importType}`, "_blank");
  }

  function downloadErrors() {
    if (!result?.errors.length) return;
    const csv = ["row,error", ...result.errors.map((e) => `${e.row},"${e.error.replace(/"/g, '""')}"`)].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${importType}-errors.csv`;
    a.click();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bulk import"
        description="Import customers, policies, or payments from CSV (save Excel as CSV)"
      />

      <div className="flex flex-wrap gap-2">
        {TYPES.map((t) => (
          <Button
            key={t.id}
            variant={importType === t.id ? "primary" : "secondary"}
            size="sm"
            onClick={() => {
              setImportType(t.id);
              setPreview(null);
              setResult(null);
            }}
          >
            {t.label}
          </Button>
        ))}
      </div>

      <div className="rounded-card border bg-white p-6 shadow-card space-y-4">
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" size="sm" onClick={downloadTemplate}>
            Download template
          </Button>
        </div>

        <div className="border-2 border-dashed border-lic-neutral-200 rounded-card p-8 text-center">
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              setPreview(null);
              setResult(null);
            }}
            className="text-sm"
          />
          <p className="mt-2 text-xs text-lic-neutral-500">CSV only · max 10MB</p>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={skipErrors}
            onChange={(e) => setSkipErrors(e.target.checked)}
          />
          Skip invalid rows and import valid ones
        </label>

        <div className="flex gap-2">
          <Button variant="secondary" disabled={!file || loading} onClick={handlePreview}>
            Preview
          </Button>
          <Button disabled={!file || loading} onClick={runImport}>
            {loading ? "Processing…" : "Import"}
          </Button>
        </div>
      </div>

      {preview && (
        <div className="rounded-card border bg-white p-4 shadow-card">
          <h3 className="font-semibold text-sm">
            Preview ({preview.totalRows} rows)
          </h3>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  {preview.headers.map((h) => (
                    <th key={h} className="px-2 py-1 text-left border-b">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.preview.map((row, i) => (
                  <tr key={i}>
                    {preview.headers.map((h) => (
                      <td key={h} className="px-2 py-1 border-b">{row[h]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {result && (
        <div className="rounded-card border bg-white p-4 shadow-card">
          <h3 className="font-semibold">Import {result.status}</h3>
          <p className="text-sm mt-1">
            {result.success} succeeded · {result.failed} failed
          </p>
          {result.errors.length > 0 && (
            <Button variant="secondary" size="sm" className="mt-3" onClick={downloadErrors}>
              Download error report
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
