import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import "dotenv/config";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const adminPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.admin.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      passwordHash: adminPassword,
    },
  });
  console.log("Created admin:", admin.username);

  const restaurantPassword = await bcrypt.hash("restaurant123", 10);
  
  const restaurant1 = await prisma.restaurant.upsert({
    where: { username: "spicegarden" },
    update: {},
    create: {
      name: "Spice Garden",
      area: "Koramangala",
      description: "Authentic Indian cuisine with a modern twist",
      username: "spicegarden",
      passwordHash: restaurantPassword,
      isActive: true,
    },
  });
  console.log("Created restaurant:", restaurant1.name);

  await prisma.offer.upsert({
    where: { restaurantId: restaurant1.id },
    update: {},
    create: {
      restaurantId: restaurant1.id,
      offerText: "20% off on all dine-in orders",
      isActive: true,
    },
  });
  console.log("Created offer for:", restaurant1.name);

  const restaurant2 = await prisma.restaurant.upsert({
    where: { username: "pizzaparadise" },
    update: {},
    create: {
      name: "Pizza Paradise",
      area: "Indiranagar",
      description: "Wood-fired pizzas and Italian delights",
      username: "pizzaparadise",
      passwordHash: restaurantPassword,
      isActive: true,
    },
  });
  console.log("Created restaurant:", restaurant2.name);

  await prisma.offer.upsert({
    where: { restaurantId: restaurant2.id },
    update: {},
    create: {
      restaurantId: restaurant2.id,
      offerText: "Buy 1 Get 1 Free on all pizzas",
      isActive: true,
    },
  });
  console.log("Created offer for:", restaurant2.name);

  const restaurant3 = await prisma.restaurant.upsert({
    where: { username: "cafemocha" },
    update: {},
    create: {
      name: "Cafe Mocha",
      area: "HSR Layout",
      description: "Cozy cafe with specialty coffees and desserts",
      username: "cafemocha",
      passwordHash: restaurantPassword,
      isActive: true,
    },
  });
  console.log("Created restaurant:", restaurant3.name);

  await prisma.offer.upsert({
    where: { restaurantId: restaurant3.id },
    update: {},
    create: {
      restaurantId: restaurant3.id,
      offerText: "Free dessert with any coffee order",
      isActive: true,
    },
  });
  console.log("Created offer for:", restaurant3.name);

  console.log("\nSeed completed!");
  console.log("\nTest credentials:");
  console.log("Admin: username=admin, password=admin123");
  console.log("Restaurants: password=restaurant123 for all");
  console.log("  - spicegarden (Koramangala)");
  console.log("  - pizzaparadise (Indiranagar)");
  console.log("  - cafemocha (HSR Layout)");
  console.log("Customer: Use any phone number with OTP=123456");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
