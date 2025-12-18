import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let username: string | null = null;
    let password: string | null = null;
    let isFormSubmit = false;

    // Handle both JSON and form submissions
    if (contentType.includes("application/json")) {
      const body = await request.json();
      username = typeof body.username === "string" ? body.username : null;
      password = typeof body.password === "string" ? body.password : null;
    } else if (
      contentType.includes("application/x-www-form-urlencoded") ||
      contentType.includes("multipart/form-data")
    ) {
      isFormSubmit = true;
      const formData = await request.formData();
      username = formData.get("username")?.toString() ?? null;
      password = formData.get("password")?.toString() ?? null;
    } else {
      // Fallback: try JSON
      try {
        const body = await request.json();
        username = typeof body.username === "string" ? body.username : null;
        password = typeof body.password === "string" ? body.password : null;
      } catch {
        // leave null; will hit validation error below
      }
    }

    if (!username) {
      if (isFormSubmit) {
        return NextResponse.redirect(new URL("/admin/login?error=Username+is+required", request.url));
      }
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    if (!password) {
      if (isFormSubmit) {
        return NextResponse.redirect(new URL("/admin/login?error=Password+is+required", request.url));
      }
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      );
    }

    const admin = await prisma.admin.findUnique({
      where: { username },
    });

    if (!admin) {
      if (isFormSubmit) {
        return NextResponse.redirect(new URL("/admin/login?error=Invalid+credentials", request.url));
      }
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const isValidPassword = await verifyPassword(password, admin.passwordHash);

    if (!isValidPassword) {
      if (isFormSubmit) {
        return NextResponse.redirect(new URL("/admin/login?error=Invalid+credentials", request.url));
      }
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    await createSession(admin.id, "ADMIN");

    // For form submissions, redirect to dashboard
    if (isFormSubmit) {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }

    // For JSON requests, return JSON response
    return NextResponse.json({
      success: true,
      admin: {
        id: admin.id,
        username: admin.username,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json(
      { error: "Failed to login" },
      { status: 500 }
    );
  }
}
