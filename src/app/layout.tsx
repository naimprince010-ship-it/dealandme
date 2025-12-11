import type { Metadata, Viewport } from "next";
import { Inter, Hind_Siliguri } from "next/font/google";
import "./globals.css";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import { LanguageProvider } from "@/lib/LanguageContext";

const inter = Inter({ 
  subsets: ["latin"],
  display: "swap",
});
const hindSiliguri = Hind_Siliguri({ 
  weight: ["400", "700"],
  subsets: ["bengali"],
  display: "swap",
  variable: "--font-bangla",
});

export const metadata: Metadata = {
  title: "Dealandme - Restaurant Discounts",
  description: "Get verified discounts at local restaurants in Bangladesh",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Dealandme",
  },
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/icon-192x192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#7DD3C0",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn">
      <body className={`${inter.className} ${hindSiliguri.variable} antialiased bg-gray-50 min-h-screen`}>
        <ServiceWorkerRegistration />
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
