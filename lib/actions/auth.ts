"use server";

import { compare, hash } from "bcrypt";
import { createSession, destroySession } from "@/lib/auth";
import { logAuditEntry } from "@/lib/audit";
import { DATABASE_CONFIG_ERROR, DATABASE_ENABLED, DEMO_MODE } from "@/lib/config";
import { demoCredentials, demoCustomerUser, findDemoUserByEmail } from "@/lib/demo-data";
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

  if (DEMO_MODE) {
    const user = findDemoUserByEmail(email);
    const credentials = demoCredentials[email as keyof typeof demoCredentials];

    if (!user || !credentials || credentials.password !== parsed.data.password) {
      return { success: false, error: "Usa una credencial demo valida para iniciar sesion." };
    }

    await createSession({ id: user.id, role: user.role });
    return {
      success: true,
      redirectTo: user.role === "CUSTOMER" ? "/mi-cuenta" : "/admin",
    };
  }

  if (!DATABASE_ENABLED) {
    return {
      success: false,
      error: DATABASE_CONFIG_ERROR ?? "La base de datos no esta configurada.",
    };
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return { success: false, error: "No encontramos una cuenta con ese correo." };
  }

  const matches = await compare(parsed.data.password, user.passwordHash);
  if (!matches) {
    return { success: false, error: "La contrasena es incorrecta." };
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

  if (DEMO_MODE) {
    await createSession({ id: demoCustomerUser.id, role: demoCustomerUser.role });
    return {
      success: true,
      redirectTo: "/mi-cuenta",
    };
  }

  if (!DATABASE_ENABLED) {
    return {
      success: false,
      error: DATABASE_CONFIG_ERROR ?? "La base de datos no esta configurada.",
    };
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return {
      success: false,
      error: "Ya existe una cuenta con ese correo. Inicia sesion para continuar.",
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
