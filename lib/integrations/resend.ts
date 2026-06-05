import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export async function sendInvitationEmail(params: {
  to: string;
  managerName: string;
  branchName: string;
  inviteUrl: string;
}) {
  if (!resend) {
    console.warn("[resend] RESEND_API_KEY not set — skipping email");
    return { skipped: true };
  }

  const from =
    process.env.RESEND_FROM_EMAIL ?? "noreply@licagent.app";
  const fromName =
    process.env.RESEND_FROM_NAME ?? "LIC Agent Management";

  await resend.emails.send({
    from: `${fromName} <${from}>`,
    to: params.to,
    subject: `You're invited to manage ${params.branchName}`,
    html: `
      <div style="background:#FFF9E6;padding:24px;font-family:Inter,sans-serif">
        <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;border:1px solid #E8E6DE">
          <h1 style="color:#3D3D3A;font-size:20px;margin:0 0 12px">Welcome, ${params.managerName}</h1>
          <p style="color:#3D3D3A;font-size:14px;line-height:1.6">
            You've been invited as Branch Manager for <strong>${params.branchName}</strong> on LIC Agent Management.
          </p>
          <a href="${params.inviteUrl}" style="display:inline-block;margin-top:20px;background:#F5C842;color:#3D3D3A;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
            Accept invitation
          </a>
          <p style="color:#888780;font-size:12px;margin-top:24px">This link expires in 72 hours.</p>
        </div>
      </div>
    `,
  });

  return { skipped: false };
}

async function sendBrandedEmail(params: {
  to: string;
  subject: string;
  bodyHtml: string;
}) {
  if (!resend) {
    console.warn("[resend] RESEND_API_KEY not set — skipping email");
    return { skipped: true };
  }
  const from = process.env.RESEND_FROM_EMAIL ?? "noreply@licagent.app";
  const fromName = process.env.RESEND_FROM_NAME ?? "LIC Agent Management";
  await resend.emails.send({
    from: `${fromName} <${from}>`,
    to: params.to,
    subject: params.subject,
    html: `
      <div style="background:#FFF9E6;padding:24px;font-family:Inter,sans-serif">
        <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;border:1px solid #E8E6DE">
          ${params.bodyHtml}
        </div>
      </div>
    `,
  });
  return { skipped: false };
}

export async function sendPremiumReminderEmail(params: {
  to: string;
  agentName: string;
  customerName: string;
  policyNumber: string;
  amount: string;
  dueDate: string;
  daysBefore: number;
}) {
  return sendBrandedEmail({
    to: params.to,
    subject: `Premium due in ${params.daysBefore} days — ${params.policyNumber}`,
    bodyHtml: `
      <p style="color:#3D3D3A">Hi ${params.agentName},</p>
      <p style="color:#3D3D3A">Premium of <strong>₹${params.amount}</strong> for <strong>${params.customerName}</strong>'s policy <strong>${params.policyNumber}</strong> is due on <strong>${params.dueDate}</strong>.</p>
    `,
  });
}

export async function sendGracePeriodEmail(params: {
  to: string;
  agentName: string;
  customerName: string;
  policyNumber: string;
  amount: string;
  graceEnd: string;
}) {
  return sendBrandedEmail({
    to: params.to,
    subject: `Policy in grace period — ${params.policyNumber}`,
    bodyHtml: `
      <p style="color:#3D3D3A">Hi ${params.agentName},</p>
      <p style="color:#3D3D3A"><strong>${params.customerName}</strong>'s policy <strong>${params.policyNumber}</strong> has entered grace period. Premium ₹${params.amount} is overdue. Grace ends <strong>${params.graceEnd}</strong>.</p>
    `,
  });
}

export async function sendPolicyLapsedEmail(params: {
  to: string;
  agentName: string;
  customerName: string;
  policyNumber: string;
}) {
  return sendBrandedEmail({
    to: params.to,
    subject: `Policy lapsed — ${params.policyNumber}`,
    bodyHtml: `
      <p style="color:#3D3D3A">Hi ${params.agentName},</p>
      <p style="color:#A32D2D;font-weight:600">Policy ${params.policyNumber} for ${params.customerName} has LAPSED due to non-payment. Contact the customer immediately for revival.</p>
    `,
  });
}

export async function sendRevivalPendingEmail(params: {
  to: string;
  managerName: string;
  policyNumber: string;
  agentName: string;
  totalCost: string;
  approvalUrl: string;
}) {
  return sendBrandedEmail({
    to: params.to,
    subject: `Revival approval required — ${params.policyNumber}`,
    bodyHtml: `
      <p style="color:#3D3D3A">Hi ${params.managerName},</p>
      <p style="color:#3D3D3A">${params.agentName} requested revival for policy <strong>${params.policyNumber}</strong>. Total cost: <strong>₹${params.totalCost}</strong>.</p>
      <a href="${params.approvalUrl}" style="display:inline-block;margin-top:16px;background:#F5C842;color:#3D3D3A;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Review revival</a>
    `,
  });
}
