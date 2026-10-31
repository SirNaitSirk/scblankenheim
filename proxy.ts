import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { isAdminUserId } from "@/lib/coming-soon/admin";
import {
  COMING_SOON_PATH,
  COMING_SOON_RETRY_AFTER_SECONDS,
  decideGate,
  isComingSoonEnabled,
  isGatedRequest,
} from "@/lib/coming-soon/gate";
import { COMING_SOON_MESSAGES } from "@/lib/coming-soon/messages";

// The admin surface is the only protected area. Public marketing, payment, the
// packing list, the design-system reference, and the Clerk auth pages stay open.
// Admin route handlers (specs/020-school-release) check the permission again themselves.
const isProtectedRoute = createRouteMatcher(["/admin(.*)", "/api/admin(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    // Redirects logged-out visitors to NEXT_PUBLIC_CLERK_SIGN_IN_URL (/sign-in).
    await auth.protect();
    return;
  }

  // Prelaunch gate (specs/023-coming-soon): only admins see the public site.
  const enabled = isComingSoonEnabled(process.env.COMING_SOON);
  const { pathname } = req.nextUrl;
  if (!isGatedRequest(enabled, pathname)) return;

  const { userId } = await auth();
  const isAdmin = userId ? await isAdminUserId(userId) : false;
  const decision = decideGate({ enabled, pathname, method: req.method, isAdmin });
  if (decision === "pass") return;

  if (decision === "rewrite") {
    const response = NextResponse.rewrite(new URL(COMING_SOON_PATH, req.url));
    response.headers.set("X-Robots-Tag", "noindex");
    return response;
  }

  return new NextResponse(COMING_SOON_MESSAGES.refused, {
    status: 503,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Retry-After": String(COMING_SOON_RETRY_AFTER_SECONDS),
      "X-Robots-Tag": "noindex",
    },
  });
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|mp4|webm)).*)",
    "/(api|trpc)(.*)",
  ],
};
