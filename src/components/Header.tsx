"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, Smartphone, User, LogOut, ChevronDown, LogIn, UserPlus } from "lucide-react";
import { ApiClient } from "@/lib/api";

export default function Header() {
  const router = useRouter();
  const [auth, setAuth] = useState<{ user: any; organization: any } | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function loadAuth() {
      const current = ApiClient.getAuth();
      if (current) {
        setAuth({ user: current.user, organization: current.organization });
      } else {
        ApiClient.ensureAuth().then(() => {
          const recheck = ApiClient.getAuth();
          if (recheck) setAuth({ user: recheck.user, organization: recheck.organization });
        });
      }
    }
    loadAuth();

    async function checkInstances() {
      try {
        const instances: any = await ApiClient.request("/api/v1/whatsapp/instances").catch(() => []);
        setIsConnected(instances && instances.some((i: any) => i.status === "CONNECTED"));
      } catch {
        setIsConnected(false);
      }
    }
    checkInstances();
    const interval = setInterval(checkInstances, 10000);

    // Close dropdown on outside click
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      clearInterval(interval);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  function handleLogout() {
    ApiClient.clearAuth();
    setAuth(null);
    setShowDropdown(false);
    router.push("/login");
  }

  return (
    <header style={{
      height: '64px',
      borderBottom: '1px solid #e9edef',
      background: '#ffffff',
      padding: '0 32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 30,
      marginLeft: '240px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.02)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Org badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          fontSize: '12.5px',
          fontWeight: 600,
          color: '#111b21',
        }}>
          <Building2 style={{ height: '14px', width: '14px', color: '#00a884' }} />
          <span>{auth?.organization?.name || "My Business"}</span>
          <span style={{
            fontSize: '10.5px',
            fontWeight: 700,
            background: 'rgba(0, 168, 132, 0.12)',
            color: '#008069',
            padding: '2px 7px',
            borderRadius: '5px',
          }}>
            {auth?.organization?.role || "OWNER"}
          </span>
        </div>

        {/* WhatsApp Link status pill */}
        <a
          href="/whatsapp"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 13px',
            background: isConnected ? '#e7f7f3' : '#fffbeb',
            border: isConnected ? '1px solid rgba(0, 168, 132, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 600,
            color: isConnected ? '#008069' : '#b45309',
            textDecoration: 'none',
            transition: 'all 0.15s ease',
          }}
        >
          <Smartphone style={{ height: '13px', width: '13px' }} />
          <span>{isConnected ? "WhatsApp Engine Active" : "WhatsApp Not Connected"}</span>
        </a>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }} ref={dropdownRef}>
        {auth ? (
          /* User Profile with Dropdown */
          <div style={{ position: "relative" }}>
            <button
              type="button"
              onClick={() => setShowDropdown(!showDropdown)}
              style={{
                background: "transparent",
                border: "none",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                cursor: "pointer",
                padding: "4px 8px",
                borderRadius: "8px",
                transition: "background 0.15s ease",
              }}
            >
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: '#e7f7f3',
                border: '1px solid rgba(0, 168, 132, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#008069',
                fontWeight: 700,
                fontSize: '13px',
              }}>
                {auth?.user?.full_name ? auth.user.full_name.charAt(0).toUpperCase() : <User style={{ width: '16px', height: '16px' }} />}
              </div>
              <div style={{ textAlign: "left" }}>
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#111b21', lineHeight: 1.2 }}>
                  {auth?.user?.full_name || "User Account"}
                </p>
                <p style={{ fontSize: '11px', color: '#667781', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {auth?.user?.email || "user@business.com"}
                </p>
              </div>
              <ChevronDown style={{ width: '14px', height: '14px', color: '#8696a0' }} />
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div style={{
                position: "absolute",
                right: 0,
                top: "115%",
                width: "220px",
                background: "#ffffff",
                border: "1px solid #e9edef",
                borderRadius: "12px",
                boxShadow: "0 10px 30px rgba(11,20,26,0.1)",
                padding: "8px",
                zIndex: 50,
              }}>
                <div style={{ padding: "8px 12px", borderBottom: "1px solid #f0f2f5", marginBottom: "6px" }}>
                  <p style={{ fontSize: "11.5px", fontWeight: 700, color: "#8696a0", textTransform: "uppercase" }}>
                    Signed in as
                  </p>
                  <p style={{ fontSize: "13px", fontWeight: 600, color: "#111b21", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {auth?.user?.email}
                  </p>
                </div>

                <a
                  href="/login"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 12px",
                    fontSize: "12.5px",
                    color: "#54656f",
                    borderRadius: "6px",
                    textDecoration: "none",
                  }}
                >
                  <UserPlus style={{ width: "14px", height: "14px" }} />
                  Switch Account
                </a>

                <button
                  type="button"
                  onClick={handleLogout}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 12px",
                    fontSize: "12.5px",
                    fontWeight: 600,
                    color: "#dc2626",
                    background: "#fef2f2",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    marginTop: "4px",
                  }}
                >
                  <LogOut style={{ width: "14px", height: "14px" }} />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link
            href="/login"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 16px",
              background: "#00a884",
              color: "#ffffff",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            <LogIn style={{ width: "14px", height: "14px" }} />
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
}

