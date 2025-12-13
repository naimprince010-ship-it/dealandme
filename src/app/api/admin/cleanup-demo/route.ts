import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// Demo restaurant names to delete
const DEMO_RESTAURANTS = ["Spice Garden", "Pizza Paradise", "Cafe Mocha"];

// Demo area names to delete (these are the old Indian demo areas)
const DEMO_AREAS = ["Indiranagar", "Koramangala", "HSR Layout"];

export async function DELETE() {
  try {
    // Verify admin authentication
    const session = await getSession();
    if (!session || session.userType !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const results = {
      deletedRestaurants: [] as string[],
      deletedAreas: [] as string[],
      errors: [] as string[],
    };

    // Delete demo restaurants (cascade will handle offers, coupons, etc.)
    for (const name of DEMO_RESTAURANTS) {
      try {
        const restaurant = await prisma.restaurant.findFirst({
          where: { name },
        });
        if (restaurant) {
          await prisma.restaurant.delete({
            where: { id: restaurant.id },
          });
          results.deletedRestaurants.push(name);
        }
      } catch (error) {
        results.errors.push(`Failed to delete restaurant ${name}: ${error}`);
      }
    }

    // Delete demo areas
    for (const nameEn of DEMO_AREAS) {
      try {
        const area = await prisma.area.findFirst({
          where: { nameEn },
        });
        if (area) {
          await prisma.area.delete({
            where: { id: area.id },
          });
          results.deletedAreas.push(nameEn);
        }
      } catch (error) {
        results.errors.push(`Failed to delete area ${nameEn}: ${error}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Demo data cleanup completed",
      results,
    });
  } catch (error) {
    console.error("Cleanup error:", error);
    return NextResponse.json(
      { error: "Failed to cleanup demo data", details: String(error) },
      { status: 500 }
    );
  }
}
