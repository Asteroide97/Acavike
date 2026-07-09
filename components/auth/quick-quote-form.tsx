"use client";

import { useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { submitQuickQuoteAction } from "@/lib/actions/commerce";
import { quickQuoteSchema } from "@/lib/validators";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type QuickQuoteValues = z.infer<typeof quickQuoteSchema>;

export function QuickQuoteForm({
  initialRequirements = "",
}: {
  initialRequirements?: string;
}) {
  const [serverState, setServerState] = useState<{ error?: string; success?: boolean; quoteNumber?: string }>({});
  const [isPending, startTransition] = useTransition();
  const form = useForm<QuickQuoteValues>({
    resolver: zodResolver(quickQuoteSchema),
    defaultValues: {
      name: "",
      companyName: "",
      email: "",
      phone: "",
      requirements: initialRequirements,
      notes: "",
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await submitQuickQuoteAction(values);
      setServerState(result);
      if (result.success) {
        form.reset();
      }
    });
  });

  return (
    <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
      {serverState.error ? <Alert className="md:col-span-2" tone="danger">{serverState.error}</Alert> : null}
      {serverState.success ? (
        <Alert className="md:col-span-2" tone="success">
          Solicitud registrada. Folio generado: <strong>{serverState.quoteNumber}</strong>.
        </Alert>
      ) : null}
      <div>
        <Label htmlFor="quote-name">Nombre</Label>
        <Input id="quote-name" {...form.register("name")} />
      </div>
      <div>
        <Label htmlFor="quote-company">Empresa</Label>
        <Input id="quote-company" {...form.register("companyName")} />
      </div>
      <div>
        <Label htmlFor="quote-email">Correo</Label>
        <Input id="quote-email" type="email" {...form.register("email")} />
      </div>
      <div>
        <Label htmlFor="quote-phone">Teléfono</Label>
        <Input id="quote-phone" {...form.register("phone")} />
      </div>
      <div className="md:col-span-2">
        <Label htmlFor="quote-requirements">Requerimientos</Label>
        <Textarea
          id="quote-requirements"
          placeholder="Ejemplo: Guante anticorte | 24&#10;Caja corrugada doble pared | 50"
          {...form.register("requirements")}
        />
      </div>
      <div className="md:col-span-2">
        <Label htmlFor="quote-notes">Notas adicionales</Label>
        <Textarea id="quote-notes" {...form.register("notes")} />
      </div>
      <div className="md:col-span-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Enviando..." : "Solicitar cotización"}
        </Button>
      </div>
    </form>
  );
}
