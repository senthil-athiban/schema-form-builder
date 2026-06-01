export type WebhookConfig = {
  url: string;
  method?: "POST" | "GET" | "PUT";
  headers?: Record<string, string>;
};

export async function executeWebhook(
  config: WebhookConfig,
  payload: {
    event: "form.submitted";
    submission: {
      id: string;
      formId: string;
      responseData: unknown;
      submittedAt: Date;
    };
    form: { id: string; name: string };
  },
) {
  const res = await fetch(config.url, {
    method: config.method ?? "POST",
    headers: {
      "Content-Type": "application/json",
      ...config.headers,
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Webhook failed ${res.status}: ${text.slice(0, 500)}`);
  }

  return { status: res.status, body: text.slice(0, 2000) };
}
