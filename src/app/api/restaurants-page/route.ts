import { NextRequest, NextResponse } from "next/server";

const FOURSQUARE_API_KEY = process.env.FOURSQUARE_API_KEY || "";
const FOURSQUARE_API_BASE = "https://api.foursquare.com/v3/places/search";

type RestaurantPayload = {
  id: string;
  name: string;
  area: string;
  cuisine: string | null;
  description: string | null;
  rating: number;
  reviewCount: number;
  distance: string;
  offer: {
    id: string;
    offerText: string;
    photoUrl: string | null;
    discountType: "PERCENTAGE" | "FLAT";
    discountValue: number;
  } | null;
};

type FoursquarePlace = {
  fsq_id: string;
  name: string;
  categories?: Array<{ name?: string }>;
  distance?: number;
  location?: {
    locality?: string;
    region?: string;
    country?: string;
    formatted_address?: string;
  };
};

type FoursquareResponse = {
  results?: FoursquarePlace[];
};

const CITY_SEARCH_TARGETS = ["London", "Paris", "New York", "Cox's Bazar"];

const OFFER_POOL: Array<{
  offerText: string;
  discountType: "PERCENTAGE" | "FLAT";
  discountValue: number;
}> = [
  { offerText: "Buy 1 Get 1 Free on Main Course", discountType: "PERCENTAGE", discountValue: 50 },
  { offerText: "25% Off on Total Bill", discountType: "PERCENTAGE", discountValue: 25 },
  { offerText: "30% Off Dinner Menu", discountType: "PERCENTAGE", discountValue: 30 },
  { offerText: "$12 Off for 2 Guests", discountType: "FLAT", discountValue: 12 },
  { offerText: "Happy Hour: 20% Off Drinks", discountType: "PERCENTAGE", discountValue: 20 },
  { offerText: "Free Dessert with Any Combo", discountType: "PERCENTAGE", discountValue: 15 },
];

const CUISINE_IMAGE_MAP: Record<string, string> = {
  pizza: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1200&q=80",
  sushi: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=1200&q=80",
  burger: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200&q=80",
  seafood: "https://images.unsplash.com/photo-1559847844-5315695dadae?w=1200&q=80",
  steak: "https://images.unsplash.com/photo-1558030006-450675393462?w=1200&q=80",
  indian: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=1200&q=80",
  cafe: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1200&q=80",
  chinese: "https://images.unsplash.com/photo-1525755662778-989d0524087e?w=1200&q=80",
  thai: "https://images.unsplash.com/photo-1559314809-0f31657def5e?w=1200&q=80",
  default: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80",
};

const MOCK_GLOBAL_RESTAURANTS: RestaurantPayload[] = [
  {
    id: "global_mock_lon_1",
    name: "The Golden Fork London",
    area: "London",
    cuisine: "British Fusion",
    description: "Elegant riverside dining with handcrafted seasonal plates.",
    rating: 4.7,
    reviewCount: 2410,
    distance: "1.2 km away",
    offer: {
      id: "offer_mock_lon_1",
      offerText: "Buy 1 Get 1 Free on Main Course",
      photoUrl: "https://images.unsplash.com/photo-1541544181051-e46607ffe6f3?w=1200&q=80",
      discountType: "PERCENTAGE",
      discountValue: 50,
    },
  },
  {
    id: "global_mock_lon_2",
    name: "Camden Smokehouse",
    area: "London",
    cuisine: "Steak & Grill",
    description: "Charcoal-grilled steaks with classic London pub vibes.",
    rating: 4.4,
    reviewCount: 1738,
    distance: "2.4 km away",
    offer: {
      id: "offer_mock_lon_2",
      offerText: "25% Off on Total Bill",
      photoUrl: "https://images.unsplash.com/photo-1558030006-450675393462?w=1200&q=80",
      discountType: "PERCENTAGE",
      discountValue: 25,
    },
  },
  {
    id: "global_mock_par_1",
    name: "Bistro Lumiere",
    area: "Paris",
    cuisine: "French",
    description: "Classic Parisian bistro serving elevated comfort cuisine.",
    rating: 4.8,
    reviewCount: 3011,
    distance: "0.9 km away",
    offer: {
      id: "offer_mock_par_1",
      offerText: "30% Off Dinner Menu",
      photoUrl: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1200&q=80",
      discountType: "PERCENTAGE",
      discountValue: 30,
    },
  },
  {
    id: "global_mock_ny_1",
    name: "Hudson Bite",
    area: "New York",
    cuisine: "American",
    description: "Modern diner favorites with skyline views and late-night service.",
    rating: 4.5,
    reviewCount: 4124,
    distance: "1.5 km away",
    offer: {
      id: "offer_mock_ny_1",
      offerText: "$12 Off for 2 Guests",
      photoUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200&q=80",
      discountType: "FLAT",
      discountValue: 12,
    },
  },
  {
    id: "global_mock_cxb_1",
    name: "Sea Pearl Bistro",
    area: "Cox's Bazar",
    cuisine: "Seafood",
    description: "Beachfront seafood specialties with sunset dining setup.",
    rating: 4.6,
    reviewCount: 1966,
    distance: "0.4 km away",
    offer: {
      id: "offer_mock_cxb_1",
      offerText: "Happy Hour: 20% Off Drinks",
      photoUrl: "https://images.unsplash.com/photo-1559847844-5315695dadae?w=1200&q=80",
      discountType: "PERCENTAGE",
      discountValue: 20,
    },
  },
  {
    id: "global_mock_cxb_2",
    name: "Coral Curry House",
    area: "Cox's Bazar",
    cuisine: "Bangladeshi",
    description: "Authentic local flavors, grilled fish, and signature curries.",
    rating: 4.3,
    reviewCount: 1299,
    distance: "0.7 km away",
    offer: {
      id: "offer_mock_cxb_2",
      offerText: "Free Dessert with Any Combo",
      photoUrl: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=1200&q=80",
      discountType: "PERCENTAGE",
      discountValue: 15,
    },
  },
];

