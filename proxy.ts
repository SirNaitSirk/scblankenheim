import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// The admin surface is the only protected area. Public marketing, payment, the
// packing list, the design-system reference, and the Clerk auth pages stay open.
const isProtectedRoute = createRouteMatcher(["/admin(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    // Redirects logged-out visitors to NEXT_PUBLIC_CLERK_SIGN_IN_URL (/sign-in).
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
