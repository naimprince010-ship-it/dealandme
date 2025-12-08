import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// One-time seed endpoint for production database
// Only works if the database is empty (no admin exists)
export async function GET() {
  try {
    // Check if admin already exists
    const existingAdmin = await prisma.admin.findFirst();
    if (existingAdmin) {
      return NextResponse.json(
        { error: "Database already seeded. Admin user exists." },
        { status: 400 }
      );
    }

    console.log("Seeding production database...");

    // Create admin user
    const adminPassword = await bcrypt.hash("admin123", 10);
    const admin = await prisma.admin.create({
      data: {
        username: "admin",
        passwordHash: adminPassword,
      },
    });
    console.log("Created admin:", admin.username);

    // Create restaurants
    const restaurantPassword = await bcrypt.hash("restaurant123", 10);

    const restaurant1 = await prisma.restaurant.create({
      data: {
        name: "Spice Garden",
        area: "Koramangala",
        description: "Authentic Indian cuisine with a modern twist",
        username: "spicegarden",
        passwordHash: restaurantPassword,
        isActive: true,
      },
    });

    await prisma.offer.create({
      data: {
        restaurantId: restaurant1.id,
        offerText: "20% off on all dine-in orders",
        isActive: true,
      },
    });

    const restaurant2 = await prisma.restaurant.create({
      data: {
        name: "Pizza Paradise",
        area: "Indiranagar",
        description: "Wood-fired pizzas and Italian delights",
        username: "pizzaparadise",
        passwordHash: restaurantPassword,
        isActive: true,
      },
    });

    await prisma.offer.create({
      data: {
        restaurantId: restaurant2.id,
        offerText: "Buy 1 Get 1 Free on all pizzas",
        isActive: true,
      },
    });

    const restaurant3 = await prisma.restaurant.create({
      data: {
        name: "Cafe Mocha",
        area: "HSR Layout",
        description: "Cozy cafe with specialty coffees and desserts",
        username: "cafemocha",
        passwordHash: restaurantPassword,
        isActive: true,
      },
    });

    await prisma.offer.create({
      data: {
        restaurantId: restaurant3.id,
        offerText: "Free dessert with any coffee order",
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Database seeded successfully!",
      data: {
        admin: { username: "admin", password: "admin123" },
        restaurants: [
          { name: "Spice Garden", username: "spicegarden", password: "restaurant123" },
          { name: "Pizza Paradise", username: "pizzaparadise", password: "restaurant123" },
          { name: "Cafe Mocha", username: "cafemocha", password: "restaurant123" },
        ],
        customerOTP: "123456",
      },
    });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json(
      { error: "Failed to seed database", details: String(error) },
      { status: 500 }
    );
  }
}
