"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MessageSquareCode,
  Mail,
  Lock,
  User,
  Building2,
  ArrowRight,
  Loader2,
  Sparkles,
} from "lucide-react";
import { ApiClient } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function SignUpPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [orgName, setOrgName] = useState("");

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!fullName.trim()) throw new Error("Full name is required");
      const res = await fetch(`${API_BASE}/api/v1/auth/register`, {
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
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
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
            Create Your Account
          </h1>
          <p style={{ fontSize: "13px", color: "#54656f", marginTop: "4px" }}>
            Get started with AutoChat PRO for free
          </p>
        </div>

        <form onSubmit={handleRegister} style={{ padding: "28px 32px 32px" }}>
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
            }}>
              ⚠️ {error}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
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
                Company / Organization Name
              </label>
              <div style={{ position: "relative" }}>
                <Building2 style={{ position: "absolute", left: "14px", top: "11px", width: "16px", height: "16px", color: "#8696a0" }} />
                <input
                  type="text"
                  placeholder="e.g. Acme Enterprises"
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

            <div>
              <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "#111b21", marginBottom: "6px" }}>
                Email Address *
              </label>
              <div style={{ position: "relative" }}>
                <Mail style={{ position: "absolute", left: "14px", top: "11px", width: "16px", height: "16px", color: "#8696a0" }} />
                <input
                  type="email"
                  placeholder="name@company.com"
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
              }}
            >
              {loading ? (
                <Loader2 style={{ width: "18px", height: "18px", animation: "spin 1s linear infinite" }} />
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight style={{ width: "16px", height: "16px" }} />
                </>
              )}
            </button>

            <p style={{ textAlign: "center", fontSize: "13px", color: "#54656f", marginTop: "12px" }}>
              Already have an account?{" "}
              <Link href="/login" style={{ color: "#008069", fontWeight: 700, textDecoration: "none" }}>
                Sign In
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
