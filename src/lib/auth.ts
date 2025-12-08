import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { UserType } from "@prisma/client";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

const SESSION_COOKIE_NAME = "dealbox_session";
const SESSION_DURATION_HOURS = 24;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateSessionToken(): string {
  return uuidv4();
}

export function generateCouponCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function createSession(
  userId: string,
  userType: UserType
): Promise<string> {
  const token = generateSessionToken();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + SESSION_DURATION_HOURS);

  await prisma.session.create({
    data: {
      token,
      userId,
      userType,
      expiresAt,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });

  return token;
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: { token },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await prisma.session.delete({ where: { id: session.id } });
    }
    return null;
  }

  return session;
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    await prisma.session.deleteMany({ where: { token } });
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getCustomer() {
  const session = await getSession();
  if (!session || session.userType !== "CUSTOMER") {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
  });

  return user;
}

export async function getRestaurant() {
  const session = await getSession();
  if (!session || session.userType !== "RESTAURANT") {
    return null;
  }

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: session.userId },
  });

  return restaurant;
}

export async function getAdmin() {
  const session = await getSession();
  if (!session || session.userType !== "ADMIN") {
    return null;
  }

  const admin = await prisma.admin.findUnique({
    where: { id: session.userId },
  });

  return admin;
}

export async function requireCustomer() {
  const customer = await getCustomer();
  if (!customer) {
    throw new Error("Unauthorized: Customer login required");
  }
  return customer;
}

export async function requireRestaurant() {
  const restaurant = await getRestaurant();
  if (!restaurant) {
    throw new Error("Unauthorized: Restaurant login required");
  }
  return restaurant;
}

export async function requireAdmin() {
  const admin = await getAdmin();
  if (!admin) {
    throw new Error("Unauthorized: Admin login required");
  }
  return admin;
}
