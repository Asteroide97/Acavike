import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { UserRole } from "@prisma/client";
import { SESSION_COOKIE } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

type SessionPayload = {
  userId: string;
  role: UserRole;
  exp: number;
};

function getSessionSecret() {
  return process.env.SESSION_SECRET || "acavike-dev-secret";
}

function encode(payload: SessionPayload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", getSessionSecret()).update(body).digest("base64url");
  return `${body}.${signature}`;
}

function decode(token: string) {
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

  const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionPayload;

  if (payload.exp < Date.now()) {
    return null;
  }

  return payload;
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
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }

  return decode(token);
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) {
    return null;
  }

  return prisma.user.findUnique({
    where: { id: session.userId },
    include: { customer: true },
  });
}

export async function requireUser(roles?: UserRole[]) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/mi-cuenta");
  }

  if (roles && !roles.includes(user.role)) {
    redirect("/admin?denied=1");
  }

  return user;
}
