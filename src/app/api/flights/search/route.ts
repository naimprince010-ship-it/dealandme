import { NextRequest, NextResponse } from "next/server";

const DUFFEL_API_URL = "https://api.duffel.com/air/offer_requests";
const DUFFEL_VERSION = "v2";
const DUFFEL_API_KEY = process.env.DUFFEL_API_KEY || "";

type FlightSearchBody = {
  origin?: string;
  destination?: string;
  departureDate?: string;
  passengers?: number;
};

function isValidIataCode(value: string) {
  return /^[A-Z]{3}$/.test(value);
}

function isValidDepartureDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function buildPassengerList(passengerCount: number) {
  return Array.from({ length: passengerCount }, (_, index) => ({
    type: "adult",
    id: `passenger_${index + 1}`,
  }));
}

export async function POST(request: NextRequest) {
  try {
    if (!DUFFEL_API_KEY) {
      console.error("DUFFEL_API_KEY not configured");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const body = (await request.json()) as FlightSearchBody;

    const origin = body.origin?.trim().toUpperCase() || "";
    const destination = body.destination?.trim().toUpperCase() || "";
    const departureDate = body.departureDate?.trim() || "";
    const passengers = Number(body.passengers || 1);

    if (!origin || !destination || !departureDate) {
      return NextResponse.json(
        {
          error: "Origin, destination, and departure date are required",
        },
        { status: 400 }
      );
    }

    if (!isValidIataCode(origin) || !isValidIataCode(destination)) {
      return NextResponse.json(
        { error: "Origin and destination must be valid IATA airport codes" },
        { status: 400 }
      );
    }

    if (!isValidDepartureDate(departureDate)) {
      return NextResponse.json(
        { error: "Departure date must use the YYYY-MM-DD format" },
        { status: 400 }
      );
    }

    if (!Number.isInteger(passengers) || passengers < 1 || passengers > 9) {
      return NextResponse.json(
        { error: "Passengers must be a whole number between 1 and 9" },
        { status: 400 }
      );
    }

    const duffelResponse = await fetch(DUFFEL_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${DUFFEL_API_KEY}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        "Duffel-Version": DUFFEL_VERSION,
      },
      body: JSON.stringify({
        data: {
          slices: [
            {
              origin,
              destination,
              departure_date: departureDate,
            },
          ],
          passengers: buildPassengerList(passengers),
          cabin_class: "economy",
        },
      }),
      cache: "no-store",
    });

    const duffelData = await duffelResponse.json();

    if (!duffelResponse.ok) {
      const errorMessage =
        duffelData?.errors?.[0]?.message || "Duffel flight search failed";

      console.error("Duffel API error:", duffelData);
      return NextResponse.json(
        {
          error: errorMessage,
          details: duffelData?.errors || null,
        },
        { status: duffelResponse.status }
      );
    }

    const offers = Array.isArray(duffelData?.data?.offers)
      ? duffelData.data.offers
      : [];

    const flights = offers.map((offer: any) => {
      const firstSlice = offer.slices?.[0];
      const firstSegment = firstSlice?.segments?.[0];
      const lastSegment = firstSlice?.segments?.[firstSlice.segments.length - 1];
      const owner = offer.owner || {};

      return {
        id: offer.id,
        totalAmount: offer.total_amount,
        totalCurrency: offer.total_currency,
        expiresAt: offer.expires_at,
        airline: {
          name: owner.name || firstSegment?.marketing_carrier?.name || "Unknown airline",
          code: owner.iata_code || firstSegment?.marketing_carrier?.iata_code || null,
          logo: owner.logo_symbol_url || null,
        },
        origin: {
          iataCode: firstSegment?.origin?.iata_code || origin,
          cityName: firstSegment?.origin?.city_name || null,
          name: firstSegment?.origin?.name || null,
          departingAt: firstSegment?.departing_at || null,
        },
        destination: {
          iataCode: lastSegment?.destination?.iata_code || destination,
          cityName: lastSegment?.destination?.city_name || null,
          name: lastSegment?.destination?.name || null,
          arrivingAt: lastSegment?.arriving_at || null,
        },
        duration: firstSlice?.duration || null,
        stops: Math.max((firstSlice?.segments?.length || 1) - 1, 0),
        passengers,
      };
    });

    return NextResponse.json({
      flights,
      meta: {
        origin,
        destination,
        departureDate,
        passengers,
        count: flights.length,
      },
      raw: {
        id: duffelData?.data?.id || null,
        createdAt: duffelData?.data?.created_at || null,
      },
    });
  } catch (error) {
    console.error("Flight search error:", error);
    return NextResponse.json(
      { error: "Failed to search flights" },
      { status: 500 }
    );
  }
}