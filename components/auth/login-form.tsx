"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { loginAction } from "@/lib/actions/auth";
import { loginSchema } from "@/lib/validators";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    setServerError(null);
    startTransition(async () => {
      const result = await loginAction(values);
      if (!result.success) {
        setServerError(result.error);
        return;
      }

      router.push(result.redirectTo);
      router.refresh();
    });
  });

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      {serverError ? <Alert tone="danger">{serverError}</Alert> : null}
      <div>
        <Label htmlFor="login-email">Correo</Label>
        <Input id="login-email" type="email" {...form.register("email")} />
        {form.formState.errors.email ? (
          <p className="mt-2 text-xs text-red-600">{form.formState.errors.email.message}</p>
        ) : null}
      </div>
      <div>
        <Label htmlFor="login-password">Contraseña</Label>
        <Input id="login-password" type="password" {...form.register("password")} />
        {form.formState.errors.password ? (
          <p className="mt-2 text-xs text-red-600">{form.formState.errors.password.message}</p>
        ) : null}
      </div>
      <Button type="submit" fullWidth disabled={isPending}>
        {isPending ? "Ingresando..." : "Ingresar"}
      </Button>
    </form>
  );
}
