import { auth } from "@/auth";

// Add any new protected route prefixes here
// btw any sub directory like "/dashboard/[any directory]"
// is also protected
const PROTECTED_ROUTES = ["/dashboard"];

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route),
  );

  if (isProtectedRoute && !isLoggedIn) {
    return Response.redirect(new URL("/", req.nextUrl));
  }
});

// This prevents the auth check from running on images or static pages
// got this pattern from gpt but it works lol
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
