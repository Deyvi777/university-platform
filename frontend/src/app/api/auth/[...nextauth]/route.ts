import type { NextRequest } from "next/server";
import { handlers } from "@/auth";
import {
  enforceAuthCookiePersistence,
  REMEMBER_PREFERENCE_COOKIE,
} from "@/lib/auth-cookie-policy";

export async function GET(request: NextRequest) {
  const response = await handlers.GET(request);
  return enforceAuthCookiePersistence(
    response,
    request.cookies.get(REMEMBER_PREFERENCE_COOKIE)?.value,
  );
}

export async function POST(request: NextRequest) {
  const response = await handlers.POST(request);
  return enforceAuthCookiePersistence(
    response,
    request.cookies.get(REMEMBER_PREFERENCE_COOKIE)?.value,
  );
}
