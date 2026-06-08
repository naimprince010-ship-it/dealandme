"use client";

import { useMemo, useState } from "react";
import BottomNav from "@/components/BottomNav";
import LoginBackgroundPattern from "@/components/LoginBackgroundPattern";
import { useLanguage } from "@/lib/LanguageContext";

type FlightResult = {
  id: string;
  totalAmount: string;
  totalCurrency: string;
  expiresAt: string | null;
  airline: {
    name: string;
    code: string | null;
    logo: string | null;
  };
  origin: {
    iataCode: string;
    cityName: string | null;
    name: string | null;
    departingAt: string | null;
  };
  destination: {
    iataCode: string;
    cityName: string | null;
    name: string | null;
    arrivingAt: string | null;
  };
  duration: string | null;
  stops: number;
  passengers: number;
};

type FlightSearchResponse = {
  flights?: FlightResult[];
  error?: string;
};

type BookFlightResponse = {
  orderId?: string | null;
  bookingReference?: string | null;
  status?: string;
  passengers?: string[];
  error?: string;
};

type BookingConfirmation = {
  bookingReference: string;
  status: string;
  passengers: string[];
  flight: FlightResult;
};

type PassengerForm = {
  givenName: string;
  familyName: string;
  title: string;
  gender: string;
  bornOn: string;
  email: string;
  phoneNumber: string;
};

const DEFAULT_PASSENGER_FORM: PassengerForm = {
  givenName: "",
  familyName: "",
  title: "mr",
  gender: "m",
  bornOn: "",
  email: "",
  phoneNumber: "",
};

function formatDuration(duration: string | null, language: string) {
  if (!duration) return language === "bn" ? "সময় অজানা" : "Duration unavailable";

  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return duration;

  const hours = Number(match[1] || 0);
  const minutes = Number(match[2] || 0);

  if (language === "bn") {
    if (hours && minutes) return `${hours} ঘ ${minutes} মি`;
    if (hours) return `${hours} ঘ`;
    return `${minutes} মি`;
  }

  if (hours && minutes) return `${hours}h ${minutes}m`;
  if (hours) return `${hours}h`;
  return `${minutes}m`;
}

