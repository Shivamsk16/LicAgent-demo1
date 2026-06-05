"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { toast } from "@/lib/toast";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
  const [error, setError] = useState("");

  async function handlePreview() {
    if (!file) return;
    setLoading(true);
    setResult(null);
    setError("");
    const fd = new FormData();
    fd.append("file", file);
    fd.append("preview", "true");
    const res = await fetch(`/api/import/${importType}`, { method: "POST", body: fd });
    const json = await res.json();
    setLoading(false);
    if (json.success) {
      setPreview(json.data);
    } else {
      const msg = json.error?.message ?? "Preview failed";
      setError(msg);
      toast.error("Preview failed", msg);
    }
  }

  async function runImport() {
    if (!file) return;
    setLoading(true);
    setError("");
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
      toast.success("Import complete", `${json.data.success} rows imported`);
    } else {
      const msg = json.error?.message ?? "Import failed";
      setError(msg);
      toast.error("Import failed", msg);
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
    <div className="section-gap">
      <PageHeader
        title="Bulk import"
        description="Import customers, policies, or payments from CSV (save Excel as CSV)"
        backHref="/dashboard/settings"
        backLabel="Back to settings"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Settings", href: "/dashboard/settings" },
          { label: "Bulk import" },
        ]}
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
              setError("");
            }}
          >
            {t.label}
          </Button>
        ))}
      </div>

      <div className="rounded-xl bg-lic-neutral-0 p-6 ring-1 ring-black/\[0\.06\] space-y-4">
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
              setError("");
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

        {error && <Alert variant="error">{error}</Alert>}

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
        <div className="rounded-xl bg-lic-neutral-0 p-5 ring-1 ring-black/\[0\.06\]">
          <h3 className="font-semibold text-sm text-lic-neutral-900">
            Preview ({preview.totalRows} rows)
          </h3>
          <div className="mt-3">
          <TableContainer>
            <Table className="text-xs">
              <TableHeader>
                <TableRow>
                  {preview.headers.map((h) => (
                    <TableHead key={h}>{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {preview.preview.map((row, i) => (
                  <TableRow key={i}>
                    {preview.headers.map((h) => (
                      <TableCell key={h}>{row[h]}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          </div>
        </div>
      )}

      {result && (
        <div className="rounded-xl bg-lic-neutral-0 p-5 ring-1 ring-black/\[0\.06\]">
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
