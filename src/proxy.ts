import { NextResponse, type NextRequest } from "next/server";
import { isAuthorized } from "@/lib/auth/basic";

/** Must match src/lib/demo/workspaces.ts; the proxy cannot import that server-only module. */
const WORKSPACE_COOKIE = "framelane-demo";
/** The cookie outlives the workspace; the server removes workspaces 7 days after their last use. */
const COOKIE_MAX_AGE = 90 * 24 * 60 * 60;
const WORKSPACE_ID = /^[0-9a-f-]{36}$/;

/**
 * Optional password protection. Set FRAMELANE_PASSWORD (and optionally FRAMELANE_USERNAME,
 * default "admin") to require HTTP Basic auth for everything except the health check.
 *
 * In the public demo, gives each visitor a workspace cookie so they get their own copy of the demo.
 */
export function proxy(request: NextRequest) {
  const password = process.env.FRAMELANE_PASSWORD;
  if (password) {
    const username = process.env.FRAMELANE_USERNAME || "admin";
    if (!isAuthorized(request.headers.get("authorization"), username, password)) {
      return new NextResponse("Authentication required", {
        status: 401,
        headers: { "WWW-Authenticate": 'Basic realm="Framelane", charset="UTF-8"' },
      });
    }
  }

  const demo = process.env.FRAMELANE_DEMO === "1" || process.env.FRAMELANE_DEMO === "true";
  if (!demo) return NextResponse.next();

  const current = request.cookies.get(WORKSPACE_COOKIE)?.value;
  if (current && WORKSPACE_ID.test(current)) return NextResponse.next();
  // First visit: hand out a workspace id and let this same request use it.
  const id = crypto.randomUUID();
  request.cookies.set(WORKSPACE_COOKIE, id);
  const response = NextResponse.next({ request: { headers: request.headers } });
  response.cookies.set(WORKSPACE_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: request.nextUrl.protocol === "https:" || request.headers.get("x-forwarded-proto") === "https",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
  return response;
}

export const config = {
  matcher: ["/((?!api/health|_next/static|_next/image|favicon.ico|icon.svg|apple-icon.png).*)"],
};
