"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Send,
  CheckCircle2,
  Clock,
  QrCode,
  FolderArchive,
  History,
  ArrowUpRight,
  Wifi,
  WifiOff,
  Sparkles,
} from "lucide-react";
import { ApiClient } from "@/lib/api";

export default function DashboardPage() {
  const [metrics, setMetrics] = useState({
    total_contacts: 0,
    messages_sent: 0,
    messages_delivered: 0,
    messages_failed: 0,
    scheduled_campaigns: 0,
    completed_campaigns: 0,
  });
  const [waConnected, setWaConnected] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        await ApiClient.ensureAuth();
        const [dashMetrics, contacts, campaigns, instances] = await Promise.all([
          ApiClient.request("/api/v1/analytics/dashboard").catch(() => null),
          ApiClient.request("/api/v1/contacts").catch(() => []),
          ApiClient.request("/api/v1/campaigns").catch(() => []),
          ApiClient.request("/api/v1/whatsapp/instances").catch(() => []),
        ]);

        const totalContacts = Array.isArray(contacts) ? contacts.length : (dashMetrics?.total_contacts || 0);
        const campList = Array.isArray(campaigns) ? campaigns : [];
        const scheduled = campList.filter((c: any) => c.status === "SCHEDULED" || c.status === "QUEUED").length;
        const completed = campList.filter((c: any) => c.status === "COMPLETED").length;
        const isConn = Array.isArray(instances) && instances.some((i: any) => i.status === "CONNECTED");

        setWaConnected(isConn);
        setMetrics({
          total_contacts: totalContacts,
          messages_sent: dashMetrics?.messages_sent || 0,
          messages_delivered: dashMetrics?.messages_delivered || 0,
          messages_failed: dashMetrics?.messages_failed || 0,
          scheduled_campaigns: scheduled,
          completed_campaigns: completed,
        });
      } catch (err) {
        console.error("Dashboard metrics load error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const deliveryRate = metrics.messages_sent > 0
    ? Math.round((metrics.messages_delivered / metrics.messages_sent) * 100)
    : 100;

  const statCards = [
    {
      label: "Total Contacts",
      value: metrics.total_contacts.toLocaleString(),
      subtext: "Ready for broadcast",
      icon: Users,
      color: "#00a884",
      bgLight: "#e7f7f3",
      link: "/send",
    },
    {
      label: "Messages Sent",
      value: metrics.messages_sent.toLocaleString(),
      subtext: `${deliveryRate}% Delivery Rate`,
      icon: Send,
      color: "#0284c7",
      bgLight: "#e0f2fe",
      link: "/history",
    },
    {
      label: "Delivered Messages",
      value: metrics.messages_delivered.toLocaleString(),
      subtext: `${metrics.messages_failed} Failed`,
      icon: CheckCircle2,
      color: "#16a34a",
      bgLight: "#dcfce7",
      link: "/history",
    },
    {
      label: "Scheduled Campaigns",
      value: metrics.scheduled_campaigns.toString(),
      subtext: `${metrics.completed_campaigns} Completed`,
      icon: Clock,
      color: "#7c3aed",
      bgLight: "#f3e8ff",
      link: "/history",
    },
  ];

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
      {/* Header Banner */}
      <div style={{
        background: "#ffffff",
        border: "1px solid #e9edef",
        borderRadius: "16px",
        padding: "24px 28px",
        marginBottom: "24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#111b21", letterSpacing: "-0.01em" }}>
              Welcome back to AutoChat
            </h1>
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              background: "#e7f7f3",
              color: "#008069",
              padding: "2px 8px",
              borderRadius: "6px",
              fontSize: "11px",
              fontWeight: 700,
            }}>
              <Sparkles style={{ width: "12px", height: "12px" }} />
              Live SaaS
            </span>
          </div>
          <p style={{ fontSize: "13.5px", color: "#54656f" }}>
            Your central control center for WhatsApp broadcasts, instant chat automation, and templates.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <a
            href="/whatsapp"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "9px 16px",
              background: waConnected ? "#e7f7f3" : "#fffbeb",
              color: waConnected ? "#008069" : "#b45309",
              border: waConnected ? "1px solid rgba(0, 168, 132, 0.3)" : "1px solid rgba(245, 158, 11, 0.3)",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            {waConnected ? <Wifi style={{ width: "15px", height: "15px" }} /> : <WifiOff style={{ width: "15px", height: "15px" }} />}
            <span>{waConnected ? "WhatsApp Engine Connected" : "Connect WhatsApp Account"}</span>
          </a>

          <a
            href="/send"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "9px 18px",
              background: "#00a884",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 600,
              textDecoration: "none",
              boxShadow: "0 2px 8px rgba(0, 168, 132, 0.25)",
            }}
          >
            <Send style={{ width: "14px", height: "14px" }} />
            <span>Send Broadcast</span>
          </a>
        </div>
      </div>

      {/* 4 Numbers / Metric Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: "18px",
        marginBottom: "28px",
      }}>
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <a
              key={card.label}
              href={card.link}
              style={{
                background: "#ffffff",
                border: "1px solid #e9edef",
                borderRadius: "14px",
                padding: "20px 22px",
                textDecoration: "none",
                display: "block",
                boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "#cbd5e1";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 16px rgba(0,0,0,0.06)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "#e9edef";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 6px rgba(0,0,0,0.03)";
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                <div style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "10px",
                  background: card.bgLight,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: card.color,
                }}>
                  <Icon style={{ width: "20px", height: "20px" }} />
                </div>
                <ArrowUpRight style={{ width: "16px", height: "16px", color: "#8696a0" }} />
              </div>
              <p style={{ fontSize: "28px", fontWeight: 800, color: "#111b21", letterSpacing: "-0.02em", marginBottom: "2px" }}>
                {loading ? "..." : card.value}
              </p>
              <p style={{ fontSize: "13.5px", fontWeight: 600, color: "#111b21" }}>{card.label}</p>
              <p style={{ fontSize: "12px", color: "#667781", marginTop: "2px" }}>{card.subtext}</p>
            </a>
          );
        })}
      </div>

      {/* Quick Launchpad Navigation */}
      <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#111b21", marginBottom: "14px" }}>
        Quick Navigation
      </h2>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        gap: "18px",
      }}>
        {/* Connect WhatsApp */}
        <a
          href="/whatsapp"
          style={{
            background: "#ffffff",
            border: "1px solid #e9edef",
            borderRadius: "14px",
            padding: "20px",
            textDecoration: "none",
            display: "flex",
            alignItems: "flex-start",
            gap: "16px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "#00a884";
            (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 16px rgba(0, 168, 132, 0.1)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "#e9edef";
            (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 6px rgba(0,0,0,0.03)";
          }}
        >
          <div style={{
            width: "44px",
            height: "44px",
            borderRadius: "10px",
            background: "#e7f7f3",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#00a884",
            flexShrink: 0,
          }}>
            <QrCode style={{ width: "22px", height: "22px" }} />
          </div>
          <div>
            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#111b21", marginBottom: "4px" }}>
              Connect WhatsApp
            </h3>
            <p style={{ fontSize: "12.5px", color: "#54656f", lineHeight: 1.4 }}>
              Scan QR code to link your phone and chat in live 2-panel view.
            </p>
          </div>
        </a>

        {/* Send Messages */}
        <a
          href="/send"
          style={{
            background: "#ffffff",
            border: "1px solid #e9edef",
            borderRadius: "14px",
            padding: "20px",
            textDecoration: "none",
            display: "flex",
            alignItems: "flex-start",
            gap: "16px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "#00a884";
            (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 16px rgba(0, 168, 132, 0.1)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "#e9edef";
            (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 6px rgba(0,0,0,0.03)";
          }}
        >
          <div style={{
            width: "44px",
            height: "44px",
            borderRadius: "10px",
            background: "#e0f2fe",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#0284c7",
            flexShrink: 0,
          }}>
            <Send style={{ width: "22px", height: "22px" }} />
          </div>
          <div>
            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#111b21", marginBottom: "4px" }}>
              Send Messages
            </h3>
            <p style={{ fontSize: "12.5px", color: "#54656f", lineHeight: 1.4 }}>
              Upload contact lists from Excel/CSV and broadcast text or media.
            </p>
          </div>
        </a>

        {/* Asset Store */}
        <a
          href="/store"
          style={{
            background: "#ffffff",
            border: "1px solid #e9edef",
            borderRadius: "14px",
            padding: "20px",
            textDecoration: "none",
            display: "flex",
            alignItems: "flex-start",
            gap: "16px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "#00a884";
            (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 16px rgba(0, 168, 132, 0.1)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "#e9edef";
            (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 6px rgba(0,0,0,0.03)";
          }}
        >
          <div style={{
            width: "44px",
            height: "44px",
            borderRadius: "10px",
            background: "#fef3c7",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#d97706",
            flexShrink: 0,
          }}>
            <FolderArchive style={{ width: "22px", height: "22px" }} />
          </div>
          <div>
            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#111b21", marginBottom: "4px" }}>
              Asset Store
            </h3>
            <p style={{ fontSize: "12.5px", color: "#54656f", lineHeight: 1.4 }}>
              Manage saved message templates, promo photos, and PDFs.
            </p>
          </div>
        </a>

        {/* History */}
        <a
          href="/history"
          style={{
            background: "#ffffff",
            border: "1px solid #e9edef",
            borderRadius: "14px",
            padding: "20px",
            textDecoration: "none",
            display: "flex",
            alignItems: "flex-start",
            gap: "16px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "#00a884";
            (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 16px rgba(0, 168, 132, 0.1)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "#e9edef";
            (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 6px rgba(0,0,0,0.03)";
          }}
        >
          <div style={{
            width: "44px",
            height: "44px",
            borderRadius: "10px",
            background: "#f3e8ff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#7c3aed",
            flexShrink: 0,
          }}>
            <History style={{ width: "22px", height: "22px" }} />
          </div>
          <div>
            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#111b21", marginBottom: "4px" }}>
              Campaign History
            </h3>
            <p style={{ fontSize: "12.5px", color: "#54656f", lineHeight: 1.4 }}>
              Review sent broadcast logs, delivery metrics, and upcoming schedules.
            </p>
          </div>
        </a>
      </div>
    </div>
  );
}
