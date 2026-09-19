"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  History,
  Calendar,
  CheckCircle2,
  Clock,
  Send,
  XCircle,
  AlertCircle,
  Play,
  RotateCcw,
  Loader2,
  Trash2,
  Eye,
  FileText,
  X,
  AlertTriangle,
  Image as ImageIcon,
  File as FileIcon,
  Download,
  Search,
  CheckCheck,
  Percent,
} from "lucide-react";
import { ApiClient } from "@/lib/api";

export default function HistoryPage() {
  const [activeTab, setActiveTab] = useState<"completed" | "scheduled">("completed");
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Audit Modal State
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [campaignDetail, setCampaignDetail] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [recipientFilter, setRecipientFilter] = useState<"all" | "sent" | "failed">("all");
  const [retryingFailed, setRetryingFailed] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    setLoading(true);
    try {
      await ApiClient.ensureAuth();
      const list: any = await ApiClient.request("/api/v1/campaigns").catch(() => []);
      setCampaigns(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setLoading(false);
    }
  }

  async function openDetailModal(campaignId: string) {
    setSelectedCampaignId(campaignId);
    setDetailLoading(true);
    setRecipientFilter("all");
    try {
      const data = await ApiClient.request(`/api/v1/campaigns/${campaignId}`);
      setCampaignDetail(data);
    } catch (err) {
      console.error("Failed to load campaign detail:", err);
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleRetryFailed(campaignId: string) {
    setRetryingFailed(true);
    try {
      const res: any = await ApiClient.request(`/api/v1/campaigns/${campaignId}/retry-failed`, {
        method: "POST",
      });
      alert(res.message || "Failed recipients queued for retry!");
      openDetailModal(campaignId);
      loadHistory();
    } catch (err: any) {
      alert(err.message || "Failed to retry campaign");
    } finally {
      setRetryingFailed(false);
    }
  }

  async function handleSendNow(campaignId: string) {
    setActionLoading(campaignId);
    try {
      await ApiClient.request(`/api/v1/campaigns/${campaignId}/send-now`, { method: "POST" });
      loadHistory();
    } catch (err: any) {
      alert(err.message || "Failed to dispatch campaign");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCancel(campaignId: string) {
    if (!confirm("Are you sure you want to cancel this scheduled campaign?")) return;
    setActionLoading(campaignId);
    try {
      await ApiClient.request(`/api/v1/campaigns/${campaignId}/cancel`, { method: "POST" });
      loadHistory();
    } catch (err: any) {
      alert(err.message || "Failed to cancel campaign");
    } finally {
      setActionLoading(null);
    }
  }

  function exportAuditCsv() {
    if (!campaignDetail || !campaignDetail.recipients) return;
    const headers = ["Name", "Phone", "Status", "Sent At", "Error Reason"];
    const rows = campaignDetail.recipients.map((r: any) => [
      `"${r.name.replace(/"/g, '""')}"`,
      `"${r.phone}"`,
      `"${r.status}"`,
      `"${r.sent_at || ""}"`,
      `"${(r.error_message || "").replace(/"/g, '""')}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e: any) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `audit_${campaignDetail.name.replace(/\s+/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Calculated KPI metrics
  const completedCampaigns = campaigns.filter(c => c.status === "COMPLETED" || c.status === "RUNNING" || c.status === "CANCELLED" || c.status === "FAILED");
  const scheduledCampaigns = campaigns.filter(c => c.status === "SCHEDULED" || c.status === "QUEUED" || c.status === "DRAFT");

  const totalDelivered = completedCampaigns.reduce((acc, c) => acc + (c.sent_count || 0), 0);
  const totalFailed = completedCampaigns.reduce((acc, c) => acc + (c.failed_count || 0), 0);
  const totalProcessed = totalDelivered + totalFailed;
  const successRate = totalProcessed > 0 ? Math.round((totalDelivered / totalProcessed) * 100) : 100;

  const filteredCompleted = completedCampaigns.filter(c => 
    !searchQuery.trim() || c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredRecipients = campaignDetail?.recipients ? campaignDetail.recipients.filter((r: any) => {
    if (recipientFilter === "sent") return r.status === "SENT" || r.status === "DELIVERED";
    if (recipientFilter === "failed") return r.status === "FAILED";
    return true;
  }) : [];

  return (
    <div style={{ maxWidth: '1140px', margin: '0 auto', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Top Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px',
      }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#111b21', letterSpacing: '-0.01em' }}>
            Broadcast History & Audit
          </h1>
          <p style={{ fontSize: '13.5px', color: '#54656f', marginTop: '2px' }}>
            Detailed audit logs of dispatched campaigns, recipient error tracking, and scheduling management.
          </p>
        </div>

        <Link
          href="/send"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            background: '#00a884',
            color: '#fff',
            borderRadius: '8px',
            fontWeight: 600,
            fontSize: '13px',
            textDecoration: 'none',
            boxShadow: '0 2px 8px rgba(0, 168, 132, 0.25)',
          }}
        >
          <Send style={{ width: '14px', height: '14px' }} />
          <span>New Broadcast</span>
        </Link>
      </div>

      {/* KPI METRIC CARDS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '14px',
        marginBottom: '24px',
      }}>
        <div style={{ background: '#ffffff', border: '1px solid #e9edef', borderRadius: '12px', padding: '16px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <p style={{ fontSize: '12px', color: '#667781', fontWeight: 600, textTransform: 'uppercase' }}>Total Broadcasts</p>
          <p style={{ fontSize: '22px', fontWeight: 800, color: '#111b21', marginTop: '4px' }}>{completedCampaigns.length}</p>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e9edef', borderRadius: '12px', padding: '16px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <p style={{ fontSize: '12px', color: '#667781', fontWeight: 600, textTransform: 'uppercase' }}>Delivered Messages</p>
          <p style={{ fontSize: '22px', fontWeight: 800, color: '#16a34a', marginTop: '4px' }}>{totalDelivered}</p>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e9edef', borderRadius: '12px', padding: '16px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <p style={{ fontSize: '12px', color: '#667781', fontWeight: 600, textTransform: 'uppercase' }}>Success Rate</p>
          <p style={{ fontSize: '22px', fontWeight: 800, color: successRate >= 90 ? '#008069' : '#d97706', marginTop: '4px' }}>{successRate}%</p>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e9edef', borderRadius: '12px', padding: '16px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <p style={{ fontSize: '12px', color: '#667781', fontWeight: 600, textTransform: 'uppercase' }}>Failed Deliveries</p>
          <p style={{ fontSize: '22px', fontWeight: 800, color: totalFailed > 0 ? '#dc2626' : '#8696a0', marginTop: '4px' }}>{totalFailed}</p>
        </div>
      </div>

      {/* Tabs Filter & Search Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #e9edef',
        paddingBottom: '14px',
        marginBottom: '20px',
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setActiveTab("completed")}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              background: activeTab === "completed" ? '#00a884' : '#ffffff',
              color: activeTab === "completed" ? '#fff' : '#54656f',
              border: activeTab === "completed" ? 'none' : '1px solid #e2e8f0',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            Completed Broadcasts ({completedCampaigns.length})
          </button>

          <button
            onClick={() => setActiveTab("scheduled")}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              background: activeTab === "scheduled" ? '#00a884' : '#ffffff',
              color: activeTab === "scheduled" ? '#fff' : '#54656f',
              border: activeTab === "scheduled" ? 'none' : '1px solid #e2e8f0',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            Scheduled Events ({scheduledCampaigns.length})
          </button>
        </div>

        {activeTab === "completed" && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '6px 12px',
            width: '260px',
          }}>
            <Search style={{ width: '14px', height: '14px', color: '#8696a0' }} />
            <input
              type="text"
              placeholder="Search campaigns..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '13px',
                color: '#111b21',
                width: '100%',
              }}
            />
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#8696a0' }}>
          <Loader2 style={{ width: '32px', height: '32px', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
          <p>Loading broadcast logs...</p>
        </div>
      ) : activeTab === "completed" ? (
        /* COMPLETED BROADCASTS TABLE */
        <div>
          {filteredCompleted.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: '#ffffff', borderRadius: '16px', border: '1px solid #e9edef' }}>
              <History style={{ width: '40px', height: '40px', color: '#8696a0', margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#111b21', marginBottom: '6px' }}>
                No completed broadcasts found
              </h3>
              <p style={{ fontSize: '13px', color: '#54656f', marginBottom: '18px' }}>
                Once you launch messages from the Send page, complete recipient audit logs will appear here.
              </p>
              <Link
                href="/send"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 18px',
                  background: '#00a884',
                  color: '#fff',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                Start First Broadcast
              </Link>
            </div>
          ) : (
            <div style={{
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e9edef',
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e9edef', color: '#54656f' }}>
                    <th style={{ padding: '14px 18px', fontWeight: 600 }}>Campaign Name</th>
                    <th style={{ padding: '14px 18px', fontWeight: 600 }}>Recipients</th>
                    <th style={{ padding: '14px 18px', fontWeight: 600 }}>Delivered</th>
                    <th style={{ padding: '14px 18px', fontWeight: 600 }}>Failed</th>
                    <th style={{ padding: '14px 18px', fontWeight: 600 }}>Status</th>
                    <th style={{ padding: '14px 18px', fontWeight: 600 }}>Dispatched At</th>
                    <th style={{ padding: '14px 18px', fontWeight: 600, textAlign: 'right' }}>Audit Logs</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCompleted.map(c => (
                    <tr
                      key={c.id}
                      style={{ borderBottom: '1px solid #f0f2f5', color: '#111b21', cursor: 'pointer', transition: 'background 0.15s ease' }}
                      onClick={() => openDetailModal(c.id)}
                    >
                      <td style={{ padding: '14px 18px', fontWeight: 700 }}>
                        {c.name}
                      </td>
                      <td style={{ padding: '14px 18px' }}>{c.total_recipients || c.total_contacts || 0}</td>
                      <td style={{ padding: '14px 18px', color: '#16a34a', fontWeight: 600 }}>
                        {c.sent_count || 0}
                      </td>
                      <td style={{ padding: '14px 18px', color: c.failed_count > 0 ? '#dc2626' : '#8696a0', fontWeight: c.failed_count > 0 ? 700 : 400 }}>
                        {c.failed_count || 0}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{
                          padding: '3px 10px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 700,
                          background: c.status === "COMPLETED" && (c.failed_count || 0) === 0 ? '#dcfce7' : c.status === "FAILED" || (c.failed_count || 0) > 0 ? '#fee2e2' : '#e0f2fe',
                          color: c.status === "COMPLETED" && (c.failed_count || 0) === 0 ? '#16a34a' : c.status === "FAILED" || (c.failed_count || 0) > 0 ? '#dc2626' : '#0284c7',
                        }}>
                          {c.status}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px', color: '#667781', fontSize: '12px' }}>
                        {c.created_at ? new Date(c.created_at).toLocaleString([], { dateStyle: "short", timeStyle: "short" }) : "—"}
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openDetailModal(c.id);
                          }}
                          style={{
                            padding: '6px 12px',
                            background: '#f0f2f5',
                            border: '1px solid #d1d7db',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 600,
                            color: '#111b21',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Eye style={{ width: '13px', height: '13px' }} />
                          View Audit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* SCHEDULED BROADCASTS TABLE */
        <div>
          {scheduledCampaigns.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: '#ffffff', borderRadius: '16px', border: '1px solid #e9edef' }}>
              <Clock style={{ width: '40px', height: '40px', color: '#8696a0', margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#111b21', marginBottom: '6px' }}>
                No scheduled broadcasts
              </h3>
              <p style={{ fontSize: '13px', color: '#54656f' }}>
                When scheduling future broadcasts in the Send page, they will appear here with instant dispatch and cancel controls.
              </p>
            </div>
          ) : (
            <div style={{
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e9edef',
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e9edef', color: '#54656f' }}>
                    <th style={{ padding: '14px 18px', fontWeight: 600 }}>Campaign Name</th>
                    <th style={{ padding: '14px 18px', fontWeight: 600 }}>Recipients</th>
                    <th style={{ padding: '14px 18px', fontWeight: 600 }}>Scheduled For</th>
                    <th style={{ padding: '14px 18px', fontWeight: 600 }}>Status</th>
                    <th style={{ padding: '14px 18px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {scheduledCampaigns.map(c => (
                    <tr key={c.id} style={{ borderBottom: '1px solid #f0f2f5', color: '#111b21' }}>
                      <td style={{ padding: '14px 18px', fontWeight: 700 }}>
                        {c.name}
                      </td>
                      <td style={{ padding: '14px 18px' }}>{c.total_recipients || c.total_contacts || 0}</td>
                      <td style={{ padding: '14px 18px', color: '#7c3aed', fontWeight: 600 }}>
                        {c.scheduled_at ? new Date(c.scheduled_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "Queue Pending"}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{
                          padding: '3px 10px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 700,
                          background: '#fef3c7',
                          color: '#b45309',
                        }}>
                          {c.status}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                          <button
                            onClick={() => handleSendNow(c.id)}
                            disabled={actionLoading === c.id}
                            style={{
                              padding: '6px 12px',
                              background: '#00a884',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <Play style={{ width: '12px', height: '12px' }} />
                            Send Now
                          </button>

                          <button
                            onClick={() => handleCancel(c.id)}
                            disabled={actionLoading === c.id}
                            style={{
                              padding: '6px 12px',
                              background: '#fef2f2',
                              color: '#dc2626',
                              border: '1px solid #fecaca',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Campaign Recipient Audit Details Modal */}
      {selectedCampaignId && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(11, 20, 26, 0.65)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={() => setSelectedCampaignId(null)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '720px',
              maxHeight: '88vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid #e9edef',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#111b21' }}>
                    {campaignDetail ? campaignDetail.name : "Broadcast Audit Details"}
                  </h3>
                  {campaignDetail?.message_type && (
                    <span style={{
                      fontSize: '10.5px',
                      fontWeight: 700,
                      padding: '2px 7px',
                      borderRadius: '5px',
                      background: campaignDetail.message_type === "IMAGE" ? '#dbeafe' : (campaignDetail.message_type === "DOCUMENT" ? '#ffedd5' : '#f0fdf4'),
                      color: campaignDetail.message_type === "IMAGE" ? '#1d4ed8' : (campaignDetail.message_type === "DOCUMENT" ? '#c2410c' : '#15803d'),
                    }}>
                      {campaignDetail.message_type}
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '12px', color: '#667781', marginTop: '2px' }}>
                  {campaignDetail
                    ? `Dispatched: ${campaignDetail.sent_count} delivered • ${campaignDetail.failed_count} failed • Speed: ${campaignDetail.rate_limit_per_second || 1} msg/s`
                    : "Loading campaign metrics..."}
                </p>
              </div>
              <button
                onClick={() => setSelectedCampaignId(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#667781' }}
              >
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
              {detailLoading ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#8696a0' }}>
                  <Loader2 style={{ width: '28px', height: '28px', animation: 'spin 1s linear infinite', margin: '0 auto 8px' }} />
                  <p style={{ fontSize: '13px' }}>Loading recipient audit logs...</p>
                </div>
              ) : campaignDetail ? (
                <div>
                  {/* Message Content Banner */}
                  {(campaignDetail.message_content || campaignDetail.media_url) && (
                    <div style={{
                      background: '#f8fafc',
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0',
                      padding: '12px 14px',
                      marginBottom: '18px',
                    }}>
                      <p style={{ fontSize: '11px', color: '#667781', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                        Message Dispatched:
                      </p>
                      {campaignDetail.media_url && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <span style={{ fontSize: '11.5px', color: '#008069', fontWeight: 600 }}>
                            📎 Attachment: {campaignDetail.media_url.split('/').pop()}
                          </span>
                        </div>
                      )}
                      {campaignDetail.message_content && (
                        <p style={{ fontSize: '12.5px', color: '#111b21', whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>
                          {campaignDetail.message_content}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Recipient Filter Tabs & Export */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {[
                        { id: "all", label: `All (${campaignDetail.recipients?.length || 0})` },
                        { id: "sent", label: `Delivered (${campaignDetail.sent_count || 0})` },
                        { id: "failed", label: `Failed (${campaignDetail.failed_count || 0})` },
                      ].map(tab => (
                        <button
                          key={tab.id}
                          onClick={() => setRecipientFilter(tab.id as any)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            background: recipientFilter === tab.id ? '#00a884' : '#ffffff',
                            color: recipientFilter === tab.id ? '#ffffff' : '#54656f',
                            fontSize: '11.5px',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={exportAuditCsv}
                      style={{
                        padding: '4px 10px',
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        color: '#111b21',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Download style={{ width: '12px', height: '12px' }} />
                      Export CSV
                    </button>
                  </div>

                  {filteredRecipients.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {filteredRecipients.map((rec: any) => (
                        <div
                          key={rec.id}
                          style={{
                            padding: '12px 14px',
                            borderRadius: '10px',
                            background: rec.status === "FAILED" ? '#fff5f5' : '#f8fafc',
                            border: `1px solid ${rec.status === "FAILED" ? '#fed7d7' : '#e2e8f0'}`,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                              <span style={{ fontSize: '13px', fontWeight: 700, color: '#111b21' }}>
                                {rec.name}
                              </span>
                              <span style={{ fontSize: '12px', color: '#667781', marginLeft: '8px' }}>
                                +{rec.phone}
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {rec.sent_at && (
                                <span style={{ fontSize: '11px', color: '#667781' }}>
                                  {new Date(rec.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </span>
                              )}
                              <span style={{
                                padding: '2px 8px',
                                borderRadius: '5px',
                                fontSize: '11px',
                                fontWeight: 700,
                                background: rec.status === "SENT" || rec.status === "DELIVERED" ? '#dcfce7' : '#fee2e2',
                                color: rec.status === "SENT" || rec.status === "DELIVERED" ? '#16a34a' : '#dc2626',
                              }}>
                                {rec.status}
                              </span>
                            </div>
                          </div>

                          {rec.error_message && (
                            <div style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '6px',
                              marginTop: '4px',
                              fontSize: '12px',
                              color: '#c53030',
                              background: '#fff',
                              padding: '6px 10px',
                              borderRadius: '6px',
                              border: '1px solid #feb2b2',
                            }}>
                              <AlertTriangle style={{ width: '14px', height: '14px', flexShrink: 0, marginTop: '2px' }} />
                              <span>{rec.error_message}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: '13px', color: '#8696a0', textAlign: 'center', padding: '24px 0' }}>
                      No recipients matching this filter.
                    </p>
                  )}
                </div>
              ) : (
                <p style={{ fontSize: '13px', color: '#8696a0' }}>Failed to load campaign detail.</p>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '14px 24px',
              borderTop: '1px solid #e9edef',
              background: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div>
                {campaignDetail && campaignDetail.failed_count > 0 && (
                  <button
                    onClick={() => handleRetryFailed(campaignDetail.id)}
                    disabled={retryingFailed}
                    style={{
                      padding: '8px 16px',
                      background: '#fee2e2',
                      color: '#dc2626',
                      border: '1px solid #fecaca',
                      borderRadius: '8px',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      cursor: retryingFailed ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <RotateCcw style={{ width: '13px', height: '13px', animation: retryingFailed ? 'spin 1s linear infinite' : 'none' }} />
                    <span>Retry {campaignDetail.failed_count} Failed Recipients</span>
                  </button>
                )}
              </div>

              <button
                onClick={() => setSelectedCampaignId(null)}
                style={{
                  padding: '8px 18px',
                  background: '#00a884',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