function isOffPeakHours(): boolean {
  const now = new Date();
  const bdHour = (now.getUTCHours() + 6) % 24;
  return bdHour >= 15 && bdHour < 18;
}

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function formatDistance(distanceMeters?: number): string {
  if (!distanceMeters || distanceMeters <= 0) return "Distance not available";
  if (distanceMeters < 1000) return `${distanceMeters} m away`;
  return `${(distanceMeters / 1000).toFixed(1)} km away`;
}

function inferCuisine(categories: Array<{ name?: string }> | undefined): string | null {
  if (!categories || categories.length === 0) return null;
  return categories[0]?.name || null;
}

function chooseOffer(seed: string) {
  const index = hashString(seed) % OFFER_POOL.length;
  return OFFER_POOL[index];
}

function choosePhotoUrl(cuisine: string | null, fallbackSeed: string): string {
  const lower = (cuisine || fallbackSeed).toLowerCase();
  const mapped = Object.entries(CUISINE_IMAGE_MAP).find(([key]) => lower.includes(key));
  return mapped?.[1] || CUISINE_IMAGE_MAP.default;
}

function toRestaurantPayload(place: FoursquarePlace, cityLabel: string): RestaurantPayload {
  const cuisine = inferCuisine(place.categories);
  const offerPreset = chooseOffer(place.fsq_id || place.name || cityLabel);
  const ratingSeed = hashString(place.fsq_id || place.name || cityLabel);
  const rating = 3.9 + (ratingSeed % 12) / 10; // 3.9 - 5.0
  const reviewCount = 180 + (ratingSeed % 6000);

  const area = place.location?.locality || cityLabel;
  const address = place.location?.formatted_address || `${area}, ${place.location?.country || "Global"}`;

  return {
    id: `global_fsq_${place.fsq_id}`,
    name: place.name || "Unnamed Restaurant",
    area,
    cuisine,
    description: `${cuisine || "Restaurant"} in ${area}. ${address}`,
    rating: Number(rating.toFixed(1)),
    reviewCount,
    distance: formatDistance(place.distance),
    offer: {
      id: `offer_${place.fsq_id}`,
      offerText: offerPreset.offerText,
      photoUrl: choosePhotoUrl(cuisine, place.name || area),
      discountType: offerPreset.discountType,
      discountValue: offerPreset.discountValue,
    },
  };
}

function isAuthError(status: number, bodyText: string): boolean {
  const text = bodyText.toLowerCase();
  return (
    status === 401 ||
    status === 403 ||
    text.includes("invalid request token") ||
    text.includes("not authorized") ||
    text.includes("unauthorized")
  );
}