function formatDateTime(value: string | null, language: string) {
  if (!value) return "--";

  return new Intl.DateTimeFormat(language === "bn" ? "bn-BD" : "en-US", {
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function formatMoney(amount: string, currency: string) {
  const numericAmount = Number(amount);
  if (Number.isNaN(numericAmount)) return `${currency} ${amount}`;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(numericAmount);
}

function todayIsoDate() {
  return new Date().toISOString().split("T")[0];
}

export default function FlightsPage() {
  const { language } = useLanguage();
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [selectedFlightId, setSelectedFlightId] = useState<string | null>(null);
  const [flights, setFlights] = useState<FlightResult[]>([]);
  const [form, setForm] = useState({
    origin: "DAC",
    destination: "CXB",
    departureDate: todayIsoDate(),
  });

  const [bookingFlight, setBookingFlight] = useState<FlightResult | null>(null);
  const [bookingError, setBookingError] = useState("");
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [passengerForm, setPassengerForm] = useState<PassengerForm>({
    ...DEFAULT_PASSENGER_FORM,
  });
  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(null);

  const copy = useMemo(
    () => ({
      title: language === "bn" ? "ফ্লাইট খুঁজুন" : "Flight Search",
      subtitle:
        language === "bn"
          ? "দ্রুত ভাড়া দেখুন, সময় মিলিয়ে নিন, তারপর সেরা ফ্লাইটটি বুক করুন।"
          : "Search routes, compare timings, and book your best option instantly.",
      origin: language === "bn" ? "যাত্রা শুরু" : "Origin Airport",
      destination: language === "bn" ? "গন্তব্য" : "Destination Airport",
      departureDate: language === "bn" ? "যাত্রার তারিখ" : "Departure Date",
      search: language === "bn" ? "ফ্লাইট খুঁজুন" : "Search Flights",
      searching: language === "bn" ? "খোঁজা হচ্ছে..." : "Searching...",
      helper:
        language === "bn"
          ? "৩ অক্ষরের IATA কোড ব্যবহার করুন, যেমন DAC বা CXB"
          : "Use 3-letter IATA airport codes like DAC or CXB",
      noResults:
        language === "bn"
          ? "এই সার্চে কোনো ফ্লাইট পাওয়া যায়নি।"
          : "No flights matched this search.",
      errorTitle: language === "bn" ? "ফ্লাইট ডেটা আনা যায়নি" : "Could not load flights",
      emptyTitle:
        language === "bn" ? "আপনার পরের যাত্রা কোথায়?" : "Where are you flying next?",
      emptyText:
        language === "bn"
          ? "উপরের ফর্মে রুট ও তারিখ দিয়ে সার্চ শুরু করুন।"
          : "Enter your route and departure date above to start searching.",
      airline: language === "bn" ? "এয়ারলাইন" : "Airline",
      price: language === "bn" ? "মূল্য" : "Price",
      direct: language === "bn" ? "সরাসরি" : "Direct",
      stop: language === "bn" ? "স্টপ" : "stop",
      stops: language === "bn" ? "স্টপ" : "stops",
      bestValue: language === "bn" ? "সেরা অপশন" : "Top pick",
      expires: language === "bn" ? "মূল্য বৈধ" : "Offer valid until",
      results:
        language === "bn" ? `${flights.length}টি ফ্লাইট পাওয়া গেছে` : `${flights.length} flights found`,
      bookNow: language === "bn" ? "এখনই বুক করুন" : "Book Now",
      bookingNow: language === "bn" ? "বুকিং হচ্ছে..." : "Booking...",
      passengerTitle: language === "bn" ? "যাত্রী তথ্য" : "Passenger Details",
      passengerSubtitle:
        language === "bn"
          ? "বুকিং সম্পন্ন করতে যাত্রীর তথ্য দিন"
          : "Enter passenger details to complete your booking",
      givenName: language === "bn" ? "নামের প্রথম অংশ" : "Given Name",
      familyName: language === "bn" ? "নামের শেষ অংশ" : "Family Name",
      titleLabel: language === "bn" ? "সম্বোধন" : "Title",
      genderLabel: language === "bn" ? "লিঙ্গ" : "Gender",
      dobLabel: language === "bn" ? "জন্ম তারিখ" : "Date of Birth",
      emailLabel: language === "bn" ? "ইমেইল" : "Email",
      phoneLabel: language === "bn" ? "ফোন নম্বর" : "Phone Number",
      cancel: language === "bn" ? "বাতিল" : "Cancel",
      confirmBooking: language === "bn" ? "বুকিং নিশ্চিত করুন" : "Confirm Booking",
      ticketTitle: language === "bn" ? "বুকিং সম্পন্ন" : "Booking Confirmed",
      ticketSubtitle:
        language === "bn"
          ? "আপনার ই-টিকেট তৈরি হয়েছে"
          : "Your e-ticket is ready",
      pnr: language === "bn" ? "বুকিং রেফারেন্স" : "Booking Reference",
      status: language === "bn" ? "স্ট্যাটাস" : "Status",
      passengersLabel: language === "bn" ? "যাত্রী" : "Passengers",
      newSearch: language === "bn" ? "নতুন সার্চ করুন" : "Search Another Flight",
    }),
    [flights.length, language]
  );

  const handleChange = (field: "origin" | "destination" | "departureDate", value: string) => {
    setForm((current) => ({
      ...current,
      [field]: field === "departureDate" ? value : value.toUpperCase(),
    }));
  };

  const handlePassengerFieldChange = (field: keyof PassengerForm, value: string) => {
    setPassengerForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSearch = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setHasSearched(true);
    setSearching(true);
    setSearchError("");
    setSelectedFlightId(null);
    setConfirmation(null);

    try {
      const response = await fetch("/api/flights/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          origin: form.origin,
          destination: form.destination,
          departureDate: form.departureDate,
          passengers: 1,
        }),
      });

      const data = (await response.json()) as FlightSearchResponse;

      if (!response.ok) {
        setFlights([]);
        setSearchError(data.error || (language === "bn" ? "ফ্লাইট খোঁজা যায়নি" : "Unable to search flights"));
        return;
      }

      setFlights(data.flights || []);
    } catch (searchErrorValue) {
      console.error("Flight search failed:", searchErrorValue);
      setFlights([]);
      setSearchError(language === "bn" ? "সার্ভারে সংযোগ করা যায়নি" : "Could not connect to the server");
    } finally {
      setSearching(false);
    }
  };

  const handleStartBooking = (flight: FlightResult) => {
    setSelectedFlightId(flight.id);
    setBookingFlight(flight);
    setBookingError("");
    setPassengerForm({ ...DEFAULT_PASSENGER_FORM });
  };

  const handleCloseBookingModal = () => {
    if (bookingSubmitting) return;
    setBookingFlight(null);
    setBookingError("");
  };

  const handleConfirmBooking = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!bookingFlight) {
      return;
    }

    setBookingSubmitting(true);
    setBookingError("");

    try {
      const response = await fetch("/api/flights/book", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          selected_offers: [bookingFlight.id],
          passenger: {
            given_name: passengerForm.givenName.trim(),
            family_name: passengerForm.familyName.trim(),
            title: passengerForm.title,
            gender: passengerForm.gender,
            born_on: passengerForm.bornOn,
            email: passengerForm.email.trim(),
            phone_number: passengerForm.phoneNumber.trim(),
          },
          payment: {
            amount: bookingFlight.totalAmount,
            currency: bookingFlight.totalCurrency,
          },
        }),
      });

      const data = (await response.json()) as BookFlightResponse;

      if (!response.ok) {
        setBookingError(data.error || (language === "bn" ? "বুকিং সম্পন্ন হয়নি" : "Booking failed"));
        return;
      }

      const passengerNames =
        data.passengers && data.passengers.length > 0
          ? data.passengers
          : [`${passengerForm.givenName} ${passengerForm.familyName}`.trim()];

      setConfirmation({
        bookingReference: data.bookingReference || data.orderId || "PENDING",
        status: data.status || "confirmed",
        passengers: passengerNames,
        flight: bookingFlight,
      });

      setBookingFlight(null);
      setBookingError("");
    } catch (bookingErrorValue) {
      console.error("Booking failed:", bookingErrorValue);
      setBookingError(language === "bn" ? "সার্ভারে সংযোগ করা যায়নি" : "Could not connect to booking service");
    } finally {
      setBookingSubmitting(false);
    }
  };

  const clearConfirmation = () => {
    setConfirmation(null);
    setSelectedFlightId(null);
  };

  const handlePrintTicket = () => {
    if (typeof window === "undefined") return;
    window.print();
  };

  return (
    <div
      className="min-h-screen pb-24 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #f9f5ec 0%, #e8f4f0 50%, #d4ebe5 100%)" }}
    >
      <LoginBackgroundPattern />

      <main className="relative z-10 max-w-5xl mx-auto px-4 pt-6 pb-8">
        <section className="bg-white/75 backdrop-blur-sm border border-white/60 shadow-sm rounded-[28px] p-5 md:p-7 overflow-hidden">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-sm font-semibold mb-3">
                <span>✈️</span>
                <span>{copy.bestValue}</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
                {copy.title}
              </h1>
              <p className="mt-2 text-sm md:text-base text-gray-600" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
                {copy.subtitle}
              </p>
            </div>
            <div className="rounded-3xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 text-white px-4 py-4 shadow-lg md:min-w-52">
              <p className="text-xs uppercase tracking-[0.24em] text-white/75">Sky Deals</p>
              <p className="text-2xl font-bold mt-1">{flights.length > 0 ? copy.results : "IATA"}</p>
              <p className="text-sm text-white/80 mt-2">{copy.helper}</p>
            </div>
          </div>

          <form onSubmit={handleSearch} className="mt-6 grid gap-4 md:grid-cols-[1fr_1fr_1fr_auto]">
            <label className="block">
              <span className="block text-sm font-medium text-gray-700 mb-2">{copy.origin}</span>
              <input
                value={form.origin}
                onChange={(event) => handleChange("origin", event.target.value.slice(0, 3))}
                placeholder="DAC"
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 uppercase"
                maxLength={3}
                required
              />
            </label>

            <label className="block">
              <span className="block text-sm font-medium text-gray-700 mb-2">{copy.destination}</span>
              <input
                value={form.destination}
                onChange={(event) => handleChange("destination", event.target.value.slice(0, 3))}
                placeholder="CXB"
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 uppercase"
                maxLength={3}
                required
              />
            </label>

            <label className="block">
              <span className="block text-sm font-medium text-gray-700 mb-2">{copy.departureDate}</span>
              <input
                type="date"
                value={form.departureDate}
                min={todayIsoDate()}
                onChange={(event) => handleChange("departureDate", event.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                required
              />
            </label>

            <button
              type="submit"
              disabled={searching}
              className="h-[52px] md:self-end rounded-2xl px-6 font-semibold text-white shadow-lg transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
              style={{ background: "linear-gradient(135deg, #5BA88B 0%, #4A9A7C 100%)" }}
            >
              {searching ? copy.searching : copy.search}
            </button>
          </form>

          {searchError ? (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 text-rose-700 px-4 py-3 text-sm" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
              {searchError}
            </div>
          ) : null}
        </section>

        {confirmation ? (
          <section id="flight-ticket-print" className="mt-6 rounded-[30px] border border-emerald-200 bg-white/90 shadow-xl overflow-hidden print:mt-0 print:rounded-none print:border-gray-300 print:shadow-none">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-6 text-white">
              <p className="text-xs uppercase tracking-[0.24em] text-white/80">E-Ticket</p>
              <h2 className="text-2xl font-bold mt-2" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
                {copy.ticketTitle}
              </h2>
              <p className="text-sm text-white/85 mt-1" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
                {copy.ticketSubtitle}
              </p>
            </div>

            <div className="px-6 py-6 grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
                <p className="text-xs text-gray-500 uppercase tracking-[0.2em]">{copy.pnr}</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{confirmation.bookingReference}</p>
                <p className="text-xs text-gray-500 mt-4 uppercase tracking-[0.2em]">{copy.status}</p>
                <p className="text-sm font-semibold text-emerald-700 mt-2">{confirmation.status}</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs text-gray-500 uppercase tracking-[0.2em]">{copy.airline}</p>
                <p className="text-xl font-bold text-gray-900 mt-2">{confirmation.flight.airline.name}</p>
                <p className="text-sm text-gray-600 mt-2">
                  {confirmation.flight.origin.iataCode} to {confirmation.flight.destination.iataCode}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {formatDateTime(confirmation.flight.origin.departingAt, language)} - {formatDateTime(confirmation.flight.destination.arrivingAt, language)}
                </p>
              </div>

              <div className="md:col-span-2 rounded-2xl border border-gray-200 bg-white p-4">
                <p className="text-xs text-gray-500 uppercase tracking-[0.2em]">{copy.passengersLabel}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {confirmation.passengers.map((passengerName) => (
                    <span
                      key={passengerName}
                      className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700"
                    >
                      {passengerName}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 pb-6 no-print flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handlePrintTicket}
                className="w-full sm:w-auto rounded-2xl px-6 py-3 bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition"
              >
                {language === "bn" ? "টিকেট প্রিন্ট/ডাউনলোড" : "Print / Download Ticket"}
              </button>
              <button
                type="button"
                onClick={clearConfirmation}
                className="w-full sm:w-auto rounded-2xl px-6 py-3 bg-gray-900 text-white font-semibold hover:bg-gray-800 transition"
              >
                {copy.newSearch}
              </button>
            </div>
          </section>
        ) : null}

        {searching ? (
          <section className="mt-6 grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="rounded-[26px] bg-white/85 border border-white/70 p-5 shadow-sm animate-pulse">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="h-5 w-32 bg-gray-200 rounded-full"></div>
                    <div className="h-4 w-20 bg-gray-100 rounded-full mt-3"></div>
                  </div>
                  <div className="h-12 w-12 rounded-2xl bg-gray-100"></div>
                </div>
                <div className="h-20 rounded-3xl bg-gray-100 mt-5"></div>
                <div className="h-12 rounded-2xl bg-gray-100 mt-5"></div>
              </div>
            ))}
          </section>
        ) : null}

        {!searching && flights.length > 0 ? (
          <section className="mt-6">
            <div className="flex items-center justify-between mb-4 px-1">
              <p className="text-sm font-medium text-gray-600" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
                {copy.results}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {flights.map((flight, index) => {
                const isSelected = selectedFlightId === flight.id;

                return (
                  <article
                    key={flight.id}
                    className={`rounded-[28px] border p-5 shadow-sm transition-all ${
                      isSelected
                        ? "bg-emerald-50/95 border-emerald-300 shadow-lg"
                        : "bg-white/90 border-white/70 hover:border-emerald-200"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                          <span>{index === 0 ? copy.bestValue : copy.airline}</span>
                        </div>
                        <h2 className="mt-3 text-xl font-bold text-gray-900" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
                          {flight.airline.name}
                        </h2>
                        <p className="text-sm text-gray-500">
                          {flight.origin.iataCode} to {flight.destination.iataCode}
                        </p>
                      </div>
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-100 to-cyan-100 flex items-center justify-center overflow-hidden border border-white/60">
                        {flight.airline.logo ? (
                          // Duffel logo URLs are external; using img avoids image domain config for this temporary card UI.
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={flight.airline.logo} alt={flight.airline.name} className="w-8 h-8 object-contain" />
                        ) : (
                          <span className="text-lg font-bold text-emerald-700">
                            {(flight.airline.code || flight.airline.name.slice(0, 2)).toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 rounded-[24px] bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-gray-400">{flight.origin.iataCode}</p>
                          <p className="text-sm font-semibold text-gray-800 mt-1">{formatDateTime(flight.origin.departingAt, language)}</p>
                        </div>
                        <div className="flex-1 px-3">
                          <div className="flex items-center gap-2 text-gray-400">
                            <div className="h-px bg-gray-300 flex-1"></div>
                            <span className="text-xs font-medium">{formatDuration(flight.duration, language)}</span>
                            <div className="h-px bg-gray-300 flex-1"></div>
                          </div>
                          <p className="text-center text-xs text-gray-500 mt-2">
                            {flight.stops === 0
                              ? copy.direct
                              : `${flight.stops} ${flight.stops === 1 ? copy.stop : copy.stops}`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs uppercase tracking-[0.2em] text-gray-400">{flight.destination.iataCode}</p>
                          <p className="text-sm font-semibold text-gray-800 mt-1">{formatDateTime(flight.destination.arrivingAt, language)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 flex items-end justify-between gap-4">
                      <div>
                        <p className="text-sm text-gray-500">{copy.price}</p>
                        <p className="text-2xl font-bold text-gray-900">{formatMoney(flight.totalAmount, flight.totalCurrency)}</p>
                        {flight.expiresAt ? (
                          <p className="text-xs text-gray-400 mt-1">
                            {copy.expires} {formatDateTime(flight.expiresAt, language)}
                          </p>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleStartBooking(flight)}
                        className="rounded-2xl px-5 py-3 text-sm font-semibold transition-all bg-emerald-600 text-white shadow-lg hover:bg-emerald-700"
                      >
                        {copy.bookNow}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ) : null}

        {!searching && !hasSearched ? (
          <section className="mt-8 rounded-[28px] border border-dashed border-emerald-200 bg-white/65 px-6 py-14 text-center shadow-sm">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-emerald-100 to-cyan-100 flex items-center justify-center text-3xl">
              ✈️
            </div>
            <h2 className="mt-5 text-2xl font-bold text-gray-900" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
              {copy.emptyTitle}
            </h2>
            <p className="mt-2 text-gray-600 max-w-md mx-auto" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
              {copy.emptyText}
            </p>
          </section>
        ) : null}

        {!searching && hasSearched && flights.length === 0 && !searchError ? (
          <section className="mt-8 rounded-[28px] border border-dashed border-amber-200 bg-white/70 px-6 py-12 text-center shadow-sm">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center text-3xl">
              🧭
            </div>
            <h2 className="mt-5 text-2xl font-bold text-gray-900" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
              {copy.noResults}
            </h2>
            <p className="mt-2 text-gray-600 max-w-md mx-auto" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
              {copy.helper}
            </p>
          </section>
        ) : null}

        {!searching && searchError ? (
          <section className="mt-8 rounded-[28px] border border-rose-200 bg-white/75 px-6 py-10 text-center shadow-sm">
            <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
              {copy.errorTitle}
            </h2>
            <p className="mt-2 text-gray-600" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
              {searchError}
            </p>
          </section>
        ) : null}
      </main>

      {bookingFlight ? (
        <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-2xl rounded-[28px] bg-white shadow-2xl border border-white/60 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-teal-50">
              <h3 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
                {copy.passengerTitle}
              </h3>
              <p className="text-sm text-gray-600 mt-1" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
                {copy.passengerSubtitle}
              </p>
              <p className="text-sm text-emerald-700 font-semibold mt-2">
                {bookingFlight.airline.name} · {bookingFlight.origin.iataCode} to {bookingFlight.destination.iataCode}
              </p>
            </div>

            <form onSubmit={handleConfirmBooking} className="p-6 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">{copy.givenName}</span>
                  <input
                    value={passengerForm.givenName}
                    onChange={(event) => handlePassengerFieldChange("givenName", event.target.value)}
                    className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-2.5 outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400"
                    required
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-gray-700">{copy.familyName}</span>
                  <input
                    value={passengerForm.familyName}
                    onChange={(event) => handlePassengerFieldChange("familyName", event.target.value)}
                    className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-2.5 outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400"
                    required
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">{copy.titleLabel}</span>
                  <select
                    value={passengerForm.title}
                    onChange={(event) => handlePassengerFieldChange("title", event.target.value)}
                    className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-2.5 outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400"
                    required
                  >
                    <option value="mr">Mr</option>
                    <option value="mrs">Mrs</option>
                    <option value="ms">Ms</option>
                    <option value="mx">Mx</option>
                  </select>
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-gray-700">{copy.genderLabel}</span>
                  <select
                    value={passengerForm.gender}
                    onChange={(event) => handlePassengerFieldChange("gender", event.target.value)}
                    className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-2.5 outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400"
                    required
                  >
                    <option value="m">Male</option>
                    <option value="f">Female</option>
                    <option value="x">Other</option>
                  </select>
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-gray-700">{copy.dobLabel}</span>
                  <input
                    type="date"
                    value={passengerForm.bornOn}
                    max={todayIsoDate()}
                    onChange={(event) => handlePassengerFieldChange("bornOn", event.target.value)}
                    className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-2.5 outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400"
                    required
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">{copy.emailLabel}</span>
                  <input
                    type="email"
                    value={passengerForm.email}
                    onChange={(event) => handlePassengerFieldChange("email", event.target.value)}
                    className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-2.5 outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400"
                    required
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-gray-700">{copy.phoneLabel}</span>
                  <input
                    value={passengerForm.phoneNumber}
                    onChange={(event) => handlePassengerFieldChange("phoneNumber", event.target.value)}
                    placeholder="+8801XXXXXXXXX"
                    className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-2.5 outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400"
                    required
                  />
                </label>
              </div>

              {bookingError ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 text-rose-700 px-4 py-3 text-sm">
                  {bookingError}
                </div>
              ) : null}

              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseBookingModal}
                  disabled={bookingSubmitting}
                  className="sm:w-1/3 rounded-xl border border-gray-200 px-4 py-3 font-semibold text-gray-700 hover:bg-gray-50 transition disabled:opacity-60"
                >
                  {copy.cancel}
                </button>
                <button
                  type="submit"
                  disabled={bookingSubmitting}
                  className="sm:flex-1 rounded-xl px-4 py-3 font-semibold text-white shadow-md transition hover:shadow-lg disabled:opacity-70"
                  style={{ background: "linear-gradient(135deg, #5BA88B 0%, #4A9A7C 100%)" }}
                >
                  {bookingSubmitting ? copy.bookingNow : copy.confirmBooking}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <BottomNav />

      <style jsx global>{`
        @media print {
          body {
            background: #ffffff !important;
          }

          .no-print {
            display: none !important;
          }

          nav {
            display: none !important;
          }

          main {
            max-width: 100% !important;
            padding: 0 !important;
          }

          main > section {
            display: none !important;
          }

          #flight-ticket-print {
            display: block !important;
            border: 1px solid #d1d5db !important;
            box-shadow: none !important;
            margin: 0 !important;
          }

          #flight-ticket-print .bg-gradient-to-r {
            background: #0f766e !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          #flight-ticket-print .bg-emerald-50\/70,
          #flight-ticket-print .bg-slate-50,
          #flight-ticket-print .bg-white {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          @page {
            size: A4;
            margin: 12mm;
          }
        }
      `}</style>
    </div>
  );
}
