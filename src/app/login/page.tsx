"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  MessageSquareCode,
  Mail,
  Lock,
  User,
  Building2,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { ApiClient, getApiBase } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [orgName, setOrgName] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "login") {
        const res = await fetch(`${getApiBase()}/api/v1/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim(), password }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.detail || "Invalid email or password");
        }

        ApiClient.setAuth(data.access_token, data.user, data.organization);
        router.push("/");
      } else {
        if (!fullName.trim()) throw new Error("Full name is required");
        const res = await fetch(`${getApiBase()}/api/v1/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim(),
            password,
            full_name: fullName.trim(),
            organization_name: orgName.trim() || `${fullName.trim()}'s Business`,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.detail || "Registration failed. Try another email.");
        }

        ApiClient.setAuth(data.access_token, data.user, data.organization);
        router.push("/");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  // Quick Demo Sign In
  async function handleDemoLogin() {
    setLoading(true);
    setError(null);
    try {
      await ApiClient.ensureAuth(true);
      router.push("/");
    } catch (err: any) {
      setError("Failed to initialize demo session");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f0f2f5",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>
      <div style={{
        width: "100%",
        maxWidth: "460px",
        background: "#ffffff",
        borderRadius: "20px",
        border: "1px solid #e9edef",
        boxShadow: "0 10px 40px rgba(11, 20, 26, 0.08)",
        overflow: "hidden",
      }}>
        {/* Top Header Card */}
        <div style={{
          padding: "32px 32px 20px",
          textAlign: "center",
          borderBottom: "1px solid #f0f2f5",
        }}>
          <div style={{
            width: "56px",
            height: "56px",
            borderRadius: "16px",
            background: "#00a884",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#ffffff",
            marginBottom: "16px",
            boxShadow: "0 4px 14px rgba(0, 168, 132, 0.35)",
          }}>
            <MessageSquareCode style={{ width: "30px", height: "30px" }} />
          </div>

          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#111b21", letterSpacing: "-0.02em" }}>
            AutoChat <span style={{ color: "#00a884" }}>PRO</span>
          </h1>
          <p style={{ fontSize: "13px", color: "#54656f", marginTop: "4px" }}>
            {mode === "login" ? "Sign in to manage your WhatsApp campaigns & live chat" : "Create your free account & start messaging in seconds"}
          </p>

          {/* Mode Switch Tabs */}
          <div style={{
            display: "flex",
            background: "#f0f2f5",
            padding: "4px",
            borderRadius: "10px",
            marginTop: "20px",
          }}>
            <button
              type="button"
              onClick={() => { setMode("login"); setError(null); }}
              style={{
                flex: 1,
                padding: "8px",
                borderRadius: "8px",
                border: "none",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                background: mode === "login" ? "#ffffff" : "transparent",
                color: mode === "login" ? "#111b21" : "#54656f",
                boxShadow: mode === "login" ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode("register"); setError(null); }}
              style={{
                flex: 1,
                padding: "8px",
                borderRadius: "8px",
                border: "none",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                background: mode === "register" ? "#ffffff" : "transparent",
                color: mode === "register" ? "#111b21" : "#54656f",
                boxShadow: mode === "register" ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              Sign Up (Free)
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: "28px 32px 32px" }}>
          {error && (
            <div style={{
              padding: "10px 14px",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "8px",
              color: "#dc2626",
              fontSize: "12.5px",
              fontWeight: 500,
              marginBottom: "18px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}>
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {mode === "register" && (
              <>
                <div>
                  <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "#111b21", marginBottom: "6px" }}>
                    Full Name *
                  </label>
                  <div style={{ position: "relative" }}>
                    <User style={{ position: "absolute", left: "14px", top: "11px", width: "16px", height: "16px", color: "#8696a0" }} />
                    <input
                      type="text"
                      placeholder="e.g. Sai Sathwik"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      style={{
                        width: "100%",
                        padding: "10px 14px 10px 38px",
                        background: "#f0f2f5",
                        border: "1px solid #e9edef",
                        borderRadius: "8px",
                        fontSize: "13.5px",
                        color: "#111b21",
                        outline: "none",
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "#111b21", marginBottom: "6px" }}>
                    Company / Organization Name (Optional)
                  </label>
                  <div style={{ position: "relative" }}>
                    <Building2 style={{ position: "absolute", left: "14px", top: "11px", width: "16px", height: "16px", color: "#8696a0" }} />
                    <input
                      type="text"
                      placeholder="e.g. Acme Innovations"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 14px 10px 38px",
                        background: "#f0f2f5",
                        border: "1px solid #e9edef",
                        borderRadius: "8px",
                        fontSize: "13.5px",
                        color: "#111b21",
                        outline: "none",
                      }}
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "#111b21", marginBottom: "6px" }}>
                Email Address *
              </label>
              <div style={{ position: "relative" }}>
                <Mail style={{ position: "absolute", left: "14px", top: "11px", width: "16px", height: "16px", color: "#8696a0" }} />
                <input
                  type="email"
                  placeholder="name@business.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "10px 14px 10px 38px",
                    background: "#f0f2f5",
                    border: "1px solid #e9edef",
                    borderRadius: "8px",
                    fontSize: "13.5px",
                    color: "#111b21",
                    outline: "none",
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "#111b21", marginBottom: "6px" }}>
                Password *
              </label>
              <div style={{ position: "relative" }}>
                <Lock style={{ position: "absolute", left: "14px", top: "11px", width: "16px", height: "16px", color: "#8696a0" }} />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  style={{
                    width: "100%",
                    padding: "10px 14px 10px 38px",
                    background: "#f0f2f5",
                    border: "1px solid #e9edef",
                    borderRadius: "8px",
                    fontSize: "13.5px",
                    color: "#111b21",
                    outline: "none",
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: "10px",
                width: "100%",
                padding: "12px",
                background: "#00a884",
                color: "#ffffff",
                border: "none",
                borderRadius: "999px",
                fontSize: "14px",
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                boxShadow: "0 3px 10px rgba(0, 168, 132, 0.3)",
                transition: "all 0.15s ease",
              }}
            >
              {loading ? (
                <Loader2 style={{ width: "18px", height: "18px", animation: "spin 1s linear infinite" }} />
              ) : (
                <>
                  <span>{mode === "login" ? "Sign In to Dashboard" : "Create Account"}</span>
                  <ArrowRight style={{ width: "16px", height: "16px" }} />
                </>
              )}
            </button>
          </div>

          {/* Quick Demo Access Divider */}
          <div style={{
            position: "relative",
            margin: "24px 0 18px",
            textAlign: "center",
          }}>
            <div style={{ position: "absolute", left: 0, right: 0, top: "50%", borderTop: "1px solid #e9edef" }} />
            <span style={{
              position: "relative",
              background: "#ffffff",
              padding: "0 12px",
              fontSize: "11.5px",
              color: "#8696a0",
              fontWeight: 600,
              textTransform: "uppercase",
            }}>
              Or Instant Demo Access
            </span>
          </div>

          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={loading}
            style={{
              width: "100%",
              padding: "10px",
              background: "#f0f2f5",
              color: "#111b21",
              border: "1px solid #e2e8f0",
              borderRadius: "999px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              transition: "all 0.15s ease",
            }}
          >
            <Sparkles style={{ width: "15px", height: "15px", color: "#00a884" }} />
            1-Click Demo Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
