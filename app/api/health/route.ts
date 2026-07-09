import { NextResponse } from "next/server";
import { APP_MODE, DEMO_MODE, HAS_DATABASE_URL } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    demoMode: DEMO_MODE,
    hasDatabaseUrl: HAS_DATABASE_URL,
    mode: APP_MODE,
    demoModeVariableExists: Boolean(process.env.DEMO_MODE),
    demoModeRawLength: process.env.DEMO_MODE?.length ?? 0,
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
  });
}
