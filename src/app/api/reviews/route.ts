import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

// GET - Get reviews for a restaurant (public) or user's reviews
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get("restaurantId");

    // If restaurantId provided, get reviews for that restaurant (public)
    if (restaurantId) {
      const reviews = await prisma.review.findMany({
        where: { restaurantId },
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { phone: true },
          },
        },
      });

      // Mask phone numbers for privacy (show last 4 digits only)
      const maskedReviews = reviews.map((review) => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
        userPhone: review.user.phone.slice(-4).padStart(review.user.phone.length, "*"),
      }));

      // Get restaurant rating stats
      const restaurant = await prisma.restaurant.findUnique({
        where: { id: restaurantId },
        select: { avgRating: true, totalReviews: true },
      });

      return NextResponse.json({ 
        reviews: maskedReviews,
        avgRating: restaurant?.avgRating || 0,
        totalReviews: restaurant?.totalReviews || 0,
      });
    }

    // Otherwise, get current user's reviews
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
    });

    if (!session || session.userType !== "CUSTOMER" || session.expiresAt < new Date()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userReviews = await prisma.review.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      include: {
        restaurant: {
          select: { id: true, name: true, area: true },
        },
      },
    });

    return NextResponse.json({ reviews: userReviews });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Create or update a review
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
    });

    if (!session || session.userType !== "CUSTOMER" || session.expiresAt < new Date()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { restaurantId, rating, comment } = await request.json();

    if (!restaurantId || !rating) {
      return NextResponse.json({ error: "Restaurant ID and rating are required" }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }

    // Check if restaurant exists
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    // Check if user has redeemed a coupon at this restaurant (optional: require visit)
    const hasVisited = await prisma.coupon.findFirst({
      where: {
        userId: session.userId,
        restaurantId,
        status: "USED",
      },
    });

    if (!hasVisited) {
      return NextResponse.json({ 
        error: "You can only review restaurants where you have redeemed a coupon" 
      }, { status: 400 });
    }

    // Upsert review (create or update)
    const review = await prisma.review.upsert({
      where: {
        restaurantId_userId: {
          restaurantId,
          userId: session.userId,
        },
      },
      update: {
        rating,
        comment: comment || null,
      },
      create: {
        restaurantId,
        userId: session.userId,
        rating,
        comment: comment || null,
      },
    });

    // Recalculate restaurant average rating
    const allReviews = await prisma.review.findMany({
      where: { restaurantId },
      select: { rating: true },
    });

    const avgRating = allReviews.length > 0
      ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
      : 0;

    await prisma.restaurant.update({
      where: { id: restaurantId },
      data: {
        avgRating: Math.round(avgRating * 10) / 10, // Round to 1 decimal
        totalReviews: allReviews.length,
      },
    });

    return NextResponse.json({ review, avgRating, totalReviews: allReviews.length });
  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Delete a review
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
    });

    if (!session || session.userType !== "CUSTOMER" || session.expiresAt < new Date()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { reviewId } = await request.json();

    if (!reviewId) {
      return NextResponse.json({ error: "Review ID is required" }, { status: 400 });
    }

    // Verify review belongs to this user
    const review = await prisma.review.findFirst({
      where: { id: reviewId, userId: session.userId },
    });

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    const restaurantId = review.restaurantId;

    await prisma.review.delete({
      where: { id: reviewId },
    });

    // Recalculate restaurant average rating
    const allReviews = await prisma.review.findMany({
      where: { restaurantId },
      select: { rating: true },
    });

    const avgRating = allReviews.length > 0
      ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
      : 0;

    await prisma.restaurant.update({
      where: { id: restaurantId },
      data: {
        avgRating: Math.round(avgRating * 10) / 10,
        totalReviews: allReviews.length,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting review:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
