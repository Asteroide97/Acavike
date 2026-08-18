import { put } from "@vercel/blob";
import { logAuditEntry } from "@/lib/audit";
import { DATABASE_ENABLED, DEMO_MODE } from "@/lib/config";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

export const TRANSFER_RECEIPT_MAX_SIZE_BYTES = 5 * 1024 * 1024;
export const TRANSFER_RECEIPT_ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

type TransferReceiptErrorCode =
  | "missing-file"
  | "invalid-type"
  | "too-large"
  | "order-not-found"
  | "blob";

type TransferReceiptUploadResult =
  | {
      ok: true;
      orderId: string;
      orderNumber: string;
      receiptUrl: string;
    }
  | {
      ok: false;
      code: TransferReceiptErrorCode;
      message: string;
    };

function sanitizeFileName(fileName: string) {
  const trimmed = fileName.trim();
  const extension = trimmed.includes(".") ? trimmed.split(".").pop()?.toLowerCase() || "bin" : "bin";
  const baseName = trimmed.replace(/\.[^.]+$/, "");
  const safeBaseName = slugify(baseName) || "comprobante";
  return `${safeBaseName}.${extension}`;
}

function canAttemptBlobUpload() {
  return Boolean(
    process.env.BLOB_READ_WRITE_TOKEN?.trim() ||
      process.env.BLOB_STORE_ID?.trim() ||
      process.env.VERCEL_OIDC_TOKEN?.trim() ||
      process.env.VERCEL === "1" ||
      process.env.VERCEL_ENV,
  );
}

export function getTransferReceiptErrorMessage(code?: string | null) {
  switch (code) {
    case "missing-file":
      return "Selecciona un comprobante antes de enviarlo.";
    case "invalid-type":
      return "Formato no permitido. Aceptamos PDF, JPG, PNG o WEBP.";
    case "too-large":
      return "El comprobante excede el límite de 5 MB.";
    case "order-not-found":
      return "No encontramos el pedido o su registro de pago.";
    case "blob":
      return "No se pudo subir el comprobante. Blob no está configurado o la carga falló.";
    default:
      return "No fue posible cargar el comprobante. Intenta nuevamente.";
  }
}

async function uploadReceiptToBlob(orderNumber: string, receipt: File) {
  if (!canAttemptBlobUpload()) {
    throw new Error("Blob no está configurado para este entorno.");
  }

  const fileName = sanitizeFileName(receipt.name);
  const pathname = `transfer-receipts/${slugify(orderNumber) || "pedido"}/${Date.now()}-${fileName}`;
  const blob = await put(pathname, receipt, {
    access: "public",
    addRandomSuffix: true,
    contentType: receipt.type,
  });

  return blob.url;
}

export async function processTransferReceiptUpload(input: {
  orderNumber: string;
  reference?: string;
  receipt: FormDataEntryValue | null;
}) : Promise<TransferReceiptUploadResult> {
  if (DEMO_MODE || !DATABASE_ENABLED) {
    return {
      ok: false,
      code: "blob",
      message: "La carga de comprobantes solo está disponible en modo real.",
    };
  }

  const { orderNumber, reference } = input;
  const receipt = input.receipt;

  if (!(receipt instanceof File) || receipt.size === 0) {
    return {
      ok: false,
      code: "missing-file",
      message: getTransferReceiptErrorMessage("missing-file"),
    };
  }

  if (!TRANSFER_RECEIPT_ALLOWED_MIME_TYPES.has(receipt.type)) {
    return {
      ok: false,
      code: "invalid-type",
      message: getTransferReceiptErrorMessage("invalid-type"),
    };
  }

  if (receipt.size > TRANSFER_RECEIPT_MAX_SIZE_BYTES) {
    return {
      ok: false,
      code: "too-large",
      message: getTransferReceiptErrorMessage("too-large"),
    };
  }

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { payment: true },
  });

  if (!order?.payment) {
    return {
      ok: false,
      code: "order-not-found",
      message: getTransferReceiptErrorMessage("order-not-found"),
    };
  }

  try {
    const receiptUrl = await uploadReceiptToBlob(orderNumber, receipt);

    await prisma.$transaction([
      prisma.transferPayment.update({
        where: { orderId: order.id },
        data: {
          receiptUrl,
          reference: reference?.trim() || order.payment.reference || orderNumber,
          status: "IN_REVIEW",
        },
      }),
      prisma.order.update({
        where: { id: order.id },
        data: { status: "RECEIPT_UPLOADED" },
      }),
    ]);

    await logAuditEntry({
      action: "TRANSFER_RECEIPT_UPLOADED",
      entity: "order",
      entityId: order.id,
      metadata: { orderNumber, receiptUrl },
    });

    return {
      ok: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      receiptUrl,
    };
  } catch (error) {
    await logAuditEntry({
      action: "TRANSFER_RECEIPT_UPLOAD_FAILED",
      entity: "order",
      entityId: order.id,
      metadata: {
        orderNumber,
        message: error instanceof Error ? error.message : "blob-upload-error",
      },
    });

    return {
      ok: false,
      code: "blob",
      message: getTransferReceiptErrorMessage("blob"),
    };
  }
}
