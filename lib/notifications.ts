import { DATABASE_ENABLED, DEMO_MODE } from "@/lib/config";
import { prisma } from "@/lib/prisma";
import { logAuditEntry } from "@/lib/audit";
import { formatCurrency, formatDate } from "@/lib/utils";

type EmailSendResult =
  | { ok: true }
  | { ok: false; reason: string; detail?: string };

type TemplateFallback = {
  key: string;
  subject: string;
  body: string;
};

function getEmailFrom() {
  return process.env.EMAIL_FROM?.trim() || "Acavike <ventas@acavike.com>";
}

function getSalesEmail() {
  return process.env.SALES_EMAIL?.trim() || "ventas@acavike.com";
}

function renderTemplate(template: string, replacements: Record<string, string>) {
  return Object.entries(replacements).reduce((result, [key, value]) => {
    return result.replace(new RegExp(`{{\\s*${key}\\s*}}`, "g"), value);
  }, template);
}

async function resolveTemplate(input: TemplateFallback, replacements: Record<string, string>) {
  if (DEMO_MODE || !DATABASE_ENABLED) {
    return {
      subject: renderTemplate(input.subject, replacements),
      body: renderTemplate(input.body, replacements),
    };
  }

  const template = await prisma.emailTemplate
    .findUnique({
      where: { key: input.key },
    })
    .catch(() => null);

  const isTemplateActive = template?.isActive ?? false;
  const subject = renderTemplate(isTemplateActive ? template?.subject || input.subject : input.subject, replacements);
  const body = renderTemplate(isTemplateActive ? template?.body || input.body : input.body, replacements);

  return { subject, body };
}

async function sendEmail(input: {
  to: string | string[];
  subject: string;
  text: string;
}) : Promise<EmailSendResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();

  if (!apiKey) {
    return {
      ok: false,
      reason: "email-provider-missing",
      detail: "RESEND_API_KEY no está configurado.",
    };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: getEmailFrom(),
        to: Array.isArray(input.to) ? input.to : [input.to],
        subject: input.subject,
        text: input.text,
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      return {
        ok: false,
        reason: "email-send-failed",
        detail: detail.slice(0, 500),
      };
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      reason: "email-send-failed",
      detail: error instanceof Error ? error.message : "unknown-email-error",
    };
  }
}

async function recordEmailIssue(input: {
  userId?: string | null;
  orderId: string;
  event: string;
  recipient: string;
  reason: string;
  detail?: string;
}) {
  console.warn("email-notification-warning", input);
  await logAuditEntry({
    userId: input.userId,
    action: "EMAIL_NOTIFICATION_WARNING",
    entity: "order",
    entityId: input.orderId,
    metadata: {
      event: input.event,
      recipient: input.recipient,
      reason: input.reason,
      detail: input.detail ?? null,
    },
  });
}

async function getOrderNotificationContext(orderId: string) {
  if (DEMO_MODE || !DATABASE_ENABLED) {
    return null;
  }

  return prisma.order.findUnique({
    where: { id: orderId },
    include: {
      customer: true,
      items: true,
      payment: true,
    },
  });
}

function formatOrderItems(items: Array<{ name: string; sku: string; quantity: number; total: { toString(): string } }>) {
  return items
    .map((item) => `- ${item.name} (${item.sku}) x ${item.quantity} · ${formatCurrency(item.total)}`)
    .join("\n");
}

