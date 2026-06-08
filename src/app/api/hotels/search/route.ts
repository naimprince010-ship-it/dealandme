import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// MOCK DATA — Rich, realistic hotel dataset for immediate testability.
//
// HOW TO REPLACE WITH A REAL API:
// 1. Priceline Partner Network (PPN):
//    - Sign up at https://developer.priceline.com
//    - Replace the `MOCK_HOTELS` logic below with a fetch() to:
//      GET https://api.priceline.com/express/v3/hotel/search
//      Query params: city, check_in, check_out, adults, format=json
//    - Set PRICELINE_API_KEY in your .env file and pass it as the
//      `Api-Key` header on every request.
//
// 2. TripAdvisor Content API:
//    - Sign up at https://tripadvisor.com/developers
//    - Call GET https://api.content.tripadvisor.com/api/v1/location/search
//      with `searchQuery`, `category=hotels`, and your API key.
//    - Then fetch detailed prices from the Location Details endpoint.
//
// 3. Amadeus Hotel Search:
//    - Sign up at https://developers.amadeus.com
//    - POST /v3/shopping/hotel-offers with cityCode, checkInDate, checkOutDate.
//    - Normalize the response to the Hotel type below.
//
// In all cases, map the external response to the `Hotel` shape exported from
// this file so the frontend never needs to change.
// ---------------------------------------------------------------------------

export type Hotel = {
  id: string;
  name: string;
  city: string;
  country: string;
  address: string;
  imageUrl: string;
  stars: number;
  reviewScore: number;       // e.g. 8.5
  reviewLabel: string;       // e.g. "Very Good"
  reviewCount: number;
  discountedPrice: number;   // per night in USD
  originalPrice: number;
  currency: string;
  amenities: string[];
  distanceToCenter: string;  // e.g. "0.8 km from centre"
};

// ---------------------------------------------------------------------------
// Derive a human-readable review label from a numeric score (0–10).
// ---------------------------------------------------------------------------
function reviewLabel(score: number): string {
  if (score >= 9.5) return "Exceptional";
  if (score >= 9.0) return "Superb";
  if (score >= 8.5) return "Excellent";
  if (score >= 8.0) return "Very Good";
  if (score >= 7.0) return "Good";
  if (score >= 6.0) return "Pleasant";
  return "Okay";
}

