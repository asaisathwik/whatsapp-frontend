"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  QrCode,
  CheckCircle2,
  RefreshCw,
  Smartphone,
  PowerOff,
  Wifi,
  ShieldCheck,
  Send,
  Loader2,
  AlertTriangle,
  Search,
  User,
  Paperclip,
  CheckCheck,
  Plus,
  MessageSquare,
  Sparkles,
  Phone,
  Image as ImageIcon,
  FileText,
  Laptop,
  MoreVertical,
  ExternalLink,
  MessageCircle,
  FileUp,
  UserPlus,
  HelpCircle,
  Check,
  File as FileIcon,
  X,
  Clock,
  ArrowRight,
  Download,
} from "lucide-react";
import { ApiClient, getApiBase } from "@/lib/api";
import { WhatsAppInstance } from "@/types";

export default function ConnectWhatsAppPage() {
  const [instance, setInstance] = useState<WhatsAppInstance | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrStatus, setQrStatus] = useState<string>("INITIALIZING");
  const [disconnecting, setDisconnecting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [qrTimer, setQrTimer] = useState(60);
  const [stayLoggedIn, setStayLoggedIn] = useState(true);

  // Live WhatsApp Chat State
  const [contacts, setContacts] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedContact, setSelectedContact] = useState<any | null>(null);
  const [activeConversation, setActiveConversation] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [attachedFilePreview, setAttachedFilePreview] = useState<string | null>(null);

  const [syncingChats, setSyncingChats] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [newChatPhone, setNewChatPhone] = useState("");
  const [newChatName, setNewChatName] = useState("");
  const [newChatFirstMsg, setNewChatFirstMsg] = useState("");
  const [creatingChat, setCreatingChat] = useState(false);

  // Preview / Lightbox modal for media
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);
  const messagePollRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    initWhatsApp();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (messagePollRef.current) clearInterval(messagePollRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // QR countdown timer (60s)
  useEffect(() => {
    if (qrCode && !isConnected) {
      setQrTimer(60);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setQrTimer((prev) => {
          if (prev <= 1) {
            handleRefreshQr();
            return 60;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [qrCode]);

  // Handle attached file preview
  useEffect(() => {
    if (attachedFile && attachedFile.type.startsWith("image/")) {
      const url = URL.createObjectURL(attachedFile);
      setAttachedFilePreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setAttachedFilePreview(null);
    }
  }, [attachedFile]);

  async function initWhatsApp() {
    try {
      await ApiClient.ensureAuth();
      const instances = await ApiClient.request<WhatsAppInstance[]>("/api/v1/whatsapp/instances").catch(() => []);
      
      let primary = instances && instances.length > 0 ? instances[0] : null;

      if (!primary) {
        primary = await ApiClient.request<WhatsAppInstance>("/api/v1/whatsapp/instances", {
          method: "POST",
          body: JSON.stringify({ instance_name: "primary", is_default: true }),
        }).catch(() => null);
      }

      if (primary) {
        setInstance(primary);
        if (primary.status === "CONNECTED") {
          setQrStatus("CONNECTED");
          setQrCode(null);
          loadChatData(primary);
          return;
        }
        setQrStatus("INITIALIZING");
        setQrCode(null);
        startQrPolling(primary.id);
      } else {
        setTimeout(() => initWhatsApp(), 2000);
      }
    } catch (err) {
      console.error("Failed to initialize WhatsApp connection:", err);
      setTimeout(() => initWhatsApp(), 3000);
    }
  }

  async function handleRefreshQr() {
    setRefreshing(true);
    setQrCode(null);
    setQrStatus("INITIALIZING");
    setQrTimer(60);
    try {
      if (instance) {
        await ApiClient.request(`/api/v1/whatsapp/instances/${instance.id}/restart`, { method: "POST" }).catch(() => {});
        startQrPolling(instance.id);
      } else {
        await initWhatsApp();
      }
    } catch (err) {
      console.error("Failed to refresh QR:", err);
    } finally {
      setTimeout(() => setRefreshing(false), 1000);
    }
  }

  function startQrPolling(instanceId: string) {
    if (pollRef.current) clearInterval(pollRef.current);

    let attempts = 0;
    const maxAttempts = 120;

    const poll = async () => {
      attempts++;
      try {
        if (!instanceId) return;
        const res: any = await ApiClient.request(`/api/v1/whatsapp/instances/${instanceId}/qr`).catch(() => null);

        if (res) {
          if (res.status === "CONNECTED") {
            setQrStatus("CONNECTED");
            setQrCode(null);
            if (pollRef.current) clearInterval(pollRef.current);
            const instances = await ApiClient.request<WhatsAppInstance[]>("/api/v1/whatsapp/instances").catch(() => []);
            if (instances && instances[0]) {
              setInstance(instances[0]);
              loadChatData(instances[0]);
            }
            return;
          }

          if (res.qr_code && res.qr_code.startsWith("data:image")) {
            setQrCode(res.qr_code);
            setQrStatus("QR_READY");
          } else {
            setQrStatus(res.status || "INITIALIZING");
          }
        }

        if (attempts >= maxAttempts) {
          if (pollRef.current) clearInterval(pollRef.current);
          setQrStatus("EXPIRED");
        }
      } catch (err) {
        console.error("QR poll error:", err);
      }
    };

    poll();
    pollRef.current = setInterval(poll, 2500);
  }

  // Sync all chats from connected WhatsApp session
  async function syncChats(inst = instance) {
    const targetInst = inst || instance;
    if (!targetInst) return;
    setSyncingChats(true);
    try {
      await ApiClient.request(`/api/v1/whatsapp/instances/${targetInst.id}/sync`, { method: "POST" }).catch(() => {});
      await loadChatData(targetInst, false);
    } catch (err) {
      console.error("Failed to sync WhatsApp chats:", err);
    } finally {
      setSyncingChats(false);
    }
  }

  // Load Contacts and Conversations for WhatsApp Web Live Chat
  async function loadChatData(inst: WhatsAppInstance, autoSync = true) {
    try {
      const [contactsList, convsList] = await Promise.all([
        ApiClient.request("/api/v1/contacts").catch(() => []),
        ApiClient.request("/api/v1/conversations").catch(() => []),
      ]);

      const cList = Array.isArray(contactsList) ? contactsList : [];
      const cvList = Array.isArray(convsList) ? convsList : [];

      setContacts(cList);
      setConversations(cvList);

      if (cList.length > 0 && !selectedContact) {
        selectContactChat(cList[0], cvList);
      } else if (cList.length === 0 && autoSync) {
        syncChats(inst);
      }
    } catch (err) {
      console.error("Failed to load chat data:", err);
    }
  }

  async function selectContactChat(contact: any, existingConvs = conversations) {
    setSelectedContact(contact);
    try {
      const conv = await ApiClient.request(`/api/v1/conversations/contact/${contact.id}`, {
        method: "POST",
      });
      setActiveConversation(conv);

      const [dbMsgs, liveMsgs] = await Promise.all([
        ApiClient.request(`/api/v1/conversations/${conv.id}/messages`).catch(() => []),
        instance ? ApiClient.request(`/api/v1/whatsapp/instances/${instance.id}/chats/${contact.phone}/messages?limit=50`).catch(() => []) : []
      ]);

      const formattedDb = Array.isArray(dbMsgs) ? dbMsgs : [];
      let merged = [...formattedDb];

      if (Array.isArray(liveMsgs) && liveMsgs.length > 0) {
        const existingBodies = new Set(formattedDb.map((m: any) => m.content));
        for (const lm of liveMsgs) {
          if (!existingBodies.has(lm.body) && lm.body) {
            merged.push({
              id: lm.id,
              direction: lm.fromMe ? "OUTBOUND" : "INBOUND",
              content: lm.body,
              message_type: lm.hasMedia ? "IMAGE" : "TEXT",
              status: "DELIVERED",
              created_at: lm.timestamp ? new Date(lm.timestamp * 1000).toISOString() : new Date().toISOString(),
            });
          }
        }
      }

      merged.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      setMessages(merged);

      if (messagePollRef.current) clearInterval(messagePollRef.current);
      messagePollRef.current = setInterval(async () => {
        const refreshed = await ApiClient.request(`/api/v1/conversations/${conv.id}/messages`).catch(() => []);
        if (Array.isArray(refreshed) && refreshed.length > 0) {
          setMessages(refreshed);
        }
      }, 2500);
    } catch (err) {
      console.error("Failed to open chat with contact:", err);
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if ((!inputText.trim() && !attachedFile) || !activeConversation || !instance) return;

    setSendingMessage(true);
    const contentToSend = inputText.trim();
    try {
      let uploadedUrl = null;
      if (attachedFile) {
        const formData = new FormData();
        formData.append("file", attachedFile);
        const mediaRes = await ApiClient.upload("/api/v1/media/upload", formData);
        uploadedUrl = mediaRes.public_url;
      }

      const isImg = attachedFile ? attachedFile.type.startsWith("image/") : false;
      const isDoc = attachedFile ? !isImg : false;

      const payload: any = {
        content: contentToSend || (attachedFile ? attachedFile.name : ""),
        message_type: isImg ? "IMAGE" : isDoc ? "DOCUMENT" : "TEXT",
        whatsapp_instance_id: instance.id,
        media_url: uploadedUrl,
      };

      const optimisticMsg = {
        id: `temp_${Date.now()}`,
        direction: "OUTBOUND",
        content: payload.content,
        message_type: payload.message_type,
        media_url: payload.media_url,
        status: "SENT",
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimisticMsg]);
      setInputText("");
      setAttachedFile(null);

      const sentMsg = await ApiClient.request(`/api/v1/conversations/${activeConversation.id}/messages`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setMessages((prev) => prev.map((m) => (m.id === optimisticMsg.id ? sentMsg : m)));
    } catch (err: any) {
      alert(err.message || "Failed to send message to WhatsApp");
    } finally {
      setSendingMessage(false);
    }
  }

  async function handleCreateNewChat(e: React.FormEvent) {
    e.preventDefault();
    if (!newChatPhone.trim()) return;
    setCreatingChat(true);
    try {
      const cleanPhone = newChatPhone.trim().replace(/[^0-9+]/g, "");
      const contact = await ApiClient.request("/api/v1/contacts", {
        method: "POST",
        body: JSON.stringify({
          name: newChatName.trim() || cleanPhone,
          phone: cleanPhone,
        }),
      });

      setShowNewChatModal(false);
      setNewChatPhone("");
      setNewChatName("");

      if (instance) await loadChatData(instance, false);
      await selectContactChat(contact);

      // If user typed a first message, send it immediately
      if (newChatFirstMsg.trim() && instance) {
        const conv = await ApiClient.request(`/api/v1/conversations/contact/${contact.id}`, { method: "POST" });
        await ApiClient.request(`/api/v1/conversations/${conv.id}/messages`, {
          method: "POST",
          body: JSON.stringify({
            content: newChatFirstMsg.trim(),
            message_type: "TEXT",
            whatsapp_instance_id: instance.id,
          }),
        });
        setNewChatFirstMsg("");
        selectContactChat(contact);
      }
    } catch (err: any) {
      alert(err.message || "Failed to create new chat");
    } finally {
      setCreatingChat(false);
    }
  }

  async function handleDisconnect() {
    if (!instance) return;
    if (!confirm("Are you sure you want to disconnect this WhatsApp account?")) return;
    setDisconnecting(true);
    try {
      await ApiClient.request(`/api/v1/whatsapp/instances/${instance.id}/disconnect`, { method: "POST" }).catch(() => {});
      setQrStatus("INITIALIZING");
      setQrCode(null);
      setSelectedContact(null);
      setActiveConversation(null);
      setMessages([]);
      await initWhatsApp();
    } catch (err) {
      alert("Failed to disconnect");
    } finally {
      setDisconnecting(false);
    }
  }

  const isConnected = instance?.status === "CONNECTED" || qrStatus === "CONNECTED";

  const filteredContacts = contacts.filter(
    (c) =>
      (c.name && c.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.phone && c.phone.includes(searchQuery))
  );

  // Avatar color generator based on name
  const getAvatarColor = (str: string) => {
    const colors = ["#00a884", "#0284c7", "#7c3aed", "#db2777", "#ea580c", "#16a34a", "#4f46e5", "#0891b2"];
    let hash = 0;
    for (let i = 0; i < (str || "").length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const formatDisplayPhone = (ph?: string) => {
    if (!ph) return "Linked Phone";
    if (ph.startsWith("+")) return ph;
    if (ph.length === 12 && ph.startsWith("91")) {
      return `+91 ${ph.slice(2, 7)} ${ph.slice(7)}`;
    }
    return `+${ph}`;
  };

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* ─── TOP STATUS & TELEMETRY BAR ─── */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "20px",
        background: "#ffffff",
        padding: "16px 22px",
        borderRadius: "14px",
        border: "1px solid #e9edef",
        boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{
            width: "44px",
            height: "44px",
            borderRadius: "12px",
            background: isConnected ? "#e7f7f3" : "#f0f2f5",
            color: isConnected ? "#00a884" : "#64748b",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: isConnected ? "0 2px 8px rgba(0,168,132,0.2)" : "none",
          }}>
            <MessageCircle style={{ width: "24px", height: "24px" }} />
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <h1 style={{ fontSize: "19px", fontWeight: 800, color: "#111b21", letterSpacing: "-0.01em" }}>
                {isConnected ? "WhatsApp Connected & Ready" : "Connect WhatsApp Account"}
              </h1>
              {isConnected ? (
                <span style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  padding: "3px 10px",
                  background: "#e7f7f3",
                  color: "#008069",
                  borderRadius: "999px",
                  fontSize: "11.5px",
                  fontWeight: 700,
                  border: "1px solid rgba(0,168,132,0.3)",
                }}>
                  <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#00a884" }} />
                  Live Channel
                </span>
              ) : (
                <span style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  padding: "3px 10px",
                  background: "#fef3c7",
                  color: "#b45309",
                  borderRadius: "999px",
                  fontSize: "11.5px",
                  fontWeight: 700,
                  border: "1px solid #fde68a",
                }}>
                  ● Waiting for scan
                </span>
              )}
            </div>

            <p style={{ fontSize: "13px", color: "#54656f", marginTop: "2px" }}>
              {isConnected
                ? `Active WhatsApp sender: ${instance?.phone_number ? formatDisplayPhone(instance.phone_number) : "Primary Session"}. All outbound campaigns route directly via this device.`
                : "Scan the official WhatsApp QR code with your mobile app to link your sender device."}
            </p>
          </div>
        </div>

        {isConnected && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              onClick={() => setShowNewChatModal(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 16px",
                background: "#00a884",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                fontSize: "12.5px",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(0,168,132,0.25)",
              }}
            >
              <Plus style={{ width: "14px", height: "14px" }} />
              <span>New Chat</span>
            </button>

            <button
              onClick={() => syncChats()}
              disabled={syncingChats}
              title="Sync chats from phone"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                background: "#f0f2f5",
                color: "#111b21",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                fontSize: "12.5px",
                fontWeight: 600,
                cursor: syncingChats ? "not-allowed" : "pointer",
              }}
            >
              <RefreshCw style={{ width: "13px", height: "13px", animation: syncingChats ? "spin 1s linear infinite" : "none" }} />
              <span>{syncingChats ? "Syncing..." : "Sync Chats"}</span>
            </button>

            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                background: "#fef2f2",
                color: "#dc2626",
                border: "1px solid #fecaca",
                borderRadius: "8px",
                fontSize: "12.5px",
                fontWeight: 600,
                cursor: disconnecting ? "not-allowed" : "pointer",
              }}
            >
              <PowerOff style={{ width: "13px", height: "13px" }} />
              <span>{disconnecting ? "Disconnecting..." : "Disconnect"}</span>
            </button>
          </div>
        )}
      </div>

      {isConnected ? (
        /* ═══════════════════════════════════════════════════════════════
           CONNECTED STATE: AUTHENTIC WHATSAPP WEB 2-PANEL LIGHT THEME
        ═══════════════════════════════════════════════════════════════ */
        <div style={{
          background: "#ffffff",
          borderRadius: "16px",
          border: "1px solid #e9edef",
          height: "76vh",
          minHeight: "600px",
          display: "grid",
          gridTemplateColumns: "360px 1fr",
          overflow: "hidden",
          boxShadow: "0 6px 24px rgba(11,20,26,0.05)",
        }}>
          {/* LEFT PANEL: CONTACTS & RECENT CHATS */}
          <div style={{
            background: "#ffffff",
            borderRight: "1px solid #e9edef",
            display: "flex",
            flexDirection: "column",
            height: "100%",
          }}>
            {/* Header with Search and Stats */}
            <div style={{
              padding: "14px 16px",
              borderBottom: "1px solid #e9edef",
              background: "#ffffff",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <h2 style={{ fontSize: "15px", fontWeight: 800, color: "#111b21" }}>
                    Conversations
                  </h2>
                  <span style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    background: "#e7f7f3",
                    color: "#008069",
                    padding: "2px 8px",
                    borderRadius: "10px",
                  }}>
                    {filteredContacts.length}
                  </span>
                </div>

                <span style={{ fontSize: "11.5px", color: "#64748b" }}>
                  Active Stream
                </span>
              </div>

              {/* Search Bar */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 12px",
                background: "#f0f2f5",
                borderRadius: "8px",
                border: "1px solid transparent",
              }}>
                <Search style={{ width: "15px", height: "15px", color: "#8696a0" }} />
                <input
                  type="text"
                  placeholder="Search chats or phone numbers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#111b21",
                    fontSize: "13px",
                    width: "100%",
                    outline: "none",
                  }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    style={{ background: "transparent", border: "none", color: "#8696a0", cursor: "pointer", fontSize: "12px" }}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Contacts List */}
            <div style={{ flex: 1, overflowY: "auto" }}>
              {filteredContacts.length === 0 ? (
                <div style={{ padding: "40px 20px", textAlign: "center" }}>
                  <User style={{ width: "36px", height: "36px", color: "#8696a0", margin: "0 auto 10px" }} />
                  <p style={{ fontSize: "14px", fontWeight: 700, color: "#111b21" }}>No conversations found</p>
                  <p style={{ fontSize: "12px", color: "#667781", marginTop: "4px" }}>
                    {searchQuery ? "No contacts match your query." : "Click Sync Chats to import active WhatsApp threads."}
                  </p>
                  <button
                    onClick={() => syncChats()}
                    disabled={syncingChats}
                    style={{
                      marginTop: "14px",
                      padding: "7px 16px",
                      background: "#00a884",
                      color: "#fff",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Sync WhatsApp Chats
                  </button>
                </div>
              ) : (
                filteredContacts.map((c) => {
                  const isSelected = selectedContact?.id === c.id;
                  const avatarColor = getAvatarColor(c.name || c.phone);
                  return (
                    <div
                      key={c.id}
                      onClick={() => selectContactChat(c)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "12px 16px",
                        cursor: "pointer",
                        background: isSelected ? "#f0f2f5" : "#ffffff",
                        borderBottom: "1px solid #f0f2f5",
                        borderLeft: isSelected ? "4px solid #00a884" : "4px solid transparent",
                        transition: "background 0.12s ease",
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.background = "#f8fafc";
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.background = "#ffffff";
                      }}
                    >
                      {/* Avatar */}
                      <div style={{
                        width: "42px",
                        height: "42px",
                        borderRadius: "50%",
                        background: avatarColor,
                        color: "#fff",
                        fontWeight: 700,
                        fontSize: "15px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                      }}>
                        {c.name ? c.name.charAt(0).toUpperCase() : <User style={{ width: "18px", height: "18px" }} />}
                      </div>

                      {/* Name & Phone */}
                      <div style={{ overflow: "hidden", flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
                          <p style={{ fontSize: "14px", fontWeight: 700, color: "#111b21", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {c.name || c.phone}
                          </p>
                          <span style={{ fontSize: "11px", color: "#8696a0", flexShrink: 0 }}>
                            Active
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <CheckCheck style={{ width: "13px", height: "13px", color: "#53bdeb", flexShrink: 0 }} />
                          <p style={{ fontSize: "12px", color: "#54656f", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {formatDisplayPhone(c.phone)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT PANEL: CONVERSATION VIEW */}
          <div style={{
            background: "#efeae2",
            display: "flex",
            flexDirection: "column",
            height: "100%",
            position: "relative",
          }}>
            {selectedContact ? (
              <>
                {/* Chat Top Header */}
                <div style={{
                  height: "60px",
                  background: "#ffffff",
                  borderBottom: "1px solid #e9edef",
                  padding: "0 20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                  zIndex: 10,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{
                      width: "38px",
                      height: "38px",
                      borderRadius: "50%",
                      background: getAvatarColor(selectedContact.name),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: "14px",
                    }}>
                      {selectedContact.name ? selectedContact.name.charAt(0).toUpperCase() : <User style={{ width: "16px", height: "16px" }} />}
                    </div>
                    <div>
                      <h3 style={{ fontSize: "14.5px", fontWeight: 700, color: "#111b21" }}>
                        {selectedContact.name}
                      </h3>
                      <p style={{ fontSize: "11.5px", color: "#008069", display: "flex", alignItems: "center", gap: "4px" }}>
                        <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#00a884" }} />
                        {formatDisplayPhone(selectedContact.phone)} • WhatsApp Verified
                      </p>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{
                      fontSize: "11.5px",
                      color: "#54656f",
                      background: "#f0f2f5",
                      padding: "4px 10px",
                      borderRadius: "6px",
                      border: "1px solid #e2e8f0",
                    }}>
                      Linked Sender: <strong>{instance?.phone_number ? formatDisplayPhone(instance.phone_number) : "primary"}</strong>
                    </span>
                  </div>
                </div>

                {/* Messages Stream */}
                <div style={{
                  flex: 1,
                  padding: "20px",
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  background: "#efeae2",
                }}>
                  {messages.length === 0 ? (
                    <div style={{
                      margin: "auto",
                      textAlign: "center",
                      padding: "24px",
                      background: "#ffffff",
                      borderRadius: "12px",
                      border: "1px solid #e9edef",
                      maxWidth: "340px",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                    }}>
                      <MessageSquare style={{ width: "32px", height: "32px", color: "#00a884", margin: "0 auto 8px" }} />
                      <p style={{ fontSize: "14px", fontWeight: 700, color: "#111b21", marginBottom: "4px" }}>
                        Direct WhatsApp Chat
                      </p>
                      <p style={{ fontSize: "12px", color: "#54656f" }}>
                        Send your first message or campaign attachment directly to <strong>{selectedContact.name}</strong>.
                      </p>
                    </div>
                  ) : (
                    messages.map((m, idx) => {
                      const isOutbound = m.direction === "OUTBOUND";
                      const mediaUrl = m.media_url ? (m.media_url.startsWith("http") ? m.media_url : `${getApiBase()}${m.media_url}`) : null;
                      const isImg = m.message_type === "IMAGE" || (mediaUrl && (mediaUrl.endsWith(".png") || mediaUrl.endsWith(".jpg") || mediaUrl.endsWith(".jpeg") || mediaUrl.endsWith(".webp")));
                      const isDoc = m.message_type === "DOCUMENT" || (mediaUrl && !isImg);

                      return (
                        <div
                          key={m.id || idx}
                          style={{
                            alignSelf: isOutbound ? "flex-end" : "flex-start",
                            maxWidth: "70%",
                            display: "flex",
                            flexDirection: "column",
                          }}
                        >
                          <div style={{
                            background: isOutbound ? "#d9fdd3" : "#ffffff",
                            color: "#111b21",
                            padding: "8px 12px",
                            borderRadius: isOutbound ? "8px 8px 2px 8px" : "8px 8px 8px 2px",
                            boxShadow: "0 1px 2px rgba(11,20,26,0.12)",
                            fontSize: "13.5px",
                            lineHeight: 1.4,
                            wordBreak: "break-word",
                          }}>
                            {/* Media: Image */}
                            {mediaUrl && isImg && (
                              <div style={{ marginBottom: "6px", cursor: "pointer" }} onClick={() => setLightboxUrl(mediaUrl)}>
                                <img
                                  src={mediaUrl}
                                  alt="attachment"
                                  style={{ maxWidth: "100%", borderRadius: "6px", maxHeight: "220px", objectFit: "cover" }}
                                />
                              </div>
                            )}

                            {/* Media: Document */}
                            {mediaUrl && isDoc && (
                              <div style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                padding: "10px 12px",
                                background: isOutbound ? "#c5ebd0" : "#f0f2f5",
                                borderRadius: "8px",
                                marginBottom: "6px",
                              }}>
                                <FileText style={{ width: "24px", height: "24px", color: "#00a884", flexShrink: 0 }} />
                                <div style={{ flex: 1, overflow: "hidden" }}>
                                  <p style={{ fontSize: "12.5px", fontWeight: 700, color: "#111b21", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {m.content && m.content.includes(".") ? m.content : "Document Attachment"}
                                  </p>
                                  <span style={{ fontSize: "10.5px", color: "#54656f" }}>WhatsApp Document</span>
                                </div>
                                <a
                                  href={mediaUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{
                                    padding: "4px 8px",
                                    background: "#ffffff",
                                    borderRadius: "4px",
                                    color: "#008069",
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    textDecoration: "none",
                                    border: "1px solid rgba(0,0,0,0.08)",
                                  }}
                                >
                                  Open
                                </a>
                              </div>
                            )}

                            {/* Message text caption */}
                            <span>{m.content}</span>

                            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "4px", marginTop: "2px" }}>
                              <span style={{ fontSize: "10px", color: "#667781" }}>
                                {m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Now"}
                              </span>
                              {isOutbound && (
                                <CheckCheck style={{ width: "13px", height: "13px", color: "#53bdeb" }} />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={chatBottomRef} />
                </div>

                {/* Bottom Message Input Bar */}
                <form
                  onSubmit={handleSendMessage}
                  style={{
                    background: "#f0f2f5",
                    padding: "10px 16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                    borderTop: "1px solid #e9edef",
                  }}
                >
                  {/* If file is attached, show preview badge */}
                  {attachedFile && (
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "6px 12px",
                      background: "#ffffff",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "hidden" }}>
                        {attachedFilePreview ? (
                          <img src={attachedFilePreview} alt="thumb" style={{ width: "24px", height: "24px", borderRadius: "4px", objectFit: "cover" }} />
                        ) : (
                          <FileText style={{ width: "16px", height: "16px", color: "#00a884" }} />
                        )}
                        <span style={{ fontSize: "12px", fontWeight: 600, color: "#111b21", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          Attached: {attachedFile.name} ({Math.round(attachedFile.size / 1024)} KB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAttachedFile(null)}
                        style={{ background: "transparent", border: "none", color: "#dc2626", cursor: "pointer", fontSize: "12px" }}
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <input
                      type="file"
                      id="wa-chat-file"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        if (e.target.files?.[0]) setAttachedFile(e.target.files[0]);
                      }}
                    />
                    <label
                      htmlFor="wa-chat-file"
                      title="Attach Image or PDF Document"
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        background: attachedFile ? "#e7f7f3" : "transparent",
                        color: attachedFile ? "#00a884" : "#54656f",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                      }}
                    >
                      <Paperclip style={{ width: "18px", height: "18px" }} />
                    </label>

                    <input
                      type="text"
                      placeholder={attachedFile ? "Add a caption..." : "Type a WhatsApp message..."}
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      style={{
                        flex: 1,
                        padding: "10px 16px",
                        background: "#ffffff",
                        border: "1px solid #e9edef",
                        borderRadius: "8px",
                        color: "#111b21",
                        fontSize: "13.5px",
                        outline: "none",
                      }}
                    />

                    <button
                      type="submit"
                      disabled={sendingMessage || (!inputText.trim() && !attachedFile)}
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        background: "#00a884",
                        border: "none",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: sendingMessage || (!inputText.trim() && !attachedFile) ? "not-allowed" : "pointer",
                        flexShrink: 0,
                        boxShadow: "0 2px 6px rgba(0, 168, 132, 0.3)",
                      }}
                    >
                      {sendingMessage ? (
                        <Loader2 style={{ width: "16px", height: "16px", animation: "spin 1s linear infinite" }} />
                      ) : (
                        <Send style={{ width: "16px", height: "16px" }} />
                      )}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              /* EMPTY STATE */
              <div style={{
                margin: "auto",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                padding: "20px",
              }}>
                <div style={{
                  background: "#ffffff",
                  borderRadius: "20px",
                  padding: "44px 36px",
                  boxShadow: "0 8px 30px rgba(11,20,26,0.06)",
                  border: "1px solid #e9edef",
                  maxWidth: "420px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}>
                  <div style={{
                    width: "68px",
                    height: "68px",
                    borderRadius: "18px",
                    background: "#e7f7f3",
                    border: "1px solid rgba(0, 168, 132, 0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#00a884",
                    marginBottom: "18px",
                  }}>
                    <Laptop style={{ width: "34px", height: "34px" }} />
                  </div>

                  <h3 style={{ fontSize: "19px", fontWeight: 700, color: "#111b21", marginBottom: "8px" }}>
                    WhatsApp Connected
                  </h3>
                  <p style={{ fontSize: "13px", color: "#54656f", lineHeight: 1.5, marginBottom: "22px" }}>
                    Select a conversation from the left to read or reply, or launch a targeted broadcast.
                  </p>

                  <button
                    onClick={() => setShowNewChatModal(true)}
                    style={{
                      padding: "10px 24px",
                      background: "#00a884",
                      color: "#fff",
                      border: "none",
                      borderRadius: "999px",
                      fontSize: "13.5px",
                      fontWeight: 700,
                      cursor: "pointer",
                      boxShadow: "0 3px 10px rgba(0, 168, 132, 0.3)",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <Plus style={{ width: "15px", height: "15px" }} />
                    Start New Chat
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ═══════════════════════════════════════════════════════════════
           DISCONNECTED STATE: HIGH-RES SCAN TO LOG IN VIEW
        ═══════════════════════════════════════════════════════════════ */
        <div style={{
          background: "#ffffff",
          borderRadius: "20px",
          border: "1px solid #e9edef",
          overflow: "hidden",
          boxShadow: "0 6px 30px rgba(11,20,26,0.06)",
          padding: "48px 56px",
          display: "grid",
          gridTemplateColumns: "1.2fr 1fr",
          gap: "48px",
          alignItems: "center",
        }}>
          {/* Left Column: Instructions */}
          <div>
            <h2 style={{ fontSize: "28px", fontWeight: 800, color: "#111b21", letterSpacing: "-0.02em", marginBottom: "32px" }}>
              Scan to log in
            </h2>

            {/* Stepper with connected line */}
            <div style={{ position: "relative", marginBottom: "36px" }}>
              <div style={{
                position: "absolute",
                left: "15px",
                top: "20px",
                bottom: "20px",
                width: "2px",
                background: "#e2e8f0",
                zIndex: 1,
              }} />

              <div style={{ display: "flex", flexDirection: "column", gap: "28px", position: "relative", zIndex: 2 }}>
                {/* Step 1 */}
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <div style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: "#ffffff",
                    border: "2px solid #cbd5e1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#111b21",
                    fontWeight: 700,
                    fontSize: "13px",
                    flexShrink: 0,
                  }}>
                    1
                  </div>
                  <p style={{ fontSize: "15px", color: "#111b21", fontWeight: 500 }}>
                    Open <strong>WhatsApp</strong> on your phone
                  </p>
                </div>

                {/* Step 2 */}
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <div style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: "#ffffff",
                    border: "2px solid #cbd5e1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#111b21",
                    fontWeight: 700,
                    fontSize: "13px",
                    flexShrink: 0,
                  }}>
                    2
                  </div>
                  <p style={{ fontSize: "15px", color: "#111b21", fontWeight: 500 }}>
                    Go to <strong>Settings &gt; Linked Devices</strong> & tap <strong>Link a Device</strong>
                  </p>
                </div>

                {/* Step 3 */}
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <div style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: "#ffffff",
                    border: "2px solid #cbd5e1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#111b21",
                    fontWeight: 700,
                    fontSize: "13px",
                    flexShrink: 0,
                  }}>
                    3
                  </div>
                  <p style={{ fontSize: "15px", color: "#111b21", fontWeight: 500 }}>
                    Point your phone at this screen to scan the QR code
                  </p>
                </div>
              </div>
            </div>

            {/* Need help link */}
            <div style={{ marginBottom: "22px" }}>
              <a
                href="https://faq.whatsapp.com/1317564962415621"
                target="_blank"
                rel="noreferrer"
                style={{
                  fontSize: "13.5px",
                  color: "#008069",
                  fontWeight: 600,
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                Need help connecting? <ExternalLink style={{ width: "13px", height: "13px" }} />
              </a>
            </div>

            {/* Stay logged in checkbox */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <label
                onClick={() => setStayLoggedIn(!stayLoggedIn)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: "pointer",
                  fontSize: "13.5px",
                  color: "#111b21",
                  fontWeight: 500,
                }}
              >
                <div style={{
                  width: "18px",
                  height: "18px",
                  borderRadius: "4px",
                  background: stayLoggedIn ? "#00a884" : "#ffffff",
                  border: stayLoggedIn ? "none" : "1.5px solid #cbd5e1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                }}>
                  {stayLoggedIn && <Check style={{ width: "12px", height: "12px", strokeWidth: 3 }} />}
                </div>
                <span>Stay logged in on this browser</span>
              </label>
              <HelpCircle style={{ width: "14px", height: "14px", color: "#8696a0" }} />
            </div>
          </div>

          {/* Right Column: High-res QR Card */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{
              width: "320px",
              height: "320px",
              background: "#ffffff",
              borderRadius: "20px",
              padding: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              boxShadow: "0 6px 20px rgba(0,0,0,0.06)",
              border: "1px solid #e9edef",
            }}>
              {qrCode ? (
                <>
                  <img
                    src={qrCode}
                    alt="WhatsApp QR Code"
                    style={{ width: "100%", height: "100%", objectFit: "contain" }}
                  />
                  <div className="scanner-laser" />
                </>
              ) : qrStatus === "EXPIRED" ? (
                <div style={{ textAlign: "center", padding: "20px" }}>
                  <AlertTriangle style={{ width: "38px", height: "38px", color: "#f59e0b", margin: "0 auto 10px" }} />
                  <p style={{ fontSize: "14px", color: "#111b21", fontWeight: 700, marginBottom: "12px" }}>
                    QR Code Expired
                  </p>
                  <button
                    onClick={handleRefreshQr}
                    style={{
                      padding: "8px 18px",
                      background: "#00a884",
                      color: "#fff",
                      border: "none",
                      borderRadius: "8px",
                      fontWeight: 600,
                      fontSize: "12.5px",
                      cursor: "pointer",
                    }}
                  >
                    Regenerate QR
                  </button>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "20px" }}>
                  <Loader2 style={{ width: "38px", height: "38px", color: "#00a884", animation: "spin 1s linear infinite", margin: "0 auto 12px" }} />
                  <p style={{ fontSize: "14px", color: "#111b21", fontWeight: 700 }}>
                    Generating WhatsApp QR...
                  </p>
                  <p style={{ fontSize: "12px", color: "#667781", marginTop: "4px" }}>
                    Connecting to WhatsApp session
                  </p>
                </div>
              )}
            </div>

            {/* Refresh QR & Countdown timer */}
            <div style={{ marginTop: "18px", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
              <button
                onClick={handleRefreshQr}
                disabled={refreshing}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#008069",
                  fontSize: "13.5px",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  cursor: refreshing ? "not-allowed" : "pointer",
                }}
              >
                <RefreshCw style={{ width: "14px", height: "14px", animation: refreshing ? "spin 1s linear infinite" : "none" }} />
                <span>Refresh QR ({qrTimer}s)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── NEW CHAT MODAL ─── */}
      {showNewChatModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(11,20,26,0.5)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: "20px",
        }}>
          <div style={{
            background: "#ffffff",
            border: "1px solid #e9edef",
            borderRadius: "16px",
            width: "100%",
            maxWidth: "420px",
            overflow: "hidden",
            boxShadow: "0 20px 40px rgba(0,0,0,0.12)",
          }}>
            <div style={{
              padding: "16px 20px",
              borderBottom: "1px solid #e9edef",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "#ffffff",
            }}>
              <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#111b21", display: "flex", alignItems: "center", gap: "8px" }}>
                <MessageSquare style={{ width: "16px", height: "16px", color: "#00a884" }} />
                Start New WhatsApp Chat
              </h3>
              <button
                onClick={() => setShowNewChatModal(false)}
                style={{ background: "transparent", border: "none", color: "#8696a0", fontSize: "18px", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNewChat} style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#54656f", marginBottom: "6px" }}>
                  Phone Number (with country code) *
                </label>
                <input
                  type="text"
                  placeholder="+91 98857 33334"
                  value={newChatPhone}
                  onChange={(e) => setNewChatPhone(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    background: "#f0f2f5",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    color: "#111b21",
                    fontSize: "13.5px",
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#54656f", marginBottom: "6px" }}>
                  Contact Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sai Sathwik"
                  value={newChatName}
                  onChange={(e) => setNewChatName(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    background: "#f0f2f5",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    color: "#111b21",
                    fontSize: "13.5px",
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#54656f", marginBottom: "6px" }}>
                  Initial Message (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Hi there! Reaching out regarding your query..."
                  value={newChatFirstMsg}
                  onChange={(e) => setNewChatFirstMsg(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    background: "#f0f2f5",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    color: "#111b21",
                    fontSize: "13.5px",
                    outline: "none",
                    resize: "vertical",
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
                <button
                  type="button"
                  onClick={() => setShowNewChatModal(false)}
                  style={{
                    flex: 1,
                    padding: "10px",
                    background: "#f0f2f5",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    color: "#54656f",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingChat || !newChatPhone.trim()}
                  style={{
                    flex: 1,
                    padding: "10px",
                    background: "#00a884",
                    border: "none",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: creatingChat || !newChatPhone.trim() ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                  }}
                >
                  {creatingChat ? <Loader2 style={{ width: "14px", height: "14px", animation: "spin 1s linear infinite" }} /> : <Send style={{ width: "14px", height: "14px" }} />}
                  {creatingChat ? "Opening..." : "Start Chat"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── LIGHTBOX MODAL FOR IMAGES ─── */}
      {lightboxUrl && (
        <div
          onClick={() => setLightboxUrl(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 99999,
            padding: "20px",
            cursor: "zoom-out",
          }}
        >
          <div style={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh" }}>
            <img
              src={lightboxUrl}
              alt="fullscreen preview"
              style={{ maxWidth: "100%", maxHeight: "90vh", borderRadius: "8px", objectFit: "contain" }}
            />
            <button
              onClick={() => setLightboxUrl(null)}
              style={{
                position: "absolute",
                top: "-14px",
                right: "-14px",
                background: "#ffffff",
                color: "#111b21",
                border: "none",
                borderRadius: "50%",
                width: "32px",
                height: "32px",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
