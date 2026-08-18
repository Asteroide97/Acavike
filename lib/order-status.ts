import type { OrderStatus, TransferPaymentStatus } from "@prisma/client";

export const OPERATIONAL_ORDER_STATUSES: OrderStatus[] = [
  "PENDING_TRANSFER",
  "TO_PICK",
  "WAITING_STOCK",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

export const WAREHOUSE_OPERATIONAL_STATUSES: OrderStatus[] = [
  "TO_PICK",
  "WAITING_STOCK",
  "SHIPPED",
  "DELIVERED",
];

const OPERATIONAL_STATUS_MAP: Record<OrderStatus, OrderStatus> = {
  PENDING_TRANSFER: "PENDING_TRANSFER",
  RECEIPT_UPLOADED: "PENDING_TRANSFER",
  PAYMENT_APPROVED: "TO_PICK",
  PAYMENT_REJECTED: "PENDING_TRANSFER",
  TO_PICK: "TO_PICK",
  WAITING_STOCK: "WAITING_STOCK",
  SHIPPED: "SHIPPED",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
};

export function isOperationalOrderStatus(status: string): status is OrderStatus {
  return OPERATIONAL_ORDER_STATUSES.includes(status as OrderStatus);
}

export function getOperationalOrderStatus(status: OrderStatus | string): OrderStatus {
  return OPERATIONAL_STATUS_MAP[status as OrderStatus] ?? "PENDING_TRANSFER";
}

export function getOrderStatusAfterPaymentReview(
  currentOrderStatus: OrderStatus | string,
  paymentStatus: TransferPaymentStatus | string,
): OrderStatus {
  const currentOperationalStatus = getOperationalOrderStatus(currentOrderStatus);

  switch (paymentStatus) {
    case "APPROVED":
      if (["WAITING_STOCK", "SHIPPED", "DELIVERED", "CANCELLED"].includes(currentOperationalStatus)) {
        return currentOperationalStatus;
      }

      return "TO_PICK";
    case "REJECTED":
      return currentOperationalStatus === "CANCELLED" ? "CANCELLED" : "PENDING_TRANSFER";
    case "IN_REVIEW":
      return "RECEIPT_UPLOADED";
    case "PENDING":
    default:
      return "PENDING_TRANSFER";
  }
}
