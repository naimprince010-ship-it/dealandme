import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE_NAME = "dealbox_session";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  const customerProtectedPaths = ["/coupons", "/restaurants/", "/my-coupons"];
  const restaurantProtectedPaths = ["/restaurant/dashboard", "/restaurant/validate", "/restaurant/history"];
  const adminProtectedPaths = ["/admin/dashboard", "/admin/restaurants", "/admin/coupons", "/admin/stats"];

  const isCustomerProtected = customerProtectedPaths.some((path) =>
    pathname.startsWith(path)
  );
  const isRestaurantProtected = restaurantProtectedPaths.some((path) =>
    pathname.startsWith(path)
  );
  const isAdminProtected = adminProtectedPaths.some((path) =>
    pathname.startsWith(path)
  );

  if (!sessionToken) {
    if (isCustomerProtected) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (isRestaurantProtected) {
      return NextResponse.redirect(new URL("/restaurant/login", request.url));
    }
    if (isAdminProtected) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  if (pathname === "/restaurant" && !sessionToken) {
    return NextResponse.redirect(new URL("/restaurant/login", request.url));
  }

  if (pathname === "/admin" && !sessionToken) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/coupons/:path*",
    "/restaurants/:path*",
    "/restaurant/:path*",
    "/admin/:path*",
    "/my-coupons/:path*",
  ],
};
