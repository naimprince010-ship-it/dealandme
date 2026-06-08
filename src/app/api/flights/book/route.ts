import { NextRequest, NextResponse } from "next/server";

const DUFFEL_ORDER_API_URL = "https://api.duffel.com/air/orders";
const DUFFEL_VERSION = "v2";
const DUFFEL_API_KEY = process.env.DUFFEL_API_KEY || "";

type PassengerInput = {
  given_name?: string;
  family_name?: string;
  title?: string;
  gender?: string;
  born_on?: string;
  email?: string;
  phone_number?: string;
};

type BookingRequestBody = {
  selected_offers?: string[];
  passenger?: PassengerInput;
  payment?: {
    amount?: string;
    currency?: string;
  };
};

type DuffelOrderPassenger = {
  given_name?: string;
  family_name?: string;
};

type DuffelBookingReference = {
  reference?: string;
};

type DuffelOrderData = {
  id?: string;
  booking_reference?: string;
  booking_references?: DuffelBookingReference[];
  status?: string;
  payment_status?: string;
  passengers?: DuffelOrderPassenger[];
};

type DuffelOrderResponse = {
  data?: DuffelOrderData;
  errors?: Array<{ message?: string }>;
};

function isValidDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
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

    const body = (await request.json()) as BookingRequestBody;
    const selectedOffers = Array.isArray(body.selected_offers)
      ? body.selected_offers.filter((offerId) => typeof offerId === "string" && offerId.trim().length > 0)
      : [];

    const passenger = body.passenger || {};
    const givenName = passenger.given_name?.trim() || "";
    const familyName = passenger.family_name?.trim() || "";
    const title = passenger.title?.trim() || "";
    const gender = passenger.gender?.trim() || "";
    const bornOn = passenger.born_on?.trim() || "";
    const email = passenger.email?.trim() || "";
    const phoneNumber = passenger.phone_number?.trim() || "";

    if (selectedOffers.length === 0) {
      return NextResponse.json(
        { error: "At least one selected offer is required" },
        { status: 400 }
      );
    }

    if (!givenName || !familyName || !title || !gender || !bornOn || !email || !phoneNumber) {
      return NextResponse.json(
        {
          error:
            "Passenger details are required: given name, family name, title, gender, born_on, email, and phone_number",
        },
        { status: 400 }
      );
    }

    if (!isValidDate(bornOn)) {
      return NextResponse.json(
        { error: "born_on must use the YYYY-MM-DD format" },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "A valid passenger email is required" },
        { status: 400 }
      );
    }

    const duffelPayload: {
      data: {
        type: "instant";
        selected_offers: string[];
        passengers: Array<{
          type: "adult";
          given_name: string;
          family_name: string;
          title: string;
          gender: string;
          born_on: string;
          email: string;
          phone_number: string;
        }>;
        payments?: Array<{
          type: "balance";
          amount: string;
          currency: string;
        }>;
      };
    } = {
      data: {
        type: "instant",
        selected_offers: selectedOffers,
        passengers: [
          {
            type: "adult",
            given_name: givenName,
            family_name: familyName,
            title,
            gender,
            born_on: bornOn,
            email,
            phone_number: phoneNumber,
          },
        ],
      },
    };

    const paymentAmount = body.payment?.amount?.trim();
    const paymentCurrency = body.payment?.currency?.trim();

    if (paymentAmount && paymentCurrency) {
      duffelPayload.data.payments = [
        {
          type: "balance",
          amount: paymentAmount,
          currency: paymentCurrency,
        },
      ];
    }

    const duffelResponse = await fetch(DUFFEL_ORDER_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${DUFFEL_API_KEY}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        "Duffel-Version": DUFFEL_VERSION,
      },
      body: JSON.stringify(duffelPayload),
      cache: "no-store",
    });

    const duffelData = (await duffelResponse.json()) as DuffelOrderResponse;

    if (!duffelResponse.ok) {
      const errorMessage =
        duffelData?.errors?.[0]?.message || "Duffel booking request failed";

      console.error("Duffel booking error:", duffelData);
      return NextResponse.json(
        {
          error: errorMessage,
          details: duffelData?.errors || null,
        },
        { status: duffelResponse.status }
      );
    }

    const order = duffelData.data || {};

    const bookingReference =
      order.booking_reference ||
      order.booking_references?.[0]?.reference ||
      order.id ||
      null;

    const passengerNames = (order.passengers || [])
      .map((p) => `${p.given_name || ""} ${p.family_name || ""}`.trim())
      .filter((name) => Boolean(name));

    return NextResponse.json({
      orderId: order.id || null,
      bookingReference,
      status: order.status || order.payment_status || "created",
      passengers: passengerNames,
    });
  } catch (error) {
    console.error("Flight booking error:", error);
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }
}