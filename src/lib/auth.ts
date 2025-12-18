import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { UserType } from "@prisma/client";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

const SESSION_DURATION_HOURS = 24;
const CUSTOMER_SESSION_DURATION_DAYS = 30;

const SESSION_COOKIE_NAMES: Record<UserType, string> = {
  CUSTOMER: "dealbox_customer_session",
  RESTAURANT: "dealbox_restaurant_session",
  ADMIN: "dealbox_admin_session",
};

function getCookieNameForType(userType: UserType): string {
  return SESSION_COOKIE_NAMES[userType];
}

function getCookiePathForType(userType: UserType): string {
  // All cookies use root path "/" because API routes are at /api/*
  // The separate cookie names prevent conflicts between user types
  void userType;
  return "/";
}

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
  
  if (userType === "CUSTOMER") {
    expiresAt.setDate(expiresAt.getDate() + CUSTOMER_SESSION_DURATION_DAYS);
  } else {
    expiresAt.setHours(expiresAt.getHours() + SESSION_DURATION_HOURS);
  }

  await prisma.session.create({
    data: {
      token,
      userId,
      userType,
      expiresAt,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(getCookieNameForType(userType), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: getCookiePathForType(userType),
  });

  return token;
}

async function getSessionForType(userType: UserType) {
  const cookieStore = await cookies();
  const cookieName = getCookieNameForType(userType);
  const token = cookieStore.get(cookieName)?.value;

  if (!token) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: { token },
  });

  if (!session || session.expiresAt < new Date() || session.userType !== userType) {
    if (session) {
      await prisma.session.delete({ where: { id: session.id } });
    }
    return null;
  }

  return session;
}

export async function getSession() {
  const cookieStore = await cookies();
  
  for (const userType of Object.keys(SESSION_COOKIE_NAMES) as UserType[]) {
    const cookieName = getCookieNameForType(userType);
    const token = cookieStore.get(cookieName)?.value;
    
    if (token) {
      const session = await prisma.session.findUnique({
        where: { token },
      });

      if (session && session.expiresAt >= new Date()) {
        return session;
      }
      
      if (session) {
        await prisma.session.delete({ where: { id: session.id } });
      }
    }
  }

  return null;
}

export async function destroySession(userType?: UserType): Promise<void> {
  const cookieStore = await cookies();
  
  if (userType) {
    const cookieName = getCookieNameForType(userType);
    const token = cookieStore.get(cookieName)?.value;
    
    if (token) {
      await prisma.session.deleteMany({ where: { token } });
    }
    
    cookieStore.delete(cookieName);
  } else {
    for (const type of Object.keys(SESSION_COOKIE_NAMES) as UserType[]) {
      const cookieName = getCookieNameForType(type);
      const token = cookieStore.get(cookieName)?.value;
      
      if (token) {
        await prisma.session.deleteMany({ where: { token } });
      }
      
      cookieStore.delete(cookieName);
    }
  }
}

export async function getCustomer() {
  const session = await getSessionForType("CUSTOMER");
  if (!session) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
  });

  return user;
}

// Optimized: Get customer with session in a single query
// This reduces 2 DB round-trips to 1 for better performance
export async function getCustomerFast() {
  const cookieStore = await cookies();
  const token = cookieStore.get(getCookieNameForType("CUSTOMER"))?.value;

  if (!token) {
    return null;
  }

  // Single query: get session and user together
  const result = await prisma.$queryRaw<Array<{
    session_id: string;
    user_type: string;
    user_id: string;
    expires_at: Date;
    id: string;
    phone: string;
    referral_code: string | null;
    referred_by: string | null;
    photo_url: string | null;
    created_at: Date;
  }>>`
    SELECT 
      s.id as session_id,
      s.user_type,
      s.user_id,
      s.expires_at,
      u.id,
      u.phone,
      u.referral_code,
      u.referred_by,
      u.photo_url,
      u.created_at
    FROM sessions s
    INNER JOIN users u ON s.user_id = u.id
    WHERE s.token = ${token}
      AND s.user_type = 'CUSTOMER'
      AND s.expires_at > NOW()
    LIMIT 1
  `;

  if (!result || result.length === 0) {
    return null;
  }

  const row = result[0];
  return {
    id: row.id,
    phone: row.phone,
    referralCode: row.referral_code,
    referredBy: row.referred_by,
    photoUrl: row.photo_url,
    createdAt: row.created_at,
  };
}

export async function getRestaurant() {
  const session = await getSessionForType("RESTAURANT");
  if (!session) {
    return null;
  }

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: session.userId },
  });

  return restaurant;
}

export async function getAdmin() {
  const session = await getSessionForType("ADMIN");
  if (!session) {
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
