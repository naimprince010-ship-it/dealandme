"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export default function AnalyticsTracker() {
  const pathname = usePathname();
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const installIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (pathname?.startsWith("/admin")) {
      return;
    }

    const sendHeartbeat = async () => {
      try {
        await fetch("/api/analytics/heartbeat", {
          method: "POST",
          credentials: "include",
        });
      } catch {
        // Silently fail - user might not be logged in
      }
    };

    sendHeartbeat();

    heartbeatIntervalRef.current = setInterval(sendHeartbeat, 60000);

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, [pathname]);

  useEffect(() => {
    if (pathname?.startsWith("/admin")) {
      return;
    }

    const appType = pathname?.startsWith("/restaurant") ? "RESTAURANT" : "CUSTOMER";

    const getOrCreateInstallId = (): string => {
      const storageKey = `dealandme_install_id_${appType}`;
      let installId = localStorage.getItem(storageKey);
      if (!installId) {
        installId = `${appType}_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
        localStorage.setItem(storageKey, installId);
      }
      return installId;
    };

    const trackInstall = async () => {
      try {
        const installId = getOrCreateInstallId();
        installIdRef.current = installId;

        await fetch("/api/analytics/install", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            installId,
            appType,
          }),
        });
      } catch {
        // Silently fail
      }
    };

    const handleAppInstalled = () => {
      trackInstall();
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    if (window.matchMedia("(display-mode: standalone)").matches) {
      trackInstall();
    }

    return () => {
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [pathname]);

  return null;
}
