import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dealandme Restaurant Partner",
  description: "Restaurant partner app for managing offers and validating coupons",
  manifest: "/manifest-restaurant.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Dealandme Partner",
  },
  icons: {
    icon: "/icons/restaurant-icon-192x192.png",
    apple: "/icons/restaurant-icon-192x192.png",
  },
};

export default function RestaurantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
