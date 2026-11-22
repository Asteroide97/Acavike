import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { createProductOrderHandler } from "@/lib/product-order-handler";
import { saveProductOrderRepository } from "@/lib/repositories/product-order";

export const runtime = "nodejs";
export const POST = createProductOrderHandler({
  getUser: getCurrentUser,
  save: saveProductOrderRepository,
  revalidate: () => {
    revalidatePath("/catalogo", "layout");
    revalidatePath("/admin/productos/ordenar");
  },
});
