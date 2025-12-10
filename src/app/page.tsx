"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/lib/LanguageContext";
import LoginBackgroundPattern from "@/components/LoginBackgroundPattern";
import InstallAppBanner from "@/components/InstallAppBanner";

export default function LandingPage() {
  const router = useRouter();
  const { language, setLanguage } = useLanguage();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.authenticated) {
          if (data.user?.type === "CUSTOMER") {
            router.push("/home");
          } else if (data.user?.type === "RESTAURANT") {
            router.push("/restaurant/dashboard");
          } else if (data.user?.type === "ADMIN") {
            router.push("/admin/dashboard");
          }
        }
      } catch {
        // Not authenticated, show landing page
      } finally {
        setIsCheckingAuth(false);
      }
    }
    checkAuth();
  }, [router]);

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{
        background: "linear-gradient(180deg, #7DD3C0 0%, #A8E6CF 50%, #E8F5E9 100%)"
      }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  const content = {
    hero: {
      title: language === "bn" ? "Dhakar সেরা রেস্টুরেন্টে" : "At Dhaka's Best Restaurants",
      subtitle: language === "bn" ? "৫০% পর্যন্ত ছাড়!" : "Up to 50% Off!",
      description: language === "bn" 
        ? "Bill দেওয়ার আগে app টা দেখান, instant discount পান। কোনো ঝামেলা নেই।" 
        : "Show the app before paying, get instant discount. No hassle.",
      installBtn: language === "bn" ? "App Install করুন" : "Install App",
      customerBtn: language === "bn" ? "Customer Login" : "Customer Login",
      restaurantBtn: language === "bn" ? "Restaurant Partner" : "Restaurant Partner",
    },
    howItWorks: {
      title: language === "bn" ? "কিভাবে কাজ করে?" : "How It Works?",
      steps: [
        {
          icon: "📱",
          title: language === "bn" ? "App Install করুন" : "Install the App",
          desc: language === "bn" ? "Play Store ছাড়াই, সরাসরি website থেকে install করুন" : "Install directly from website, no Play Store needed",
        },
        {
          icon: "🔍",
          title: language === "bn" ? "Restaurant খুঁজুন" : "Find a Restaurant",
          desc: language === "bn" ? "আপনার এলাকায় discount offer আছে এমন restaurant দেখুন" : "Browse restaurants with discount offers in your area",
        },
        {
          icon: "🎫",
          title: language === "bn" ? "Coupon নিন" : "Get Your Coupon",
          desc: language === "bn" ? "Restaurant এ গিয়ে bill দেওয়ার আগে coupon দেখান" : "Show coupon at restaurant before paying the bill",
        },
        {
          icon: "💰",
          title: language === "bn" ? "Discount পান!" : "Get Discount!",
          desc: language === "bn" ? "Instant discount পান, কোনো hidden charge নেই" : "Get instant discount, no hidden charges",
        },
      ],
    },
    savings: {
      title: language === "bn" ? "কত টাকা বাঁচাবেন?" : "How Much Will You Save?",
      examples: [
        { bill: "৳1,000", discount: "20%", save: "৳200" },
        { bill: "৳2,000", discount: "30%", save: "৳600" },
        { bill: "৳5,000", discount: "50%", save: "৳2,500" },
      ],
    },
    forRestaurants: {
      title: language === "bn" ? "Restaurant Owner?" : "Restaurant Owner?",
      subtitle: language === "bn" ? "আপনার empty table গুলো ভরে ফেলুন" : "Fill Your Empty Tables",
      benefits: [
        {
          icon: "📈",
          title: language === "bn" ? "নতুন Customer পান" : "Get New Customers",
          desc: language === "bn" ? "Off-peak time এ নতুন customer আনুন" : "Bring new customers during off-peak hours",
        },
        {
          icon: "💳",
          title: language === "bn" ? "No Upfront Fee" : "No Upfront Fee",
          desc: language === "bn" ? "শুধু customer আসলেই pay করুন" : "Pay only when customers come",
        },
        {
          icon: "📊",
          title: language === "bn" ? "Full Control" : "Full Control",
          desc: language === "bn" ? "Offer, schedule, discount সব নিজে control করুন" : "Control offers, schedule, and discounts yourself",
        },
        {
          icon: "📱",
          title: language === "bn" ? "Easy Dashboard" : "Easy Dashboard",
          desc: language === "bn" ? "Redemption আর billing সব এক জায়গায়" : "Redemptions and billing all in one place",
        },
      ],
      cta: language === "bn" ? "Partner হিসেবে যোগ দিন" : "Join as Partner",
    },
    faq: {
      title: language === "bn" ? "সাধারণ প্রশ্ন" : "FAQ",
      items: [
        {
          q: language === "bn" ? "এটা কি scam? Free discount কেন?" : "Is this a scam? Why free discounts?",
          a: language === "bn" 
            ? "না, এটা scam না। Restaurant রা off-peak time এ customer আনতে discount দেয়। আমরা শুধু connect করি।" 
            : "No, it's not a scam. Restaurants offer discounts to bring customers during off-peak hours. We just connect them.",
        },
        {
          q: language === "bn" ? "কোনো hidden charge আছে?" : "Any hidden charges?",
          a: language === "bn" 
            ? "Customer দের জন্য সম্পূর্ণ free। কোনো charge নেই।" 
            : "Completely free for customers. No charges at all.",
        },
        {
          q: language === "bn" ? "কিভাবে discount পাব?" : "How do I get the discount?",
          a: language === "bn" 
            ? "Restaurant এ গিয়ে bill দেওয়ার আগে app থেকে coupon generate করুন এবং waiter কে দেখান।" 
            : "Go to the restaurant, generate coupon from app before paying, and show it to the waiter.",
        },
        {
          q: language === "bn" ? "Restaurant owner হিসেবে কিভাবে join করব?" : "How do I join as a restaurant owner?",
          a: language === "bn" 
            ? "Restaurant Partner button এ click করুন এবং login করুন। Admin আপনার account setup করে দেবে।" 
            : "Click Restaurant Partner button and login. Admin will set up your account.",
        },
      ],
    },
    areas: {
      title: language === "bn" ? "কোথায় পাবেন?" : "Where to Find Us?",
      list: ["Gulshan", "Banani", "Dhanmondi", "Uttara", "Mirpur", "Mohammadpur", "Bashundhara", "Motijheel"],
    },
    footer: {
      tagline: language === "bn" ? "Dealandme - Restaurant Discounts Made Easy" : "Dealandme - Restaurant Discounts Made Easy",
      copyright: "© 2025 Dealandme. All rights reserved.",
    },
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{
      background: "linear-gradient(180deg, #7DD3C0 0%, #A8E6CF 50%, #E8F5E9 100%)"
    }}>
      <LoginBackgroundPattern />

      {/* Language Toggle */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => setLanguage(language === "bn" ? "en" : "bn")}
          className="px-4 py-2 bg-white/90 backdrop-blur-sm rounded-full text-sm font-medium text-gray-700 shadow-lg hover:bg-white transition-all"
        >
          {language === "bn" ? "EN" : "বাং"}
        </button>
      </div>

      <div className="relative z-10">
        {/* Hero Section */}
        <section className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
          <div className="max-w-lg mx-auto text-center">
            {/* Logo */}
            <div className="w-24 h-24 bg-white/90 backdrop-blur-sm rounded-3xl mx-auto flex items-center justify-center shadow-xl mb-6">
              <span className="text-5xl">🍽️</span>
            </div>

            {/* App Name */}
            <h1 className="text-4xl font-bold text-gray-800 mb-2" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
              Dealandme
            </h1>

            {/* Tagline */}
            <div className="mb-4">
              <p className="text-2xl font-bold text-emerald-700" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
                {content.hero.title}
              </p>
              <p className="text-3xl font-extrabold text-emerald-600" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
                {content.hero.subtitle}
              </p>
            </div>

            {/* Description */}
            <p className="text-gray-600 mb-8 text-lg" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
              {content.hero.description}
            </p>

            {/* Install Banner */}
            <div className="mb-6">
              <InstallAppBanner />
            </div>

            {/* CTA Buttons */}
            <div className="space-y-3">
              <Link
                href="/install"
                className="block w-full py-4 rounded-2xl font-bold text-white text-lg shadow-lg transition-all hover:shadow-xl"
                style={{
                  background: "linear-gradient(135deg, #5BA88B 0%, #4A9A7C 100%)",
                  fontFamily: "var(--font-bangla), sans-serif"
                }}
              >
                {content.hero.installBtn}
              </Link>

              <div className="flex gap-3">
                <Link
                  href="/login"
                  className="flex-1 py-3 rounded-xl font-semibold text-emerald-700 bg-white/80 backdrop-blur-sm shadow-md hover:bg-white transition-all"
                  style={{ fontFamily: "var(--font-bangla), sans-serif" }}
                >
                  {content.hero.customerBtn}
                </Link>
                <Link
                  href="/restaurant/login"
                  className="flex-1 py-3 rounded-xl font-semibold text-emerald-700 bg-white/80 backdrop-blur-sm shadow-md hover:bg-white transition-all"
                  style={{ fontFamily: "var(--font-bangla), sans-serif" }}
                >
                  {content.hero.restaurantBtn}
                </Link>
              </div>
            </div>

            {/* Scroll indicator */}
            <div className="mt-12 animate-bounce">
              <svg className="w-8 h-8 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 px-4 bg-white/50 backdrop-blur-sm">
          <div className="max-w-lg mx-auto">
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-10" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
              {content.howItWorks.title}
            </h2>

            <div className="space-y-6">
              {content.howItWorks.steps.map((step, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">{step.icon}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-6 h-6 bg-emerald-500 text-white rounded-full text-sm font-bold flex items-center justify-center">
                        {index + 1}
                      </span>
                      <h3 className="font-bold text-gray-800" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
                        {step.title}
                      </h3>
                    </div>
                    <p className="text-gray-600 text-sm" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Savings Calculator */}
        <section className="py-16 px-4">
          <div className="max-w-lg mx-auto">
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-8" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
              {content.savings.title}
            </h2>

            <div className="grid grid-cols-3 gap-3">
              {content.savings.examples.map((example, index) => (
                <div key={index} className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 text-center shadow-md">
                  <p className="text-gray-500 text-sm mb-1">Bill</p>
                  <p className="font-bold text-gray-800">{example.bill}</p>
                  <div className="my-2 py-1 bg-emerald-100 rounded-lg">
                    <p className="text-emerald-600 font-bold">{example.discount}</p>
                  </div>
                  <p className="text-gray-500 text-sm mb-1">{language === "bn" ? "বাঁচবে" : "Save"}</p>
                  <p className="font-bold text-emerald-600 text-lg">{example.save}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* For Restaurants */}
        <section className="py-16 px-4 bg-gradient-to-b from-emerald-600 to-emerald-700">
          <div className="max-w-lg mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
                {content.forRestaurants.title}
              </h2>
              <p className="text-emerald-100 text-lg" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
                {content.forRestaurants.subtitle}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              {content.forRestaurants.benefits.map((benefit, index) => (
                <div key={index} className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
                  <span className="text-3xl mb-2 block">{benefit.icon}</span>
                  <h3 className="font-bold text-white mb-1" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
                    {benefit.title}
                  </h3>
                  <p className="text-emerald-100 text-sm" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
                    {benefit.desc}
                  </p>
                </div>
              ))}
            </div>

            <Link
              href="/restaurant/login"
              className="block w-full py-4 rounded-2xl font-bold text-emerald-700 bg-white text-lg shadow-lg text-center hover:bg-emerald-50 transition-all"
              style={{ fontFamily: "var(--font-bangla), sans-serif" }}
            >
              {content.forRestaurants.cta}
            </Link>
          </div>
        </section>

        {/* Areas */}
        <section className="py-16 px-4 bg-white/50 backdrop-blur-sm">
          <div className="max-w-lg mx-auto">
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-8" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
              {content.areas.title}
            </h2>

            <div className="flex flex-wrap justify-center gap-2">
              {content.areas.list.map((area, index) => (
                <span
                  key={index}
                  className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium"
                >
                  {area}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 px-4">
          <div className="max-w-lg mx-auto">
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-8" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
              {content.faq.title}
            </h2>

            <div className="space-y-4">
              {content.faq.items.map((item, index) => (
                <div key={index} className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-md">
                  <h3 className="font-bold text-gray-800 mb-2" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
                    {item.q}
                  </h3>
                  <p className="text-gray-600 text-sm" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
                    {item.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 px-4 bg-gradient-to-b from-emerald-500 to-emerald-600">
          <div className="max-w-lg mx-auto text-center">
            <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
              {language === "bn" ? "আজই শুরু করুন!" : "Start Today!"}
            </h2>
            <p className="text-emerald-100 mb-8" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
              {language === "bn" ? "App install করুন এবং discount পেতে শুরু করুন" : "Install the app and start getting discounts"}
            </p>

            <div className="flex gap-3 justify-center">
              <Link
                href="/install"
                className="px-8 py-4 rounded-2xl font-bold text-emerald-700 bg-white text-lg shadow-lg hover:bg-emerald-50 transition-all"
                style={{ fontFamily: "var(--font-bangla), sans-serif" }}
              >
                {content.hero.installBtn}
              </Link>
            </div>

            {/* QR Code */}
            <div className="mt-8">
              <p className="text-emerald-100 text-sm mb-3" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
                {language === "bn" ? "অথবা QR code scan করুন" : "Or scan QR code"}
              </p>
              <div className="w-32 h-32 bg-white rounded-2xl mx-auto p-2 shadow-lg">
                <img src="/qr/install-app.png" alt="Install QR Code" className="w-full h-full" />
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 px-4 bg-gray-800">
          <div className="max-w-lg mx-auto text-center">
            <p className="text-gray-400 text-sm mb-2">{content.footer.tagline}</p>
            <p className="text-gray-500 text-xs">{content.footer.copyright}</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
