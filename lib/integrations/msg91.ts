const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY;
const MSG91_SENDER_ID = process.env.MSG91_SENDER_ID ?? "LICAGT";

export type Msg91Template =
  | "premium_due_30"
  | "premium_due_7"
  | "premium_due_today"
  | "policy_lapsed";

export async function sendSMS(
  phone: string,
  templateKey: Msg91Template | "policy_lapsed",
  variables: Record<string, string>
): Promise<{ messageId?: string; skipped?: boolean }> {
  if (!MSG91_AUTH_KEY) {
    console.warn("[msg91] MSG91_AUTH_KEY not set — skipping SMS");
    return { skipped: true };
  }

  const mobile = phone.replace(/\D/g, "").slice(-10);
  const templateId = process.env[`MSG91_TEMPLATE_${templateKey.toUpperCase()}`];

  if (!templateId) {
    console.warn(`[msg91] No template ID for ${templateKey} — using flow API without template`);
  }

  try {
    const response = await fetch("https://api.msg91.com/api/v5/flow/", {
      method: "POST",
      headers: {
        authkey: MSG91_AUTH_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        template_id: templateId ?? process.env.MSG91_DEFAULT_TEMPLATE_ID,
        sender: MSG91_SENDER_ID,
        short_url: "0",
        mobiles: `91${mobile}`,
        ...variables,
      }),
    });

    const data = (await response.json()) as { message?: string; type?: string };
    return { messageId: data.message ?? data.type };
  } catch (e) {
    console.error("[msg91]", e);
    return { skipped: true };
  }
}