// ---------------------------------------------------------------------------
// Mock hotel dataset — 4 popular cities, 4 hotels each.
// Images use Unsplash Source URLs (no API key needed, CC-licensed photos).
// ---------------------------------------------------------------------------
const MOCK_HOTELS: Hotel[] = [
  // ── LONDON ──────────────────────────────────────────────────────────────
  {
    id: "lon-001",
    name: "The Savoy",
    city: "London",
    country: "UK",
    address: "Strand, London WC2R 0EU",
    imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
    stars: 5,
    reviewScore: 9.4,
    reviewLabel: reviewLabel(9.4),
    reviewCount: 4812,
    discountedPrice: 420,
    originalPrice: 590,
    currency: "USD",
    amenities: ["Free Wi-Fi", "Spa", "River View", "Michelin Restaurant"],
    distanceToCenter: "0.2 km from centre",
  },
  {
    id: "lon-002",
    name: "Premier Inn London City",
    city: "London",
    country: "UK",
    address: "60 Minories, London EC3N 1JY",
    imageUrl: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80",
    stars: 3,
    reviewScore: 8.1,
    reviewLabel: reviewLabel(8.1),
    reviewCount: 9215,
    discountedPrice: 98,
    originalPrice: 145,
    currency: "USD",
    amenities: ["Free Wi-Fi", "Bar", "24h Front Desk"],
    distanceToCenter: "1.1 km from centre",
  },
  {
    id: "lon-003",
    name: "Shangri-La The Shard",
    city: "London",
    country: "UK",
    address: "31 St Thomas St, London SE1 9QU",
    imageUrl: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80",
    stars: 5,
    reviewScore: 9.2,
    reviewLabel: reviewLabel(9.2),
    reviewCount: 3106,
    discountedPrice: 510,
    originalPrice: 680,
    currency: "USD",
    amenities: ["Free Wi-Fi", "Indoor Pool", "Sky Bar", "City View"],
    distanceToCenter: "0.5 km from centre",
  },
  {
    id: "lon-004",
    name: "Hub by Premier Inn Covent Garden",
    city: "London",
    country: "UK",
    address: "20 Monmouth St, London WC2H 9DF",
    imageUrl: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&q=80",
    stars: 2,
    reviewScore: 7.9,
    reviewLabel: reviewLabel(7.9),
    reviewCount: 5433,
    discountedPrice: 72,
    originalPrice: 110,
    currency: "USD",
    amenities: ["Free Wi-Fi", "Smart TV"],
    distanceToCenter: "0.4 km from centre",
  },

  // ── PARIS ────────────────────────────────────────────────────────────────
  {
    id: "par-001",
    name: "Hôtel Ritz Paris",
    city: "Paris",
    country: "France",
    address: "15 Place Vendôme, 75001 Paris",
    imageUrl: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80",
    stars: 5,
    reviewScore: 9.7,
    reviewLabel: reviewLabel(9.7),
    reviewCount: 2841,
    discountedPrice: 1080,
    originalPrice: 1400,
    currency: "USD",
    amenities: ["Free Wi-Fi", "Pool", "Spa", "2 Michelin Stars"],
    distanceToCenter: "0.1 km from centre",
  },
  {
    id: "par-002",
    name: "ibis Paris Gare du Nord",
    city: "Paris",
    country: "France",
    address: "3 Rue du 8 Mai 1945, 75010 Paris",
    imageUrl: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80",
    stars: 3,
    reviewScore: 7.6,
    reviewLabel: reviewLabel(7.6),
    reviewCount: 11380,
    discountedPrice: 89,
    originalPrice: 130,
    currency: "USD",
    amenities: ["Free Wi-Fi", "Bar", "Air Conditioning"],
    distanceToCenter: "1.4 km from centre",
  },
  {
    id: "par-003",
    name: "Le Marais Boutique Hotel",
    city: "Paris",
    country: "France",
    address: "22 Rue de Bretagne, 75003 Paris",
    imageUrl: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80",
    stars: 4,
    reviewScore: 8.8,
    reviewLabel: reviewLabel(8.8),
    reviewCount: 4215,
    discountedPrice: 215,
    originalPrice: 295,
    currency: "USD",
    amenities: ["Free Wi-Fi", "Breakfast Included", "Courtyard Garden"],
    distanceToCenter: "0.7 km from centre",
  },
  {
    id: "par-004",
    name: "Pullman Paris Tour Eiffel",
    city: "Paris",
    country: "France",
    address: "22 Av. de Suffren, 75015 Paris",
    imageUrl: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&q=80",
    stars: 4,
    reviewScore: 8.5,
    reviewLabel: reviewLabel(8.5),
    reviewCount: 6752,
    discountedPrice: 310,
    originalPrice: 420,
    currency: "USD",
    amenities: ["Free Wi-Fi", "Rooftop Pool", "Eiffel View", "Gym"],
    distanceToCenter: "0.9 km from centre",
  },

  // ── COX'S BAZAR ─────────────────────────────────────────────────────────
  {
    id: "cxb-001",
    name: "Long Beach Hotel Cox's Bazar",
    city: "Cox's Bazar",
    country: "Bangladesh",
    address: "Hotel Zone, Cox's Bazar 4700",
    imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80",
    stars: 5,
    reviewScore: 8.9,
    reviewLabel: reviewLabel(8.9),
    reviewCount: 3102,
    discountedPrice: 85,
    originalPrice: 130,
    currency: "USD",
    amenities: ["Free Wi-Fi", "Pool", "Sea View", "Beachfront"],
    distanceToCenter: "0.2 km from beach",
  },
  {
    id: "cxb-002",
    name: "Ocean Paradise Hotel & Resort",
    city: "Cox's Bazar",
    country: "Bangladesh",
    address: "Sugandha Beach Road, Cox's Bazar",
    imageUrl: "https://images.unsplash.com/photo-1439130490301-25e322d88054?w=800&q=80",
    stars: 4,
    reviewScore: 8.4,
    reviewLabel: reviewLabel(8.4),
    reviewCount: 2188,
    discountedPrice: 62,
    originalPrice: 95,
    currency: "USD",
    amenities: ["Free Wi-Fi", "Sea View", "Restaurant", "Parking"],
    distanceToCenter: "0.5 km from beach",
  },
  {
    id: "cxb-003",
    name: "Seagull Hotel",
    city: "Cox's Bazar",
    country: "Bangladesh",
    address: "Kolatoli Road, Cox's Bazar 4700",
    imageUrl: "https://images.unsplash.com/photo-1570213489059-0aac6626cade?w=800&q=80",
    stars: 4,
    reviewScore: 8.0,
    reviewLabel: reviewLabel(8.0),
    reviewCount: 1845,
    discountedPrice: 55,
    originalPrice: 80,
    currency: "USD",
    amenities: ["Free Wi-Fi", "Pool", "Beachfront", "Spa"],
    distanceToCenter: "0.3 km from beach",
  },
  {
    id: "cxb-004",
    name: "Cox Today Hotel",
    city: "Cox's Bazar",
    country: "Bangladesh",
    address: "Sugandha Point, Cox's Bazar",
    imageUrl: "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800&q=80",
    stars: 3,
    reviewScore: 7.5,
    reviewLabel: reviewLabel(7.5),
    reviewCount: 1027,
    discountedPrice: 38,
    originalPrice: 55,
    currency: "USD",
    amenities: ["Free Wi-Fi", "Air Conditioning", "24h Front Desk"],
    distanceToCenter: "0.8 km from beach",
  },

  // ── NEW YORK ─────────────────────────────────────────────────────────────
  {
    id: "nyc-001",
    name: "The Plaza Hotel",
    city: "New York",
    country: "USA",
    address: "768 5th Ave, New York, NY 10019",
    imageUrl: "https://images.unsplash.com/photo-1496417263034-38ec4f0b665a?w=800&q=80",
    stars: 5,
    reviewScore: 9.3,
    reviewLabel: reviewLabel(9.3),
    reviewCount: 5672,
    discountedPrice: 695,
    originalPrice: 890,
    currency: "USD",
    amenities: ["Free Wi-Fi", "Spa", "Central Park View", "Fine Dining"],
    distanceToCenter: "0.1 km from centre",
  },
  {
    id: "nyc-002",
    name: "Pod 51 Hotel",
    city: "New York",
    country: "USA",
    address: "230 E 51st St, New York, NY 10022",
    imageUrl: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&q=80",
    stars: 3,
    reviewScore: 8.2,
    reviewLabel: reviewLabel(8.2),
    reviewCount: 8843,
    discountedPrice: 129,
    originalPrice: 185,
    currency: "USD",
    amenities: ["Free Wi-Fi", "Rooftop Bar", "Smart TV"],
    distanceToCenter: "0.6 km from centre",
  },
  {
    id: "nyc-003",
    name: "1 Hotel Central Park",
    city: "New York",
    country: "USA",
    address: "1414 6th Ave, New York, NY 10019",
    imageUrl: "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&q=80",
    stars: 5,
    reviewScore: 9.0,
    reviewLabel: reviewLabel(9.0),
    reviewCount: 3214,
    discountedPrice: 520,
    originalPrice: 710,
    currency: "USD",
    amenities: ["Free Wi-Fi", "Pool", "Central Park View", "Organic Restaurant"],
    distanceToCenter: "0.3 km from centre",
  },
  {
    id: "nyc-004",
    name: "citizenM New York Times Square",
    city: "New York",
    country: "USA",
    address: "218 W 50th St, New York, NY 10019",
    imageUrl: "https://images.unsplash.com/photo-1455587734955-081b22074882?w=800&q=80",
    stars: 4,
    reviewScore: 8.6,
    reviewLabel: reviewLabel(8.6),
    reviewCount: 7190,
    discountedPrice: 245,
    originalPrice: 335,
    currency: "USD",
    amenities: ["Free Wi-Fi", "Rooftop Bar", "Times Square View"],
    distanceToCenter: "0.2 km from centre",
  },
];

