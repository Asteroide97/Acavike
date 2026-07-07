"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { registerAction } from "@/lib/actions/auth";
import { registerSchema } from "@/lib/validators";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type RegisterValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      companyName: "",
      email: "",
      phone: "",
      rfc: "",
      address: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    setServerError(null);
    startTransition(async () => {
      const result = await registerAction(values);
      if (!result.success) {
        setServerError(result.error);
        return;
      }

      router.push(result.redirectTo);
      router.refresh();
    });
  });

  return (
    <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
      {serverError ? <Alert className="md:col-span-2" tone="danger">{serverError}</Alert> : null}
      <div>
        <Label htmlFor="register-name">Nombre</Label>
        <Input id="register-name" {...form.register("name")} />
        {form.formState.errors.name ? <p className="mt-2 text-xs text-red-600">{form.formState.errors.name.message}</p> : null}
      </div>
      <div>
        <Label htmlFor="register-company">Empresa</Label>
        <Input id="register-company" {...form.register("companyName")} />
        {form.formState.errors.companyName ? <p className="mt-2 text-xs text-red-600">{form.formState.errors.companyName.message}</p> : null}
      </div>
      <div>
        <Label htmlFor="register-email">Correo</Label>
        <Input id="register-email" type="email" {...form.register("email")} />
        {form.formState.errors.email ? <p className="mt-2 text-xs text-red-600">{form.formState.errors.email.message}</p> : null}
      </div>
      <div>
        <Label htmlFor="register-phone">Teléfono</Label>
        <Input id="register-phone" {...form.register("phone")} />
        {form.formState.errors.phone ? <p className="mt-2 text-xs text-red-600">{form.formState.errors.phone.message}</p> : null}
      </div>
      <div>
        <Label htmlFor="register-rfc">RFC</Label>
        <Input id="register-rfc" {...form.register("rfc")} />
      </div>
      <div>
        <Label htmlFor="register-password">Contraseña</Label>
        <Input id="register-password" type="password" {...form.register("password")} />
        {form.formState.errors.password ? <p className="mt-2 text-xs text-red-600">{form.formState.errors.password.message}</p> : null}
      </div>
      <div>
        <Label htmlFor="register-password-confirm">Confirmar contraseña</Label>
        <Input id="register-password-confirm" type="password" {...form.register("confirmPassword")} />
        {form.formState.errors.confirmPassword ? <p className="mt-2 text-xs text-red-600">{form.formState.errors.confirmPassword.message}</p> : null}
      </div>
      <div className="md:col-span-2">
        <Label htmlFor="register-address">Dirección</Label>
        <Textarea id="register-address" {...form.register("address")} />
        {form.formState.errors.address ? <p className="mt-2 text-xs text-red-600">{form.formState.errors.address.message}</p> : null}
      </div>
      <div className="md:col-span-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Creando cuenta..." : "Crear cuenta"}
        </Button>
      </div>
    </form>
  );
}
