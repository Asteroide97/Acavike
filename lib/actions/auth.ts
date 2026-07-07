"use server";

import { compare, hash } from "bcrypt";
import { createSession, destroySession } from "@/lib/auth";
import { logAuditEntry } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { loginSchema, registerSchema } from "@/lib/validators";

type LoginActionResult =
  | { success: false; error: string }
  | { success: true; redirectTo: string };

type RegisterActionResult =
  | { success: false; error: string }
  | { success: true; redirectTo: string };

export async function loginAction(input: unknown): Promise<LoginActionResult> {
  const parsed = loginSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "No fue posible validar el acceso.",
    };
  }

  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return { success: false, error: "No encontramos una cuenta con ese correo." };
  }

  const matches = await compare(parsed.data.password, user.passwordHash);
  if (!matches) {
    return { success: false, error: "La contraseña es incorrecta." };
  }

  await createSession({ id: user.id, role: user.role });
  await logAuditEntry({
    userId: user.id,
    action: "LOGIN",
    entity: "user",
    entityId: user.id,
  });

  return {
    success: true,
    redirectTo: user.role === "CUSTOMER" ? "/mi-cuenta" : "/admin",
  };
}

export async function registerAction(input: unknown): Promise<RegisterActionResult> {
  const parsed = registerSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "No fue posible crear la cuenta.",
    };
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return {
      success: false,
      error: "Ya existe una cuenta con ese correo. Inicia sesión para continuar.",
    };
  }

  const passwordHash = await hash(parsed.data.password, 10);

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email,
      passwordHash,
      role: "CUSTOMER",
      customer: {
        create: {
          name: parsed.data.name,
          companyName: parsed.data.companyName,
          rfc: parsed.data.rfc || null,
          email,
          phone: parsed.data.phone,
          address: parsed.data.address,
        },
      },
    },
  });

  await createSession({ id: user.id, role: user.role });
  await logAuditEntry({
    userId: user.id,
    action: "REGISTER",
    entity: "user",
    entityId: user.id,
  });

  return {
    success: true,
    redirectTo: "/mi-cuenta",
  };
}

export async function logoutAction() {
  await destroySession();
}
