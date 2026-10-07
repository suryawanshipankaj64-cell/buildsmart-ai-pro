import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    // Web dashboard is reserved strictly for Executive Admins
    if (req.nextUrl.pathname.startsWith('/dashboard')) {
      if (token && token.role && (token.role as string).toUpperCase() !== 'ADMIN') {
        const url = req.nextUrl.clone();
        url.pathname = '/login';
        url.searchParams.set('error', 'admin_only');
        return NextResponse.redirect(url);
      }
    }
    return NextResponse.next();
  },
  {
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*"],
};