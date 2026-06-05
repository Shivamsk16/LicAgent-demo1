import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET_KYC ?? "kyc-documents";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "application/pdf",
];
const MAX_BYTES = 5 * 1024 * 1024;

export function validateKycFile(file: { type: string; size: number }) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return "Only JPG, PNG, and PDF files are allowed";
  }
  if (file.size > MAX_BYTES) {
    return "File must be 5MB or smaller";
  }
  return null;
}

export async function uploadKycDocument(params: {
  tenantId: string;
  customerId: string;
  docType: string;
  fileName: string;
  fileBuffer: Buffer;
  contentType: string;
}) {
  const admin = createAdminClient();
  const path = `${params.tenantId}/${params.customerId}/${Date.now()}-${params.fileName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

  const { error } = await admin.storage
    .from(BUCKET)
    .upload(path, params.fileBuffer, {
      contentType: params.contentType,
      upsert: false,
    });

  if (error) {
    return { error: error.message };
  }

  return { path, bucket: BUCKET };
}

export async function getKycSignedUrl(path: string, expiresIn = 3600) {
  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(BUCKET)
    .createSignedUrl(path, expiresIn);
  if (error) return { error: error.message };
  return { url: data.signedUrl };
}
