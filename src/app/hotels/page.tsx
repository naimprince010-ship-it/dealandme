"use client";

import { useMemo, useState } from "react";
import BottomNav from "@/components/BottomNav";
import LoginBackgroundPattern from "@/components/LoginBackgroundPattern";
import { useLanguage } from "@/lib/LanguageContext";

// ── Types ──────────────────────────────────────────────────────────────────

type Hotel = {
  id: string;
  name: string;
  city: string;
  country: string;
  address: string;
  imageUrl: string;
  stars: number;
  reviewScore: number;
  reviewLabel: string;
  reviewCount: number;
  discountedPrice: number;
  originalPrice: number;
  currency: string;
  amenities: string[];
  distanceToCenter: string;
};

type HotelSearchResponse = {
  hotels?: Hotel[];
  count?: number;
  meta?: { city?: string; checkIn?: string | null; checkOut?: string | null; guests?: number };
  error?: string;
};

type MockBooking = {
  hotel: Hotel;
  checkIn: string;
  checkOut: string;
  guests: number;
  nights: number;
  totalPrice: number;
  reference: string;
};

// ── Helpers ────────────────────────────────────────────────────────────────

function todayIsoDate() {
  return new Date().toISOString().split("T")[0];
}

function isoDatePlusDays(base: string, days: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function nightsBetween(checkIn: string, checkOut: string): number {
  const diff =
    new Date(checkOut).getTime() - new Date(checkIn).getTime();
  return Math.max(1, Math.round(diff / 86_400_000));
}

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDisplayDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(iso));
}

function generateRef() {
  return "HTL-" + Math.random().toString(36).substring(2, 9).toUpperCase();
}

