"use client";

import { useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { submitContactMessageAction } from "@/lib/actions/commerce";
import { contactSchema } from "@/lib/validators";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type ContactValues = z.infer<typeof contactSchema>;

export function ContactForm() {
  const [serverState, setServerState] = useState<{ error?: string; success?: boolean }>({});
  const [isPending, startTransition] = useTransition();
  const form = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      companyName: "",
      email: "",
      phone: "",
      message: "",
    },
  });

  const fieldClassName = "rounded-[6px] border-[#D1D5DB] focus:border-[#1D3B7A] focus:ring-[#1D3B7A]/10";
  const labelClassName = "text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-600";

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await submitContactMessageAction(values);
      setServerState(result);
      if (result.success) {
        form.reset();
      }
    });
  });

  return (
    <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
      {serverState.error ? <Alert className="md:col-span-2" tone="danger">{serverState.error}</Alert> : null}
      {serverState.success ? <Alert className="md:col-span-2" tone="success">Mensaje enviado. El equipo comercial te respondera pronto.</Alert> : null}
      <div>
        <Label htmlFor="contact-name" className={labelClassName}>Nombre</Label>
        <Input id="contact-name" className={fieldClassName} {...form.register("name")} />
        {form.formState.errors.name ? <p className="mt-2 text-xs text-red-600">{form.formState.errors.name.message}</p> : null}
      </div>
      <div>
        <Label htmlFor="contact-company" className={labelClassName}>Empresa</Label>
        <Input id="contact-company" className={fieldClassName} {...form.register("companyName")} />
      </div>
      <div>
        <Label htmlFor="contact-email" className={labelClassName}>Correo</Label>
        <Input id="contact-email" type="email" className={fieldClassName} {...form.register("email")} />
        {form.formState.errors.email ? <p className="mt-2 text-xs text-red-600">{form.formState.errors.email.message}</p> : null}
      </div>
      <div>
        <Label htmlFor="contact-phone" className={labelClassName}>Telefono</Label>
        <Input id="contact-phone" className={fieldClassName} {...form.register("phone")} />
      </div>
      <div className="md:col-span-2">
        <Label htmlFor="contact-message" className={labelClassName}>Mensaje</Label>
        <Textarea id="contact-message" className={fieldClassName} {...form.register("message")} />
        {form.formState.errors.message ? <p className="mt-2 text-xs text-red-600">{form.formState.errors.message.message}</p> : null}
      </div>
      <div className="md:col-span-2">
        <Button type="submit" className="rounded-[6px] bg-[#0B1E4B] hover:bg-[#081632]" disabled={isPending}>
          {isPending ? "Enviando..." : "Enviar mensaje"}
        </Button>
      </div>
    </form>
  );
}
