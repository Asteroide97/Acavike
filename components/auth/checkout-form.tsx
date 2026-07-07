"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { submitCheckoutAction } from "@/lib/actions/commerce";
import { checkoutSchema } from "@/lib/validators";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type CheckoutValues = z.infer<typeof checkoutSchema>;

export function CheckoutForm({
  defaultValues,
}: {
  defaultValues?: Partial<CheckoutValues>;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      name: defaultValues?.name || "",
      companyName: defaultValues?.companyName || "",
      email: defaultValues?.email || "",
      phone: defaultValues?.phone || "",
      address: defaultValues?.address || "",
      rfc: defaultValues?.rfc || "",
      deliveryMethod: defaultValues?.deliveryMethod || "Entrega local",
      notes: defaultValues?.notes || "",
      createAccount: defaultValues?.createAccount || false,
      password: "",
    },
  });

  const createAccount = form.watch("createAccount");

  const onSubmit = form.handleSubmit((values) => {
    setServerError(null);
    startTransition(async () => {
      const result = await submitCheckoutAction(values);
      if (!result.success) {
        setServerError(result.error);
        return;
      }

      router.push(`/checkout?orden=${result.orderNumber}`);
      router.refresh();
    });
  });

  return (
    <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
      {serverError ? <Alert className="md:col-span-2" tone="danger">{serverError}</Alert> : null}
      <div>
        <Label htmlFor="checkout-name">Nombre de contacto</Label>
        <Input id="checkout-name" {...form.register("name")} />
      </div>
      <div>
        <Label htmlFor="checkout-company">Empresa</Label>
        <Input id="checkout-company" {...form.register("companyName")} />
      </div>
      <div>
        <Label htmlFor="checkout-email">Correo</Label>
        <Input id="checkout-email" type="email" {...form.register("email")} />
      </div>
      <div>
        <Label htmlFor="checkout-phone">Teléfono</Label>
        <Input id="checkout-phone" {...form.register("phone")} />
      </div>
      <div>
        <Label htmlFor="checkout-rfc">RFC</Label>
        <Input id="checkout-rfc" {...form.register("rfc")} />
      </div>
      <div>
        <Label htmlFor="checkout-delivery">Método de entrega</Label>
        <Select id="checkout-delivery" {...form.register("deliveryMethod")}>
          <option value="Entrega local">Entrega local</option>
          <option value="Paquetería">Paquetería</option>
          <option value="Recolección en almacén">Recolección en almacén</option>
        </Select>
      </div>
      <div className="md:col-span-2">
        <Label htmlFor="checkout-address">Dirección de entrega</Label>
        <Textarea id="checkout-address" {...form.register("address")} />
      </div>
      <div className="md:col-span-2">
        <Label htmlFor="checkout-notes">Notas del pedido</Label>
        <Textarea id="checkout-notes" {...form.register("notes")} />
      </div>
      <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center gap-3">
          <Checkbox id="checkout-create-account" checked={createAccount} onChange={(event) => form.setValue("createAccount", event.target.checked)} />
          <Label htmlFor="checkout-create-account" className="mb-0">
            Crear cuenta para consultar mis pedidos después del checkout
          </Label>
        </div>
        {createAccount ? (
          <div className="mt-4 max-w-sm">
            <Label htmlFor="checkout-password">Contraseña</Label>
            <Input id="checkout-password" type="password" {...form.register("password")} />
          </div>
        ) : null}
      </div>
      <div className="md:col-span-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Generando pedido..." : "Confirmar pedido por transferencia"}
        </Button>
      </div>
    </form>
  );
}
