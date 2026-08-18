import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { UserRole } from "@prisma/client";
import { SESSION_COOKIE } from "@/lib/constants";
import { AUTH_SECRET, DATABASE_ENABLED, DEMO_MODE } from "@/lib/config";
import { demoBackofficeUser, demoCustomerUser, findDemoViewerById, getDemoRuntimeUser } from "@/lib/demo-data";
import { prisma } from "@/lib/prisma";

type SessionPayload = {
  userId: string;
  role: UserRole;
  exp: number;
};

const VALID_USER_ROLES = ["SUPERADMIN", "ADMIN", "WAREHOUSE", "SALES", "CUSTOMER"] as const satisfies UserRole[];

function getSessionSecret() {
  return AUTH_SECRET;
}

function encode(payload: SessionPayload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", getSessionSecret()).update(body).digest("base64url");
  return `${body}.${signature}`;
}

function decode(token: string) {
  try {
    const [body, signature] = token.split(".");
    if (!body || !signature) {
      return null;
    }

    const expected = createHmac("sha256", getSessionSecret()).update(body).digest("base64url");

    if (expected.length !== signature.length) {
      return null;
    }

    if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as Partial<SessionPayload>;
    const hasValidUserId = typeof payload.userId === "string" && payload.userId.trim().length > 0;
    const hasValidRole =
      typeof payload.role === "string" && VALID_USER_ROLES.includes(payload.role as (typeof VALID_USER_ROLES)[number]);
    const hasValidExpiration = typeof payload.exp === "number" && Number.isFinite(payload.exp);

    if (!hasValidUserId || !hasValidRole || !hasValidExpiration) {
      return null;
    }

    const expiration = payload.exp as number;
    const userId = payload.userId as string;
    const role = payload.role as UserRole;

    if (expiration < Date.now()) {
      return null;
    }

    return {
      userId,
      role,
      exp: expiration,
    };
  } catch {
    return null;
  }
}

async function getCookieStoreSafe() {
  try {
    return await cookies();
  } catch {
    return null;
  }
}

export async function createSession(user: { id: string; role: UserRole }) {
  const cookieStore = await cookies();
  const payload: SessionPayload = {
    userId: user.id,
    role: user.role,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7,
  };

  cookieStore.set(SESSION_COOKIE, encode(payload), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSession() {
  const cookieStore = await getCookieStoreSafe();
  const token = cookieStore?.get(SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }

  return decode(token);
}

export async function getCurrentUser() {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return null;
    }

    if (DEMO_MODE) {
      return findDemoViewerById(session.userId) ?? null;
    }

    if (!DATABASE_ENABLED) {
      return null;
    }

    return await prisma.user
      .findUnique({
        where: { id: session.userId },
        include: { customer: true },
      })
      .catch(() => null);
  } catch {
    return null;
  }
}

export async function requireUser(roles?: UserRole[]) {
  if (DEMO_MODE) {
    if (roles?.includes("CUSTOMER")) {
      return demoCustomerUser;
    }

    return getDemoRuntimeUser(roles?.[0] ?? demoBackofficeUser.role);
  }

  if (!DATABASE_ENABLED) {
    return getDemoRuntimeUser(roles?.[0] ?? "ADMIN");
  }

  const user = await getCurrentUser();

  if (!user) {
    redirect("/mi-cuenta");
  }

  if (roles && !roles.includes(user.role)) {
    redirect("/admin?denied=1");
  }

  return user;
}
