"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

interface DebugInfo {
  host: string;
  userAgent: string;
  hasCustomerCookie: boolean;
  hasRestaurantCookie: boolean;
  hasAdminCookie: boolean;
  hasAnySessionCookie: boolean;
  sessionFound: boolean;
  sessionUserType: string | null;
}

interface AuthResponse {
  authenticated: boolean;
  user?: {
    id: string;
    type: string;
    phone?: string;
    name?: string;
  };
  debug?: DebugInfo;
}

export default function AuthDebugOverlay() {
  const searchParams = useSearchParams();
  const [authData, setAuthData] = useState<AuthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Only show if ?debugAuth=1 is in the URL
  const debugMode = searchParams.get("debugAuth") === "1";

  useEffect(() => {
    if (!debugMode) {
      setLoading(false);
      return;
    }

    async function fetchAuthStatus() {
      try {
        // Add debug=1 to get debug info from the API
        const res = await fetch("/api/auth/me?debug=1");
        const data = await res.json();
        setAuthData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch auth status");
      } finally {
        setLoading(false);
      }
    }

    fetchAuthStatus();
  }, [debugMode]);

  // Don't render anything if debug mode is not enabled
  if (!debugMode) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: "80px",
        left: "10px",
        right: "10px",
        backgroundColor: "rgba(0, 0, 0, 0.9)",
        color: "#00ff00",
        padding: "12px",
        borderRadius: "8px",
        fontSize: "11px",
        fontFamily: "monospace",
        zIndex: 9999,
        maxHeight: "200px",
        overflow: "auto",
      }}
    >
      <div style={{ fontWeight: "bold", marginBottom: "8px", color: "#ffff00" }}>
        AUTH DEBUG INFO
      </div>
      
      {loading && <div>Loading...</div>}
      
      {error && <div style={{ color: "#ff0000" }}>Error: {error}</div>}
      
      {authData && (
        <div style={{ lineHeight: "1.6" }}>
          <div>
            <span style={{ color: "#888" }}>authenticated:</span>{" "}
            <span style={{ color: authData.authenticated ? "#00ff00" : "#ff0000" }}>
              {authData.authenticated ? "TRUE" : "FALSE"}
            </span>
          </div>
          
          {authData.user && (
            <div>
              <span style={{ color: "#888" }}>user.type:</span> {authData.user.type}
            </div>
          )}
          
          {authData.debug && (
            <>
              <div style={{ marginTop: "8px", borderTop: "1px solid #444", paddingTop: "8px" }}>
                <div>
                  <span style={{ color: "#888" }}>host:</span> {authData.debug.host}
                </div>
                <div>
                  <span style={{ color: "#888" }}>hasCustomerCookie:</span>{" "}
                  <span style={{ color: authData.debug.hasCustomerCookie ? "#00ff00" : "#ff0000" }}>
                    {authData.debug.hasCustomerCookie ? "YES" : "NO"}
                  </span>
                </div>
                <div>
                  <span style={{ color: "#888" }}>sessionFound:</span>{" "}
                  <span style={{ color: authData.debug.sessionFound ? "#00ff00" : "#ff0000" }}>
                    {authData.debug.sessionFound ? "YES" : "NO"}
                  </span>
                </div>
                <div>
                  <span style={{ color: "#888" }}>sessionUserType:</span>{" "}
                  {authData.debug.sessionUserType || "null"}
                </div>
                <div style={{ marginTop: "4px", fontSize: "9px", color: "#666" }}>
                  UA: {authData.debug.userAgent}
                </div>
              </div>
            </>
          )}
          
          <div style={{ marginTop: "8px", fontSize: "9px", color: "#666" }}>
            Page: {typeof window !== "undefined" ? window.location.pathname : ""}
          </div>
        </div>
      )}
    </div>
  );
}
