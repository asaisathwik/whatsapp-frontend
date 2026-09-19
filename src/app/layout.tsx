import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "WhatsApp AI SaaS Platform | AutoChat",
  description: "Enterprise WhatsApp Automation, Broadcast Campaigns, Asset Store & Live Connections",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body style={{ background: '#f0f2f5', color: '#111b21', minHeight: '100vh', display: 'flex', fontFamily: "'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif" }}>
        <Sidebar />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', minWidth: 0 }}>
          <Header />
          <main style={{ flex: 1, marginLeft: '240px', padding: '24px 32px', overflowY: 'auto', background: '#f0f2f5' }}>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
