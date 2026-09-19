"use client";

import React from "react";
import Link from "next/link";
import { LayoutDashboard, QrCode, Send, FolderArchive, History, HelpCircle, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div style={{
      maxWidth: "680px",
      margin: "60px auto",
      textAlign: "center",
      background: "#ffffff",
      padding: "48px 36px",
      borderRadius: "20px",
      border: "1px solid #e9edef",
      boxShadow: "0 8px 30px rgba(0,0,0,0.04)",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>
      <div style={{
        width: "64px",
        height: "64px",
        borderRadius: "50%",
        background: "#fee2e2",
        color: "#dc2626",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        margin: "0 auto 16px",
      }}>
        <HelpCircle style={{ width: "32px", height: "32px" }} />
      </div>

      <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#111b21", marginBottom: "8px" }}>
        Page Not Found (404)
      </h1>
      <p style={{ fontSize: "14px", color: "#54656f", lineHeight: 1.5, marginBottom: "28px" }}>
        The page you are looking for does not exist or has been moved. Use the quick navigation links below to continue:
      </p>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
        gap: "12px",
        marginBottom: "32px",
      }}>
        <Link
          href="/"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "8px",
            padding: "16px 12px",
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            color: "#111b21",
            textDecoration: "none",
            fontSize: "13px",
            fontWeight: 600,
            transition: "all 0.15s ease",
          }}
        >
          <LayoutDashboard style={{ width: "20px", height: "20px", color: "#00a884" }} />
          <span>Dashboard</span>
        </Link>

        <Link
          href="/whatsapp"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "8px",
            padding: "16px 12px",
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            color: "#111b21",
            textDecoration: "none",
            fontSize: "13px",
            fontWeight: 600,
            transition: "all 0.15s ease",
          }}
        >
          <QrCode style={{ width: "20px", height: "20px", color: "#00a884" }} />
          <span>Connect WhatsApp</span>
        </Link>

        <Link
          href="/send"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "8px",
            padding: "16px 12px",
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            color: "#111b21",
            textDecoration: "none",
            fontSize: "13px",
            fontWeight: 600,
            transition: "all 0.15s ease",
          }}
        >
          <Send style={{ width: "20px", height: "20px", color: "#0284c7" }} />
          <span>Send Messages</span>
        </Link>

        <Link
          href="/store"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "8px",
            padding: "16px 12px",
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            color: "#111b21",
            textDecoration: "none",
            fontSize: "13px",
            fontWeight: 600,
            transition: "all 0.15s ease",
          }}
        >
          <FolderArchive style={{ width: "20px", height: "20px", color: "#ea580c" }} />
          <span>Store</span>
        </Link>

        <Link
          href="/history"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "8px",
            padding: "16px 12px",
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            color: "#111b21",
            textDecoration: "none",
            fontSize: "13px",
            fontWeight: 600,
            transition: "all 0.15s ease",
          }}
        >
          <History style={{ width: "20px", height: "20px", color: "#7c3aed" }} />
          <span>History</span>
        </Link>
      </div>

      <Link
        href="/"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          padding: "10px 24px",
          background: "#00a884",
          color: "#ffffff",
          borderRadius: "999px",
          textDecoration: "none",
          fontSize: "13.5px",
          fontWeight: 700,
          boxShadow: "0 2px 8px rgba(0,168,132,0.3)",
        }}
      >
        <ArrowLeft style={{ width: "16px", height: "16px" }} />
        <span>Return to Dashboard</span>
      </Link>
    </div>
  );
}
