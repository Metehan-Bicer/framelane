import { NextResponse, type NextRequest } from "next/server";
import { isAuthorized } from "@/lib/auth/basic";

/**
 * Optional password protection. Set FRAMELANE_PASSWORD (and optionally FRAMELANE_USERNAME,
 * default "admin") to require HTTP Basic auth for everything except the health check.
 */
export function proxy(request: NextRequest) {
  const password = process.env.FRAMELANE_PASSWORD;
  if (!password) return NextResponse.next();
  const username = process.env.FRAMELANE_USERNAME || "admin";
  if (isAuthorized(request.headers.get("authorization"), username, password)) return NextResponse.next();
  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Framelane", charset="UTF-8"' },
  });
}

export const config = {
  matcher: ["/((?!api/health|_next/static|_next/image|favicon.ico).*)"],
};
