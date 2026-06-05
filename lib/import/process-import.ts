import { createAdminClient } from "@/lib/supabase/admin";
import { logAction } from "@/lib/audit";
import { parseCSV, rowsToObjects, parseDateCell } from "@/lib/import/parse-csv";
import type { ImportType } from "@/lib/import/templates";
import { createNotification } from "@/lib/notifications/create";
import { recordPayment } from "@/lib/business/record-payment";

type ImportError = { row: number; error: string };

function normalizeKey(row: Record<string, string>, ...keys: string[]) {
  for (const k of keys) {
    const v = row[k.toLowerCase()] ?? row[k];
    if (v) return v;
  }
  return "";
}

export async function processImportJob(params: {
  jobId: string;
  tenantId: string;
  userId: string;
  importType: ImportType;
  csvText: string;
  skipErrors?: boolean;
}) {
  const admin = createAdminClient();
  const errors: ImportError[] = [];
  let success = 0;
  let failed = 0;

  await admin
    .from("import_jobs")
    .update({
      status: "processing",
      started_at: new Date().toISOString(),
    })
    .eq("id", params.jobId);

  const rows = parseCSV(params.csvText);
  const { records } = rowsToObjects(rows);
  const total = records.length;

  await admin
    .from("import_jobs")
    .update({ total_rows: total })
    .eq("id", params.jobId);

  for (let i = 0; i < records.length; i++) {
    const rowNum = i + 2;
    const row = records[i];

    try {
      if (params.importType === "customers") {
        await importCustomerRow(params.tenantId, params.userId, row);
      } else if (params.importType === "policies") {
        await importPolicyRow(params.tenantId, params.userId, row);
      } else {
        await importPaymentRow(params.tenantId, params.userId, row);
      }
      success++;
    } catch (e) {
      failed++;
      errors.push({
        row: rowNum,
        error: e instanceof Error ? e.message : "Unknown error",
      });
      if (!params.skipErrors) {
        break;
      }
    }

    if ((i + 1) % 10 === 0 || i === records.length - 1) {
      await admin
        .from("import_jobs")
        .update({
          processed_rows: i + 1,
          success_rows: success,
          failed_rows: failed,
          error_details: errors,
        })
        .eq("id", params.jobId);
    }
  }

  const status =
    failed === 0 ? "completed" : success > 0 ? "partial" : "failed";

  await admin
    .from("import_jobs")
    .update({
      status,
      processed_rows: total,
      success_rows: success,
      failed_rows: failed,
      error_details: errors,
      completed_at: new Date().toISOString(),
    })
    .eq("id", params.jobId);

  await logAction({
    actorId: params.userId,
    tenantId: params.tenantId,
    action: "import.completed",
    resourceType: "import_job",
    resourceId: params.jobId,
    afterState: { importType: params.importType, success, failed },
  });

  await createNotification({
    tenantId: params.tenantId,
    userId: params.userId,
    type: "import_complete",
    title: "Import finished",
    body: `${success} succeeded, ${failed} failed`,
    link: "/dashboard/import",
  });

  return { success, failed, errors, status };
}

