"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  QrCode,
  Send,
  FolderArchive,
  History,
  MessageSquareCode,
  Wifi,
  WifiOff,
} from "lucide-react";
import { ApiClient } from "@/lib/api";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Connect WhatsApp", href: "/whatsapp", icon: QrCode },
  { name: "Send Messages", href: "/send", icon: Send },
  { name: "Store", href: "/store", icon: FolderArchive },
  { name: "History", href: "/history", icon: History },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [waConnected, setWaConnected] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkStatus() {
      try {
        await ApiClient.ensureAuth();
        const instances: any = await ApiClient.request("/api/v1/whatsapp/instances").catch(() => []);
        const isConn = instances && instances.some((i: any) => i.status === "CONNECTED");
        setWaConnected(isConn);
      } catch {
        setWaConnected(false);
      }
    }
    checkStatus();
    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <aside style={{
      width: '240px',
      background: '#ffffff',
      borderRight: '1px solid #e9edef',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'fixed',
      left: 0,
      top: 0,
      zIndex: 40,
      boxShadow: '1px 0 10px rgba(0,0,0,0.03)',
    }}>
      {/* Brand Header */}
      <div style={{
        height: '64px',
        padding: '0 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        borderBottom: '1px solid #e9edef',
      }}>
        <div style={{
          height: '36px',
          width: '36px',
          borderRadius: '10px',
          background: '#00a884',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 2px 8px rgba(0, 168, 132, 0.3)',
        }}>
          <MessageSquareCode style={{ height: '20px', width: '20px', color: '#fff' }} />
        </div>
        <div>
          <h1 style={{ fontSize: '15px', fontWeight: 700, color: '#111b21', letterSpacing: '-0.01em' }}>
            AutoChat <span style={{ fontSize: '10px', fontWeight: 700, background: 'rgba(0, 168, 132, 0.12)', color: '#008069', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(0,168,132,0.25)', marginLeft: '2px' }}>PRO</span>
          </h1>
          <p style={{ fontSize: '11px', color: '#667781', marginTop: '1px' }}>WhatsApp Platform</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
        <div style={{ padding: '0 8px 10px', fontSize: '11px', fontWeight: 700, color: '#8696a0', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Menu
        </div>
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                borderRadius: '9px',
                fontSize: '13.5px',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? '#ffffff' : '#54656f',
                background: isActive ? '#00a884' : 'transparent',
                textDecoration: 'none',
                marginBottom: '4px',
                boxShadow: isActive ? '0 2px 8px rgba(0, 168, 132, 0.25)' : 'none',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = '#f0f2f5';
                  (e.currentTarget as HTMLElement).style.color = '#111b21';
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                  (e.currentTarget as HTMLElement).style.color = '#54656f';
                }
              }}
            >
              <Icon style={{ height: '17px', width: '17px', color: isActive ? '#ffffff' : '#54656f' }} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Connection Status Footer */}
      <div style={{ padding: '14px 16px', borderTop: '1px solid #e9edef', background: '#f8fafc' }}>
        <Link
          href="/whatsapp"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 12px',
            background: '#ffffff',
            borderRadius: '9px',
            border: '1px solid #e9edef',
            textDecoration: 'none',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            transition: 'all 0.15s ease',
          }}
        >
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: waConnected ? '#00a884' : '#f59e0b',
            boxShadow: waConnected ? '0 0 6px rgba(0,168,132,0.8)' : 'none',
            flexShrink: 0,
          }} />
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <p style={{ fontSize: '12px', fontWeight: 600, color: '#111b21', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {waConnected ? "WhatsApp Engine Active" : "WhatsApp Disconnected"}
            </p>
            <p style={{ fontSize: '10.5px', color: '#667781' }}>
              {waConnected ? "Session linked" : "Click to link QR"}
            </p>
          </div>
        </Link>
      </div>
    </aside>
  );
}
