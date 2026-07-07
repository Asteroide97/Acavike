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
      {serverState.success ? <Alert className="md:col-span-2" tone="success">Mensaje enviado. El equipo comercial te responderá pronto.</Alert> : null}
      <div>
        <Label htmlFor="contact-name">Nombre</Label>
        <Input id="contact-name" {...form.register("name")} />
        {form.formState.errors.name ? <p className="mt-2 text-xs text-red-600">{form.formState.errors.name.message}</p> : null}
      </div>
      <div>
        <Label htmlFor="contact-company">Empresa</Label>
        <Input id="contact-company" {...form.register("companyName")} />
      </div>
      <div>
        <Label htmlFor="contact-email">Correo</Label>
        <Input id="contact-email" type="email" {...form.register("email")} />
        {form.formState.errors.email ? <p className="mt-2 text-xs text-red-600">{form.formState.errors.email.message}</p> : null}
      </div>
      <div>
        <Label htmlFor="contact-phone">Teléfono</Label>
        <Input id="contact-phone" {...form.register("phone")} />
      </div>
      <div className="md:col-span-2">
        <Label htmlFor="contact-message">Mensaje</Label>
        <Textarea id="contact-message" {...form.register("message")} />
        {form.formState.errors.message ? <p className="mt-2 text-xs text-red-600">{form.formState.errors.message.message}</p> : null}
      </div>
      <div className="md:col-span-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Enviando..." : "Enviar mensaje"}
        </Button>
      </div>
    </form>
  );
}