async function importCustomerRow(
  tenantId: string,
  defaultAgentId: string,
  row: Record<string, string>
) {
  const admin = createAdminClient();
  const fullName = normalizeKey(row, "customer full name", "full name");
  const phone = normalizeKey(row, "phone number", "phone").replace(/\D/g, "");
  if (!fullName || phone.length !== 10) {
    throw new Error("Full name and valid 10-digit phone required");
  }

  let agentId = defaultAgentId;
  const empId = normalizeKey(row, "agent employee id");
  if (empId) {
    const { data: member } = await admin
      .from("tenant_members")
      .select("user_id")
      .eq("tenant_id", tenantId)
      .eq("employee_id", empId)
      .eq("status", "active")
      .maybeSingle();
    if (member) agentId = member.user_id;
  }

  const { data: existing } = await admin
    .from("customers")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("phone", phone)
    .maybeSingle();

  if (existing) throw new Error(`Customer with phone ${phone} already exists`);

  const dob = parseDateCell(normalizeKey(row, "date of birth"));
  const state =
    normalizeKey(row, "state") || "Maharashtra";
  const city = normalizeKey(row, "city") || "—";

  const { data, error } = await admin
    .from("customers")
    .insert({
      tenant_id: tenantId,
      assigned_agent_id: agentId,
      full_name: fullName,
      phone,
      date_of_birth: dob,
      gender: normalizeKey(row, "gender") || null,
      alternate_phone: normalizeKey(row, "alternate phone") || null,
      email: normalizeKey(row, "email") || null,
      city,
      state,
      pincode: normalizeKey(row, "pincode") || null,
      pan_number: normalizeKey(row, "pan number")?.toUpperCase() || null,
      aadhaar_last4: normalizeKey(row, "aadhaar last 4 digits") || null,
      nominee_name: normalizeKey(row, "nominee name") || null,
      nominee_relation: normalizeKey(row, "nominee relation") || null,
      notes: normalizeKey(row, "notes") || null,
      imported: true,
      kyc_status: "pending",
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return data;
}

async function importPolicyRow(
  tenantId: string,
  defaultAgentId: string,
  row: Record<string, string>
) {
  const admin = createAdminClient();
  const policyNumber = normalizeKey(row, "policy number");
  const customerPhone = normalizeKey(row, "customer phone").replace(/\D/g, "");
  const planName = normalizeKey(row, "plan name");
  const policyType = normalizeKey(row, "policy type").toLowerCase();
  const sumAssured = Number(normalizeKey(row, "sum assured"));
  const premiumAmount = Number(normalizeKey(row, "premium amount"));
  const frequency = normalizeKey(row, "premium frequency").toLowerCase();
  const commencement = parseDateCell(
    normalizeKey(row, "commencement date")
  );

  if (!policyNumber || !customerPhone || !planName || !commencement) {
    throw new Error("Policy number, customer phone, plan name, commencement required");
  }

  const { data: customer } = await admin
    .from("customers")
    .select("id, assigned_agent_id")
    .eq("tenant_id", tenantId)
    .eq("phone", customerPhone)
    .maybeSingle();

  if (!customer) {
    throw new Error(`No customer with phone ${customerPhone}`);
  }

  const { data: dup } = await admin
    .from("policies")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("policy_number", policyNumber)
    .maybeSingle();

  if (dup) throw new Error(`Policy ${policyNumber} already exists`);

  const maturity = parseDateCell(normalizeKey(row, "maturity date"));
  const status = normalizeKey(row, "status") || "in_force";

  const { error } = await admin.from("policies").insert({
    tenant_id: tenantId,
    customer_id: customer.id,
    agent_id: customer.assigned_agent_id ?? defaultAgentId,
    policy_number: policyNumber,
    plan_name: planName,
    plan_code: normalizeKey(row, "plan code") || null,
    policy_type: policyType || "endowment",
    sum_assured: sumAssured,
    premium_amount: premiumAmount,
    premium_frequency: frequency || "yearly",
    premium_term_years: Number(normalizeKey(row, "premium term (years)")) || null,
    policy_term_years: Number(normalizeKey(row, "policy term (years)")) || null,
    commencement_date: commencement,
    maturity_date: maturity,
    status,
    mode_of_payment: normalizeKey(row, "mode of payment") || null,
    notes: normalizeKey(row, "notes") || null,
    next_premium_due: commencement,
  });

  if (error) throw new Error(error.message);
}

async function importPaymentRow(
  tenantId: string,
  userId: string,
  row: Record<string, string>
) {
  const policyNumber = normalizeKey(row, "policy number");
  const paymentDate = parseDateCell(normalizeKey(row, "payment date"));
  const dueDate = parseDateCell(normalizeKey(row, "due date"));
  const amountDue = Number(normalizeKey(row, "amount due"));
  const amountPaid = Number(normalizeKey(row, "amount paid"));
  const installment = Number(normalizeKey(row, "installment number"));

  if (!policyNumber || !paymentDate || !dueDate) {
    throw new Error("Policy number, payment date, due date required");
  }

  const admin = createAdminClient();
  const { data: policy } = await admin
    .from("policies")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("policy_number", policyNumber)
    .maybeSingle();

  if (!policy) throw new Error(`Policy ${policyNumber} not found`);

  const result = await recordPayment({
    tenantId,
    userId,
    policyId: policy.id,
    paymentDate,
    dueDate,
    amountDue,
    amountPaid,
    installmentNumber: installment || 1,
    paymentMode: normalizeKey(row, "payment mode") || "cash",
    receiptNumber: normalizeKey(row, "receipt number") || undefined,
    remarks: normalizeKey(row, "remarks") || undefined,
  });

  if (result.error) throw new Error(result.error);
}
