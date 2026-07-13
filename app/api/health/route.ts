import { NextResponse } from "next/server";
import { APP_MODE, DEMO_MODE, HAS_DATABASE_URL } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function GET() {
  const payload = {
    ok: true,
    mode: APP_MODE,
  };

  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(payload);
  }

  return NextResponse.json({
    ...payload,
    demoMode: DEMO_MODE,
    hasDatabaseUrl: HAS_DATABASE_URL,
    demoModeVariableExists: Boolean(process.env.DEMO_MODE),
    demoModeRawLength: process.env.DEMO_MODE?.length ?? 0,
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
  });
}