export async function notifyOrderGenerated(input: {
  orderId: string;
  userId?: string | null;
}) {
  const order = await getOrderNotificationContext(input.orderId);

  if (!order || !order.payment) {
    return;
  }

  const itemsList = formatOrderItems(order.items);
  const replacements = {
    cliente: order.customer.name,
    empresa: order.customer.companyName,
    correo: order.customer.email,
    folio: order.orderNumber,
    referencia: order.payment.reference || order.orderNumber,
    banco: order.payment.bankName,
    beneficiario: order.payment.beneficiary,
    clabe: order.payment.clabe,
    total: formatCurrency(order.total),
    productos: itemsList,
    estado: "Pendiente de transferencia",
  };

  const [customerTemplate, salesTemplate] = await Promise.all([
    resolveTemplate(
      {
        key: "order_pending_transfer",
        subject: "Pedido generado {{folio}}",
        body: [
          "Hola {{cliente}},",
          "",
          "Tu pedido {{folio}} fue generado correctamente.",
          "Total: {{total}}",
          "Referencia: {{referencia}}",
          "",
          "Datos bancarios:",
          "Banco: {{banco}}",
          "Beneficiario: {{beneficiario}}",
          "CLABE: {{clabe}}",
          "",
          "Sube tu comprobante desde la pantalla del pedido para iniciar la validación.",
          "",
          "Equipo Acavike",
        ].join("\n"),
      },
      replacements,
    ),
    resolveTemplate(
      {
        key: "order_generated_sales",
        subject: "Nuevo pedido generado {{folio}}",
        body: [
          "Se generó un nuevo pedido.",
          "",
          "Folio: {{folio}}",
          "Cliente: {{cliente}}",
          "Empresa: {{empresa}}",
          "Correo: {{correo}}",
          "Estado: {{estado}}",
          "Total: {{total}}",
          "",
          "Productos:",
          "{{productos}}",
        ].join("\n"),
      },
      replacements,
    ),
  ]);

  const [customerResult, salesResult] = await Promise.all([
    sendEmail({
      to: order.customer.email,
      subject: customerTemplate.subject,
      text: customerTemplate.body,
    }),
    sendEmail({
      to: getSalesEmail(),
      subject: salesTemplate.subject,
      text: salesTemplate.body,
    }),
  ]);

  if (!customerResult.ok) {
    await recordEmailIssue({
      userId: input.userId,
      orderId: order.id,
      event: "order-generated-customer",
      recipient: order.customer.email,
      reason: customerResult.reason,
      detail: customerResult.detail,
    });
  }

  if (!salesResult.ok) {
    await recordEmailIssue({
      userId: input.userId,
      orderId: order.id,
      event: "order-generated-sales",
      recipient: getSalesEmail(),
      reason: salesResult.reason,
      detail: salesResult.detail,
    });
  }
}

export async function notifyPaymentApproved(input: {
  orderId: string;
  userId?: string | null;
}) {
  const order = await getOrderNotificationContext(input.orderId);

  if (!order || !order.payment) {
    return;
  }

  const itemsList = formatOrderItems(order.items);
  const reviewedAt = order.payment.reviewedAt ? formatDate(order.payment.reviewedAt) : formatDate(new Date());
  const replacements = {
    cliente: order.customer.name,
    empresa: order.customer.companyName,
    correo: order.customer.email,
    folio: order.orderNumber,
    total: formatCurrency(order.total),
    estado: "Pago aprobado",
    productos: itemsList,
    comprobante: order.payment.receiptUrl || "No disponible",
    validacion: reviewedAt,
  };

  const [customerTemplate, salesTemplate] = await Promise.all([
    resolveTemplate(
      {
        key: "payment_approved_customer",
        subject: "Pago confirmado {{folio}}",
        body: [
          "Hola {{cliente}},",
          "",
          "Confirmamos el pago de tu pedido {{folio}}.",
          "Total: {{total}}",
          "Estado: {{estado}}",
          "",
          "Tu pedido continuará con surtido y proceso operativo.",
          "",
          "Equipo Acavike",
        ].join("\n"),
      },
      replacements,
    ),
    resolveTemplate(
      {
        key: "payment_approved_sales",
        subject: "Pedido pagado {{folio}}",
        body: [
          "El pago del pedido fue validado.",
          "",
          "Folio: {{folio}}",
          "Cliente: {{cliente}}",
          "Empresa: {{empresa}}",
          "Correo: {{correo}}",
          "Total: {{total}}",
          "Validación: {{validacion}}",
          "Comprobante: {{comprobante}}",
          "",
          "Productos:",
          "{{productos}}",
        ].join("\n"),
      },
      replacements,
    ),
  ]);

  const [customerResult, salesResult] = await Promise.all([
    sendEmail({
      to: order.customer.email,
      subject: customerTemplate.subject,
      text: customerTemplate.body,
    }),
    sendEmail({
      to: getSalesEmail(),
      subject: salesTemplate.subject,
      text: salesTemplate.body,
    }),
  ]);

  if (!customerResult.ok) {
    await recordEmailIssue({
      userId: input.userId,
      orderId: order.id,
      event: "payment-approved-customer",
      recipient: order.customer.email,
      reason: customerResult.reason,
      detail: customerResult.detail,
    });
  }

  if (!salesResult.ok) {
    await recordEmailIssue({
      userId: input.userId,
      orderId: order.id,
      event: "payment-approved-sales",
      recipient: getSalesEmail(),
      reason: salesResult.reason,
      detail: salesResult.detail,
    });
  }
}
