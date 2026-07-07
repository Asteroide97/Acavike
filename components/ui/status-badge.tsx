import { Badge } from "@/components/ui/badge";
import {
  MESSAGE_STATUS_LABELS,
  ORDER_STATUS_LABELS,
  QUOTE_STATUS_LABELS,
  TRANSFER_STATUS_LABELS,
} from "@/lib/constants";

function toneForStatus(status: string) {
  if (["PAYMENT_APPROVED", "DELIVERED", "APPROVED", "ACCEPTED"].includes(status)) {
    return "success" as const;
  }

  if (["PENDING_TRANSFER", "RECEIPT_UPLOADED", "PENDING", "IN_REVIEW", "SENT"].includes(status)) {
    return "warning" as const;
  }

  if (["PAYMENT_REJECTED", "REJECTED", "CANCELLED", "EXPIRED", "CLOSED"].includes(status)) {
    return "danger" as const;
  }

  return "info" as const;
}

export function StatusBadge({
  kind,
  status,
}: {
  kind: "order" | "quote" | "payment" | "message";
  status: string;
}) {
  const labels = {
    order: ORDER_STATUS_LABELS,
    quote: QUOTE_STATUS_LABELS,
    payment: TRANSFER_STATUS_LABELS,
    message: MESSAGE_STATUS_LABELS,
  };

  return <Badge variant={toneForStatus(status)}>{labels[kind][status as keyof (typeof labels)[typeof kind]] ?? status}</Badge>;
}