function StarRow({ count }: { count: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`w-3.5 h-3.5 ${i < count ? "text-amber-400" : "text-gray-200"}`}
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </span>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

const POPULAR_CITIES = ["London", "Paris", "Cox's Bazar", "New York"];

export default function HotelsPage() {
  const { language } = useLanguage();
  const today = todayIsoDate();
  const tomorrow = isoDatePlusDays(today, 1);

  const [form, setForm] = useState({
    city: "",
    checkIn: today,
    checkOut: tomorrow,
    guests: 1,
  });
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [hotels, setHotels] = useState<Hotel[]>([]);

  // Booking modal
  const [bookingHotel, setBookingHotel] = useState<Hotel | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState("");

  // Confirmation screen
  const [confirmation, setConfirmation] = useState<MockBooking | null>(null);

  const c = useMemo(() => ({
    title: language === "bn" ? "হোটেল খুঁজুন" : "Hotel Search",
    subtitle:
      language === "bn"
        ? "বিশ্বজুড়ে সেরা হোটেল বেছে নিন, সেরা দামে বুক করুন।"
        : "Find and book the best hotels worldwide at unbeatable prices.",
    cityLabel: language === "bn" ? "গন্তব্য শহর" : "Destination City",
    cityPlaceholder: language === "bn" ? "যেমন: London, Paris" : "e.g. London, New York",
    checkIn: language === "bn" ? "চেক-ইন তারিখ" : "Check-in",
    checkOut: language === "bn" ? "চেক-আউট তারিখ" : "Check-out",
    guests: language === "bn" ? "অতিথি সংখ্যা" : "Guests",
    searchBtn: language === "bn" ? "হোটেল খুঁজুন" : "Search Hotels",
    searchingBtn: language === "bn" ? "খোঁজা হচ্ছে…" : "Searching…",
    results: (n: number) =>
      language === "bn" ? `${n}টি হোটেল পাওয়া গেছে` : `${n} hotels found`,
    bookBtn: language === "bn" ? "বুক করুন" : "Book Hotel",
    perNight: language === "bn" ? "/ রাত" : "/ night",
    reviews: (n: number) =>
      language === "bn" ? `${n} রিভিউ` : `${n.toLocaleString()} reviews`,
    distance: language === "bn" ? "কেন্দ্র থেকে" : "",
    noResults: language === "bn" ? "এই শহরে কোনো হোটেল পাওয়া যায়নি।" : "No hotels found for this city.",
    emptyTitle: language === "bn" ? "কোথায় যেতে চান?" : "Where would you like to stay?",
    emptyText:
      language === "bn"
        ? "উপরের ফর্মে শহর ও তারিখ দিয়ে সার্চ করুন।"
        : "Enter a city, dates, and guests above to start searching.",
    errorTitle: language === "bn" ? "হোটেল ডেটা আনা যায়নি" : "Could not load hotels",
    popular: language === "bn" ? "জনপ্রিয় শহর:" : "Popular:",
    // modal
    modalTitle: language === "bn" ? "বুকিং নিশ্চিত করুন" : "Confirm Your Booking",
    nightLabel: language === "bn" ? "রাত" : "night",
    nightsLabel: (n: number) => language === "bn" ? `${n} রাত` : `${n} night${n > 1 ? "s" : ""}`,
    total: language === "bn" ? "মোট মূল্য" : "Total",
    cancel: language === "bn" ? "বাতিল" : "Cancel",
    confirm: language === "bn" ? "বুকিং নিশ্চিত করুন" : "Confirm Booking",
    confirming: language === "bn" ? "বুকিং হচ্ছে…" : "Booking…",
    // ticket
    ticketTitle: language === "bn" ? "বুকিং সম্পন্ন! 🎉" : "Booking Confirmed! 🎉",
    ticketSub: language === "bn" ? "আপনার হোটেল বুকিং সম্পন্ন হয়েছে।" : "Your hotel reservation is ready.",
    refLabel: language === "bn" ? "বুকিং রেফারেন্স" : "Booking Reference",
    checkinLabel: language === "bn" ? "চেক-ইন" : "Check-in",
    checkoutLabel: language === "bn" ? "চেক-আউট" : "Check-out",
    guestsLabel: language === "bn" ? "অতিথি" : "Guests",
    totalLabel: language === "bn" ? "মোট পরিশোধ" : "Total Paid",
    printBtn: language === "bn" ? "রসিদ প্রিন্ট করুন" : "Print Receipt",
    newSearch: language === "bn" ? "নতুন সার্চ করুন" : "Search Again",
  }), [language]);

  const handleFormChange = (field: keyof typeof form, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.city.trim()) return;
    setHasSearched(true);
    setSearching(true);
    setSearchError("");
    setConfirmation(null);

    try {
      const res = await fetch("/api/hotels/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city: form.city.trim(),
          checkIn: form.checkIn,
          checkOut: form.checkOut,
          guests: form.guests,
        }),
      });
      const data = (await res.json()) as HotelSearchResponse;
      if (!res.ok) {
        setSearchError(data.error || "Search failed");
        setHotels([]);
      } else {
        setHotels(data.hotels || []);
      }
    } catch {
      setSearchError("Could not connect to hotel search");
      setHotels([]);
    } finally {
      setSearching(false);
    }
  };

  const handleConfirmBooking = async () => {
    if (!bookingHotel) return;
    setBookingLoading(true);
    setBookingError("");

    // Simulate a brief network delay to give a realistic booking feel.
    await new Promise((r) => setTimeout(r, 900));

    const nights = nightsBetween(form.checkIn, form.checkOut);
    const totalPrice = bookingHotel.discountedPrice * nights;

    setConfirmation({
      hotel: bookingHotel,
      checkIn: form.checkIn,
      checkOut: form.checkOut,
      guests: form.guests,
      nights,
      totalPrice,
      reference: generateRef(),
    });
    setBookingHotel(null);
    setBookingLoading(false);
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") window.print();
  };

  // ── Skeleton cards while searching ────────────────────────────────────────
  const SkeletonCard = () => (
    <div className="rounded-[26px] bg-white/85 border border-white/70 shadow-sm animate-pulse overflow-hidden">
      <div className="h-48 bg-gray-200" />
      <div className="p-4 space-y-3">
        <div className="h-5 w-3/4 bg-gray-200 rounded-full" />
        <div className="h-4 w-1/2 bg-gray-100 rounded-full" />
        <div className="h-4 w-2/3 bg-gray-100 rounded-full" />
        <div className="h-10 bg-gray-200 rounded-2xl mt-4" />
      </div>
    </div>
  );

  return (
    <div
      className="min-h-screen pb-24 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #f9f5ec 0%, #e8f4f0 50%, #d4ebe5 100%)" }}
    >
      <LoginBackgroundPattern />

      <main className="relative z-10 max-w-5xl mx-auto px-4 pt-6 pb-8">

        {/* ── Hero / Search panel ───────────────────────────────────────── */}
        <section className="bg-white/75 backdrop-blur-sm border border-white/60 shadow-sm rounded-[28px] p-5 md:p-7">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-6">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-100 text-teal-700 text-sm font-semibold mb-3">
                <span>🏨</span>
                <span>{language === "bn" ? "বিশেষ ডিল" : "Best Deals"}</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
                {c.title}
              </h1>
              <p className="mt-2 text-sm md:text-base text-gray-600" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
                {c.subtitle}
              </p>
            </div>

            {/* Popular cities quick-pick */}
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-gray-500 self-center">{c.popular}</span>
              {POPULAR_CITIES.map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => handleFormChange("city", city)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                    form.city === city
                      ? "bg-teal-500 text-white border-teal-500"
                      : "bg-white text-gray-600 border-gray-200 hover:border-teal-300"
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSearch} className="grid gap-4 md:grid-cols-[1fr_1fr_1fr_auto_auto]">
            <label className="block">
              <span className="block text-sm font-medium text-gray-700 mb-2">{c.cityLabel}</span>
              <input
                value={form.city}
                onChange={(e) => handleFormChange("city", e.target.value)}
                placeholder={c.cityPlaceholder}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
                required
              />
            </label>

            <label className="block">
              <span className="block text-sm font-medium text-gray-700 mb-2">{c.checkIn}</span>
              <input
                type="date"
                value={form.checkIn}
                min={today}
                onChange={(e) => {
                  handleFormChange("checkIn", e.target.value);
                  // keep checkout at least 1 night ahead
                  if (e.target.value >= form.checkOut) {
                    handleFormChange("checkOut", isoDatePlusDays(e.target.value, 1));
                  }
                }}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
                required
              />
            </label>

            <label className="block">
              <span className="block text-sm font-medium text-gray-700 mb-2">{c.checkOut}</span>
              <input
                type="date"
                value={form.checkOut}
                min={isoDatePlusDays(form.checkIn, 1)}
                onChange={(e) => handleFormChange("checkOut", e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
                required
              />
            </label>

            <label className="block">
              <span className="block text-sm font-medium text-gray-700 mb-2">{c.guests}</span>
              <select
                value={form.guests}
                onChange={(e) => handleFormChange("guests", Number(e.target.value))}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
              >
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </label>

            <button
              type="submit"
              disabled={searching}
              className="h-[52px] md:self-end rounded-2xl px-6 font-semibold text-white shadow-lg transition hover:shadow-xl disabled:opacity-70"
              style={{ background: "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)" }}
            >
              {searching ? c.searchingBtn : c.searchBtn}
            </button>
          </form>
        </section>

        {/* ── Booking confirmation / receipt (print-friendly) ───────────── */}
        {confirmation ? (
          <section id="hotel-receipt-print" className="mt-6 rounded-[30px] border border-teal-200 bg-white/90 shadow-xl overflow-hidden print:mt-0 print:rounded-none print:border-gray-300 print:shadow-none">
            <div className="bg-gradient-to-r from-teal-600 to-emerald-500 px-6 py-6 text-white">
              <p className="text-xs uppercase tracking-[0.24em] text-white/70">E-Receipt</p>
              <h2 className="text-2xl font-bold mt-1" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>{c.ticketTitle}</h2>
              <p className="text-sm text-white/85 mt-1" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>{c.ticketSub}</p>
            </div>

            <div className="px-6 py-6 grid gap-4 md:grid-cols-2">
              {/* Reference + hotel */}
              <div className="rounded-2xl border border-teal-100 bg-teal-50/70 p-4">
                <p className="text-xs text-gray-500 uppercase tracking-[0.2em]">{c.refLabel}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{confirmation.reference}</p>
                <p className="text-xs text-gray-500 mt-4 uppercase tracking-[0.2em]">Hotel</p>
                <p className="text-base font-semibold text-gray-800 mt-1">{confirmation.hotel.name}</p>
                <p className="text-sm text-gray-500">{confirmation.hotel.address}</p>
              </div>

              {/* Stay summary */}
              <div className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{c.checkinLabel}</span>
                  <span className="font-semibold text-gray-800">{formatDisplayDate(confirmation.checkIn)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{c.checkoutLabel}</span>
                  <span className="font-semibold text-gray-800">{formatDisplayDate(confirmation.checkOut)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Duration</span>
                  <span className="font-semibold text-gray-800">{c.nightsLabel(confirmation.nights)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{c.guestsLabel}</span>
                  <span className="font-semibold text-gray-800">{confirmation.guests}</span>
                </div>
                <div className="border-t border-gray-100 pt-3 flex justify-between">
                  <span className="text-sm font-semibold text-gray-700">{c.totalLabel}</span>
                  <span className="text-xl font-bold text-teal-700">
                    {formatMoney(confirmation.totalPrice, confirmation.hotel.currency)}
                  </span>
                </div>
              </div>
            </div>

            <div className="px-6 pb-6 no-print flex flex-col sm:flex-row gap-3">
              <button
                onClick={handlePrint}
                className="rounded-2xl px-6 py-3 bg-teal-600 text-white font-semibold hover:bg-teal-700 transition"
              >
                {c.printBtn}
              </button>
              <button
                onClick={() => setConfirmation(null)}
                className="rounded-2xl px-6 py-3 bg-gray-900 text-white font-semibold hover:bg-gray-800 transition"
              >
                {c.newSearch}
              </button>
            </div>
          </section>
        ) : null}

        {/* ── Skeleton while loading ────────────────────────────────────── */}
        {searching ? (
          <section className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </section>
        ) : null}

        {/* ── Hotel results grid ────────────────────────────────────────── */}
        {!searching && hotels.length > 0 ? (
          <section className="mt-6">
            <p className="text-sm font-medium text-gray-600 mb-4 px-1" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
              {c.results(hotels.length)}
            </p>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {hotels.map((hotel) => (
                <article
                  key={hotel.id}
                  className="rounded-[26px] bg-white/90 border border-white/70 shadow-sm hover:shadow-md hover:border-teal-200 transition-all overflow-hidden flex flex-col"
                >
                  {/* Image */}
                  <div className="relative h-48 overflow-hidden bg-gray-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={hotel.imageUrl}
                      alt={hotel.name}
                      className="w-full h-full object-cover transition-transform hover:scale-105 duration-500"
                    />
                    {/* Discount badge */}
                    {hotel.originalPrice > hotel.discountedPrice && (
                      <div className="absolute top-3 left-3 bg-rose-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                        -{Math.round(100 - (hotel.discountedPrice / hotel.originalPrice) * 100)}%
                      </div>
                    )}
                    {/* Stars overlay */}
                    <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                      <StarRow count={hotel.stars} />
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-4 flex flex-col flex-1">
                    <h2 className="text-base font-bold text-gray-900 leading-snug">{hotel.name}</h2>
                    <p className="text-xs text-gray-500 mt-1">{hotel.address}</p>
                    <p className="text-xs text-teal-600 mt-1">{hotel.distanceToCenter}</p>

                    {/* Review */}
                    <div className="mt-3 flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-lg bg-teal-600 text-white text-xs font-bold">
                        {hotel.reviewScore.toFixed(1)}
                      </span>
                      <span className="text-xs font-semibold text-gray-700">{hotel.reviewLabel}</span>
                      <span className="text-xs text-gray-400">· {c.reviews(hotel.reviewCount)}</span>
                    </div>

                    {/* Amenities */}
                    <div className="mt-3 flex flex-wrap gap-1">
                      {hotel.amenities.slice(0, 3).map((a) => (
                        <span key={a} className="text-xs bg-teal-50 text-teal-700 border border-teal-100 px-2 py-0.5 rounded-full">
                          {a}
                        </span>
                      ))}
                      {hotel.amenities.length > 3 && (
                        <span className="text-xs text-gray-400">+{hotel.amenities.length - 3}</span>
                      )}
                    </div>

                    {/* Price + CTA */}
                    <div className="mt-auto pt-4 flex items-end justify-between gap-2">
                      <div>
                        <p className="text-xs text-gray-400 line-through">
                          {formatMoney(hotel.originalPrice, hotel.currency)}
                        </p>
                        <p className="text-xl font-bold text-gray-900">
                          {formatMoney(hotel.discountedPrice, hotel.currency)}
                          <span className="text-xs font-normal text-gray-500 ml-1">{c.perNight}</span>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setBookingHotel(hotel);
                          setBookingError("");
                        }}
                        className="rounded-2xl px-4 py-2.5 text-sm font-semibold text-white shadow transition hover:shadow-md"
                        style={{ background: "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)" }}
                      >
                        {c.bookBtn}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {/* ── Empty / no-results / error states ────────────────────────── */}
        {!searching && !hasSearched ? (
          <section className="mt-8 rounded-[28px] border border-dashed border-teal-200 bg-white/65 px-6 py-14 text-center shadow-sm">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-teal-100 to-emerald-100 flex items-center justify-center text-3xl">🏨</div>
            <h2 className="mt-5 text-2xl font-bold text-gray-900" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>{c.emptyTitle}</h2>
            <p className="mt-2 text-gray-600 max-w-md mx-auto" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>{c.emptyText}</p>
          </section>
        ) : null}

        {!searching && hasSearched && hotels.length === 0 && !searchError ? (
          <section className="mt-8 rounded-[28px] border border-dashed border-amber-200 bg-white/70 px-6 py-12 text-center shadow-sm">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center text-3xl">🧭</div>
            <h2 className="mt-5 text-2xl font-bold text-gray-900" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>{c.noResults}</h2>
            <p className="mt-2 text-gray-500 text-sm" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
              {language === "bn" ? "জনপ্রিয় শহর ব্যবহার করুন: London, Paris, Cox\'s Bazar, New York" : "Try: London, Paris, Cox\'s Bazar, New York"}
            </p>
          </section>
        ) : null}

        {!searching && searchError ? (
          <section className="mt-8 rounded-[28px] border border-rose-200 bg-white/75 px-6 py-10 text-center shadow-sm">
            <h2 className="text-xl font-bold text-gray-900">{c.errorTitle}</h2>
            <p className="mt-2 text-gray-600">{searchError}</p>
          </section>
        ) : null}
      </main>

      {/* ── Booking confirmation modal ──────────────────────────────────── */}
      {bookingHotel ? (
        <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center px-4 py-8">
          <div className="w-full max-w-lg rounded-[28px] bg-white shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-teal-50 to-emerald-50 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">{c.modalTitle}</h3>
              <p className="text-sm text-teal-700 font-semibold mt-1">{bookingHotel.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">{bookingHotel.address}</p>
            </div>

            {/* Summary */}
            <div className="px-6 py-5 space-y-3">
              {/* mini hotel card */}
              <div className="rounded-2xl overflow-hidden flex gap-3 border border-gray-100">
                <div className="w-24 h-24 flex-shrink-0 bg-gray-100 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={bookingHotel.imageUrl} alt={bookingHotel.name} className="w-full h-full object-cover" />
                </div>
                <div className="p-3 flex flex-col justify-center">
                  <StarRow count={bookingHotel.stars} />
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="px-1.5 py-0.5 rounded-md bg-teal-600 text-white text-xs font-bold">
                      {bookingHotel.reviewScore.toFixed(1)}
                    </span>
                    <span className="text-xs text-gray-600">{bookingHotel.reviewLabel}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{bookingHotel.distanceToCenter}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 space-y-2">
                {[
                  { label: c.checkinLabel, value: formatDisplayDate(form.checkIn) },
                  { label: c.checkoutLabel, value: formatDisplayDate(form.checkOut) },
                  { label: "Duration", value: c.nightsLabel(nightsBetween(form.checkIn, form.checkOut)) },
                  { label: c.guestsLabel, value: String(form.guests) },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-gray-500">{label}</span>
                    <span className="font-semibold text-gray-800">{value}</span>
                  </div>
                ))}
                <div className="border-t border-gray-200 pt-2 flex justify-between">
                  <span className="text-sm font-semibold text-gray-700">{c.total}</span>
                  <span className="text-lg font-bold text-teal-700">
                    {formatMoney(
                      bookingHotel.discountedPrice * nightsBetween(form.checkIn, form.checkOut),
                      bookingHotel.currency
                    )}
                  </span>
                </div>
              </div>

              {bookingError ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 text-rose-700 px-4 py-3 text-sm">
                  {bookingError}
                </div>
              ) : null}
            </div>

            {/* Actions */}
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setBookingHotel(null)}
                disabled={bookingLoading}
                className="flex-1 rounded-2xl border border-gray-200 py-3 font-semibold text-gray-700 hover:bg-gray-50 transition disabled:opacity-60"
              >
                {c.cancel}
              </button>
              <button
                onClick={handleConfirmBooking}
                disabled={bookingLoading}
                className="flex-1 rounded-2xl py-3 font-semibold text-white shadow transition hover:shadow-lg disabled:opacity-70"
                style={{ background: "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)" }}
              >
                {bookingLoading ? c.confirming : c.confirm}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <BottomNav />

      <style jsx global>{`
        @media print {
          body { background: #ffffff !important; }
          .no-print { display: none !important; }
          nav { display: none !important; }
          main > section { display: none !important; }
          #hotel-receipt-print {
            display: block !important;
            border: 1px solid #d1d5db !important;
            box-shadow: none !important;
            margin: 0 !important;
          }
          #hotel-receipt-print .bg-gradient-to-r {
            background: #0f766e !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          @page { size: A4; margin: 12mm; }
        }
      `}</style>
    </div>
  );
}
