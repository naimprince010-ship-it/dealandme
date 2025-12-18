"use client";

import { useEffect, useState } from "react";

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
  error?: string;
}

export default function DebugAuthPage() {
  const [authData, setAuthData] = useState<AuthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timestamp, setTimestamp] = useState<string>("");

  useEffect(() => {
    async function fetchAuthStatus() {
      try {
        setTimestamp(new Date().toISOString());
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
  }, []);

  const refresh = () => {
    setLoading(true);
    setError(null);
    setTimestamp(new Date().toISOString());
    fetch("/api/auth/me?debug=1")
      .then(res => res.json())
      .then(data => setAuthData(data))
      .catch(err => setError(err instanceof Error ? err.message : "Failed"))
      .finally(() => setLoading(false));
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#1a1a2e",
        color: "#00ff00",
        padding: "20px",
        fontFamily: "monospace",
        fontSize: "14px",
      }}
    >
      <div
        style={{
          maxWidth: "500px",
          margin: "0 auto",
        }}
      >
        <h1
          style={{
            color: "#ffff00",
            fontSize: "18px",
            marginBottom: "20px",
            textAlign: "center",
          }}
        >
          AUTH DEBUG PAGE
        </h1>

        <div
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            padding: "15px",
            borderRadius: "8px",
            marginBottom: "15px",
          }}
        >
          <div style={{ marginBottom: "10px", color: "#888" }}>
            Timestamp: {timestamp}
          </div>
          <div style={{ marginBottom: "10px", color: "#888" }}>
            Page: {typeof window !== "undefined" ? window.location.href : ""}
          </div>
        </div>

        {loading && (
          <div style={{ textAlign: "center", padding: "20px" }}>
            Loading...
          </div>
        )}

        {error && (
          <div
            style={{
              backgroundColor: "rgba(255, 0, 0, 0.2)",
              padding: "15px",
              borderRadius: "8px",
              color: "#ff0000",
              marginBottom: "15px",
            }}
          >
            Error: {error}
          </div>
        )}

        {authData && (
          <div
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              padding: "15px",
              borderRadius: "8px",
              lineHeight: "2",
            }}
          >
            <div style={{ borderBottom: "1px solid #333", paddingBottom: "10px", marginBottom: "10px" }}>
              <div style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "10px" }}>
                MAIN STATUS
              </div>
              <div>
                <span style={{ color: "#888" }}>authenticated:</span>{" "}
                <span
                  style={{
                    color: authData.authenticated ? "#00ff00" : "#ff0000",
                    fontWeight: "bold",
                    fontSize: "16px",
                  }}
                >
                  {authData.authenticated ? "TRUE" : "FALSE"}
                </span>
              </div>
              {authData.user && (
                <>
                  <div>
                    <span style={{ color: "#888" }}>user.type:</span>{" "}
                    <span style={{ color: "#00ffff" }}>{authData.user.type}</span>
                  </div>
                  <div>
                    <span style={{ color: "#888" }}>user.id:</span>{" "}
                    <span style={{ color: "#aaa" }}>{authData.user.id?.substring(0, 8)}...</span>
                  </div>
                </>
              )}
            </div>

            {authData.debug && (
              <div>
                <div style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "10px" }}>
                  DEBUG INFO
                </div>
                <div>
                  <span style={{ color: "#888" }}>host:</span>{" "}
                  <span style={{ color: "#00ffff" }}>{authData.debug.host}</span>
                </div>
                <div>
                  <span style={{ color: "#888" }}>hasCustomerCookie:</span>{" "}
                  <span
                    style={{
                      color: authData.debug.hasCustomerCookie ? "#00ff00" : "#ff0000",
                      fontWeight: "bold",
                    }}
                  >
                    {authData.debug.hasCustomerCookie ? "YES" : "NO"}
                  </span>
                </div>
                <div>
                  <span style={{ color: "#888" }}>sessionFound:</span>{" "}
                  <span
                    style={{
                      color: authData.debug.sessionFound ? "#00ff00" : "#ff0000",
                      fontWeight: "bold",
                    }}
                  >
                    {authData.debug.sessionFound ? "YES" : "NO"}
                  </span>
                </div>
                <div>
                  <span style={{ color: "#888" }}>sessionUserType:</span>{" "}
                  <span style={{ color: "#00ffff" }}>
                    {authData.debug.sessionUserType || "null"}
                  </span>
                </div>
                <div style={{ marginTop: "10px", fontSize: "11px", color: "#666", wordBreak: "break-all" }}>
                  UA: {authData.debug.userAgent}
                </div>
              </div>
            )}

            {authData.error && (
              <div style={{ color: "#ff0000", marginTop: "10px" }}>
                API Error: {authData.error}
              </div>
            )}
          </div>
        )}

        <button
          onClick={refresh}
          style={{
            width: "100%",
            marginTop: "20px",
            padding: "12px",
            backgroundColor: "#333",
            color: "#00ff00",
            border: "1px solid #00ff00",
            borderRadius: "8px",
            fontFamily: "monospace",
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          REFRESH
        </button>

        <div
          style={{
            marginTop: "30px",
            padding: "15px",
            backgroundColor: "rgba(255, 255, 0, 0.1)",
            borderRadius: "8px",
            color: "#ffff00",
            fontSize: "12px",
          }}
        >
          <strong>Instructions:</strong>
          <br />
          1. Login on your phone first
          <br />
          2. Then visit this page
          <br />
          3. Take a screenshot (with address bar visible)
          <br />
          4. Send the screenshot
          <br />
          <br />
          <strong>Expected (if logged in):</strong>
          <br />
          - authenticated: TRUE (green)
          <br />
          - hasCustomerCookie: YES (green)
          <br />
          - sessionFound: YES (green)
        </div>
      </div>
    </div>
  );
}
