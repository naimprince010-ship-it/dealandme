import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE_NAMES = {
  CUSTOMER: "dealbox_customer_session",
  RESTAURANT: "dealbox_restaurant_session",
  ADMIN: "dealbox_admin_session",
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  const customerSessionToken = request.cookies.get(SESSION_COOKIE_NAMES.CUSTOMER)?.value;
  const restaurantSessionToken = request.cookies.get(SESSION_COOKIE_NAMES.RESTAURANT)?.value;
  const adminSessionToken = request.cookies.get(SESSION_COOKIE_NAMES.ADMIN)?.value;

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

  if (isCustomerProtected && !customerSessionToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (isRestaurantProtected && !restaurantSessionToken) {
    return NextResponse.redirect(new URL("/restaurant/login", request.url));
  }
  if (isAdminProtected && !adminSessionToken) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  if (pathname === "/restaurant" && !restaurantSessionToken) {
    return NextResponse.redirect(new URL("/restaurant/login", request.url));
  }

  if (pathname === "/admin" && !adminSessionToken) {
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