async function fetchFoursquareRestaurants(query: string): Promise<RestaurantPayload[]> {
  if (!FOURSQUARE_API_KEY) {
    throw new Error("FOURSQUARE_KEY_MISSING");
  }

  const perCityLimit = 5;
  const allResults: RestaurantPayload[] = [];

  for (const city of CITY_SEARCH_TARGETS) {
    const url = new URL(FOURSQUARE_API_BASE);
    url.searchParams.set("query", query || "restaurant");
    url.searchParams.set("limit", String(perCityLimit));
    url.searchParams.set("near", city);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${FOURSQUARE_API_KEY}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const bodyText = await response.text();
    if (!response.ok) {
      if (isAuthError(response.status, bodyText)) {
        throw new Error("FOURSQUARE_AUTH_ERROR");
      }
      throw new Error(`FOURSQUARE_ERROR_${response.status}`);
    }

    const data = JSON.parse(bodyText) as FoursquareResponse;
    const places = Array.isArray(data.results) ? data.results : [];
    allResults.push(...places.map((place) => toRestaurantPayload(place, city)));
  }

  const unique = new Map<string, RestaurantPayload>();
  for (const restaurant of allResults) {
    if (!unique.has(restaurant.id)) {
      unique.set(restaurant.id, restaurant);
    }
  }

  return [...unique.values()]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 24);
}

/**
 * Future replacement guidance:
 * - Keep this return shape stable so `src/app/restaurants/page.tsx` remains unchanged.
 * - Swap `fetchFoursquareRestaurants` with a provider adapter (e.g. Priceline/Tripadvisor).
 * - Adapter should output `RestaurantPayload[]` with `offer` and visual metadata.
 */
async function getGlobalRestaurants(query: string): Promise<{
  restaurants: RestaurantPayload[];
  source: "foursquare" | "mock";
}> {
  try {
    const restaurants = await fetchFoursquareRestaurants(query);
    if (restaurants.length > 0) {
      return { restaurants, source: "foursquare" };
    }
    return { restaurants: MOCK_GLOBAL_RESTAURANTS, source: "mock" };
  } catch (error) {
    console.warn("[restaurants-page] Foursquare unavailable, serving mock fallback", error);
    return { restaurants: MOCK_GLOBAL_RESTAURANTS, source: "mock" };
  }
}

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get("query")?.trim() || "restaurant";
    const { restaurants, source } = await getGlobalRestaurants(query);

    const groupedByArea: Record<string, RestaurantPayload[]> = {};
    for (const restaurant of restaurants) {
      if (!groupedByArea[restaurant.area]) {
        groupedByArea[restaurant.area] = [];
      }
      groupedByArea[restaurant.area].push(restaurant);
    }

    const recommendations = restaurants.slice(0, 12).map((restaurant, index) => ({
      id: restaurant.id,
      name: restaurant.name,
      area: restaurant.area,
      cuisine: restaurant.cuisine,
      offer: restaurant.offer
        ? {
            offerText: restaurant.offer.offerText,
            isActive: true,
            photoUrl: restaurant.offer.photoUrl,
          }
        : null,
      score: Math.max(100 - index * 4, 50),
      isFavorite: false,
      recentlyVisited: false,
      rating: restaurant.rating,
      distance: restaurant.distance,
    }));

    const uniqueAreas = [...new Set(restaurants.map((r) => r.area))];
    const areas = uniqueAreas.map((area, index) => ({
      id: `global_area_${index + 1}`,
      nameEn: area,
      nameBn: area,
    }));

    return NextResponse.json({
      restaurants: {
        restaurants,
        groupedByArea,
        isOffPeakHours: isOffPeakHours(),
      },
      favorites: {
        favorites: [],
      },
      visitHistory: {
        recentlyVisited: [],
      },
      recommendations: {
        recommendations,
        preferences: {
          topCuisines: [...new Set(restaurants.map((r) => r.cuisine).filter(Boolean))].slice(0, 3),
          topAreas: uniqueAreas.slice(0, 3),
          totalFavorites: 0,
          totalVisits: 0,
        },
      },
      areas: {
        areas,
      },
      meta: {
        source,
        query,
      },
    });
  } catch (error) {
    console.error("[restaurants-page] error", error);
    return NextResponse.json(
      { error: "Failed to fetch restaurants page data" },
      { status: 500 }
    );
  }
}
