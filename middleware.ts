import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  // Only protect routes starting with /dashboard
  matcher: ["/dashboard/:path*", "/api/dashboard/:path*"],
};