// ---------------------------------------------------------------------------
// GET handler — accepts ?city=London (case-insensitive, partial match)
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city")?.trim().toLowerCase() || "";

  const results = city
    ? MOCK_HOTELS.filter((h) => h.city.toLowerCase().includes(city))
    : MOCK_HOTELS;

  return NextResponse.json({ hotels: results, count: results.length });
}

// ---------------------------------------------------------------------------
// POST handler — accepts { city, checkIn, checkOut, guests }
// ---------------------------------------------------------------------------
type HotelSearchBody = {
  city?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as HotelSearchBody;
    const cityQuery = body.city?.trim().toLowerCase() || "";

    if (!cityQuery) {
      return NextResponse.json(
        { error: "City is required" },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------------------------
    // REPLACE THIS BLOCK with a real API call, e.g.:
    //
    // const apiRes = await fetch(
    //   `https://api.priceline.com/express/v3/hotel/search?` +
    //   `city=${encodeURIComponent(body.city)}&` +
    //   `check_in=${body.checkIn}&check_out=${body.checkOut}&adults=${body.guests}`,
    //   {
    //     headers: {
    //       "Api-Key": process.env.PRICELINE_API_KEY || "",
    //       Accept: "application/json",
    //     },
    //   }
    // );
    // const data = await apiRes.json();
    // const hotels = normalizePricelineResponse(data); // map to Hotel type
    // ---------------------------------------------------------------------------

    const hotels = MOCK_HOTELS.filter((h) =>
      h.city.toLowerCase().includes(cityQuery)
    );

    return NextResponse.json({
      hotels,
      count: hotels.length,
      meta: {
        city: body.city,
        checkIn: body.checkIn || null,
        checkOut: body.checkOut || null,
        guests: body.guests || 1,
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to search hotels" }, { status: 500 });
  }
}
