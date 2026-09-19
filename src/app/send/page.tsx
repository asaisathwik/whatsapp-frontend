"use client";

import React, { useState, useEffect } from "react";
import {
  Send,
  Upload,
  FileSpreadsheet,
  Link as LinkIcon,
  FolderArchive,
  Edit3,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
  Image as ImageIcon,
  File as FileIcon,
  Loader2,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { ApiClient, getApiBase } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function SendMessagesPage() {
  const router = useRouter();

  // Campaign Meta
  const [campaignName, setCampaignName] = useState("");

  // Step 1: Contacts State (Only CSV/Excel and Google Sheets)
  const [contactSourceTab, setContactSourceTab] = useState<"file" | "sheets">("file");
  const [contactFile, setContactFile] = useState<File | null>(null);
  const [googleSheetUrl, setGoogleSheetUrl] = useState("");
  const [uploadingContacts, setUploadingContacts] = useState(false);
  
  // Parsed contacts table
  const [contacts, setContacts] = useState<any[]>([]);
  const [createdContactIds, setCreatedContactIds] = useState<string[]>([]);
  const [contactStats, setContactStats] = useState<{ total: number; valid: number; invalid: number }>({
    total: 0,
    valid: 0,
    invalid: 0,
  });

  // Step 2: Message State
  const [messageMode, setMessageMode] = useState<"store" | "custom">("store");
  const [storeFilterTab, setStoreFilterTab] = useState<"all" | "text" | "image" | "document">("all");
  
  // Store items
  const [storeTemplates, setStoreTemplates] = useState<any[]>([]);
  const [storeMedia, setStoreMedia] = useState<any[]>([]);
  const [selectedStoreItem, setSelectedStoreItem] = useState<{
    type: "text" | "image" | "document";
    id: string;
    name: string;
    content: string;
    public_url?: string;
  } | null>(null);

  // Custom message
  const [customText, setCustomText] = useState("");
  const [customMediaFile, setCustomMediaFile] = useState<File | null>(null);
  const [customMediaPreview, setCustomMediaPreview] = useState<string | null>(null);
  const [saveToStore, setSaveToStore] = useState(false);
  const [storeAssetName, setStoreAssetName] = useState("");

  // Step 3: Scheduling
  const [sendTiming, setSendTiming] = useState<"now" | "schedule">("now");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");

  // Submission
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem("selected_store_item");
    if (saved) {
      try {
        const item = JSON.parse(saved);
        setSelectedStoreItem(item);
        setMessageMode("store");
        sessionStorage.removeItem("selected_store_item");
      } catch {}
    }
    loadStoreItems();
  }, []);

  useEffect(() => {
    if (customMediaFile) {
      if (customMediaFile.type.startsWith("image/")) {
        const objUrl = URL.createObjectURL(customMediaFile);
        setCustomMediaPreview(objUrl);
        return () => URL.revokeObjectURL(objUrl);
      } else {
        setCustomMediaPreview(null);
      }
    } else {
      setCustomMediaPreview(null);
    }
  }, [customMediaFile]);

  function formatBytes(bytes: number) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  }

  async function loadStoreItems() {
    try {
      await ApiClient.ensureAuth();
      const [tmpls, mediaList] = await Promise.all([
        ApiClient.request("/api/v1/templates").catch(() => []),
        ApiClient.request("/api/v1/media").catch(() => []),
      ]);
      setStoreTemplates(Array.isArray(tmpls) ? tmpls : []);
      setStoreMedia(Array.isArray(mediaList) ? mediaList : []);
    } catch (err) {
      console.error("Failed to load store items:", err);
    }
  }

  const getFullMediaUrl = (url?: string) => {
    if (!url) return "";
    return url.startsWith("http") ? url : `${getApiBase()}${url}`;
  };

  // Handle CSV/Excel File Parse
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setContactFile(file);
    setUploadingContacts(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const preview = await ApiClient.upload("/api/v1/contacts/import/preview", formData);
      const sampleRows = preview.sample_rows || [];
      setContacts(sampleRows);
      setContactStats({
        total: preview.total_rows,
        valid: preview.valid_count,
        invalid: preview.invalid_count,
      });

      // Confirm import to database specifically for this batch
      await ApiClient.request("/api/v1/contacts/import/confirm", {
        method: "POST",
        body: JSON.stringify({
          rows: sampleRows,
          overwrite_existing: true,
        }),
      });

      // Fetch the updated contacts to map exact IDs
      const savedContacts: any = await ApiClient.request("/api/v1/contacts").catch(() => []);
      if (Array.isArray(savedContacts)) {
        const uploadedPhones = new Set(sampleRows.map((r: any) => r.normalized_phone || r.raw_phone));
        const matchedIds = savedContacts
          .filter((c: any) => uploadedPhones.has(c.phone))
          .map((c: any) => c.id);
        setCreatedContactIds(matchedIds.length > 0 ? matchedIds : savedContacts.map((c: any) => c.id));
      }
    } catch (err: any) {
      alert(err.message || "Failed to upload file");
    } finally {
      setUploadingContacts(false);
    }
  }

  // Handle Google Sheet URL Parse
  async function handleGoogleSheetParse(e: React.FormEvent) {
    e.preventDefault();
    if (!googleSheetUrl.trim()) return;
    setUploadingContacts(true);

    try {
      let csvUrl = googleSheetUrl.trim();
      if (csvUrl.includes("/edit")) {
        csvUrl = csvUrl.replace(/\/edit.*$/, "/export?format=csv");
      } else if (!csvUrl.includes("/export?format=csv")) {
        csvUrl = `${csvUrl}/export?format=csv`;
      }

      const response = await fetch(csvUrl);
      if (!response.ok) {
        throw new Error("Could not access Google Sheet. Please ensure 'Anyone with the link can view' is enabled.");
      }

      const csvText = await response.text();
      const blob = new Blob([csvText], { type: "text/csv" });

      const formData = new FormData();
      formData.append("file", blob, "google_sheet_contacts.csv");

      const preview = await ApiClient.upload("/api/v1/contacts/import/preview", formData);
      const sampleRows = preview.sample_rows || [];
      setContacts(sampleRows);
      setContactStats({
        total: preview.total_rows,
        valid: preview.valid_count,
        invalid: preview.invalid_count,
      });

      await ApiClient.request("/api/v1/contacts/import/confirm", {
        method: "POST",
        body: JSON.stringify({
          rows: sampleRows,
          overwrite_existing: true,
        }),
      });

      const savedContacts: any = await ApiClient.request("/api/v1/contacts").catch(() => []);
      if (Array.isArray(savedContacts)) {
        const uploadedPhones = new Set(sampleRows.map((r: any) => r.normalized_phone || r.raw_phone));
        const matchedIds = savedContacts
          .filter((c: any) => uploadedPhones.has(c.phone))
          .map((c: any) => c.id);
        setCreatedContactIds(matchedIds.length > 0 ? matchedIds : savedContacts.map((c: any) => c.id));
      }
    } catch (err: any) {
      alert(err.message || "Failed to parse Google Sheet");
    } finally {
      setUploadingContacts(false);
    }
  }

  function insertVariable(v: string) {
    setCustomText(prev => `${prev} {{${v}}}`);
  }

  // Handle Submit Campaign
  async function handleSubmitCampaign(e: React.FormEvent) {
    e.preventDefault();
    if (contacts.length === 0) {
      alert("Please upload a CSV, Excel, or Google Sheet with contacts first.");
      return;
    }

    if (messageMode === "store" && !selectedStoreItem) {
      alert("Please select a text template, image, or document from the Store.");
      return;
    }

    if (messageMode === "custom" && !customText.trim() && !customMediaFile) {
      alert("Please enter message text or attach a file.");
      return;
    }

    setIsSubmitting(true);
    try {
      let uploadedMediaUrl: string | undefined = undefined;

      // If custom media was attached, upload it
      if (messageMode === "custom" && customMediaFile) {
        const formData = new FormData();
        formData.append("file", customMediaFile);
        const uploadRes = await ApiClient.upload("/api/v1/media/upload", formData);
        uploadedMediaUrl = uploadRes.public_url;
      } else if (messageMode === "store" && selectedStoreItem?.public_url) {
        uploadedMediaUrl = selectedStoreItem.public_url;
      }

      let scheduledAtIso: string | undefined = undefined;
      if (sendTiming === "schedule") {
        if (!scheduledDate || !scheduledTime) {
          throw new Error("Please select both target date and time for scheduled broadcast.");
        }
        scheduledAtIso = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
      }

      const payload: any = {
        name: campaignName.trim() || `Broadcast ${new Date().toLocaleDateString()}`,
        contact_ids: createdContactIds.length > 0 ? createdContactIds : undefined,
        scheduled_at: scheduledAtIso,
        rate_limit_per_second: 1, // Safe rate limiting
        save_to_store: messageMode === "custom" ? saveToStore : false,
        store_asset_name: messageMode === "custom" && saveToStore ? (storeAssetName.trim() || undefined) : undefined,
      };

      if (messageMode === "store" && selectedStoreItem) {
        if (selectedStoreItem.type === "text") {
          payload.template_id = selectedStoreItem.id;
          payload.custom_content = selectedStoreItem.content;
        } else {
          payload.custom_content = selectedStoreItem.content || selectedStoreItem.name;
          payload.media_url = uploadedMediaUrl;
        }
      } else {
        payload.custom_content = customText.trim();
        if (uploadedMediaUrl) {
          payload.media_url = uploadedMediaUrl;
        }
      }

      const campaign = await ApiClient.request("/api/v1/campaigns", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      // If send now, dispatch immediately
      if (sendTiming === "now") {
        await ApiClient.request(`/api/v1/campaigns/${campaign.id}/send-now`, {
          method: "POST",
        }).catch(() => {});
      }

      setSuccessMessage("Broadcast campaign created & dispatched successfully!");
      setTimeout(() => {
        router.push("/history");
      }, 1200);
    } catch (err: any) {
      alert(err.message || "Failed to create broadcast campaign");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Form preview text
  const previewMessageText = messageMode === "store"
    ? (selectedStoreItem?.content || selectedStoreItem?.name || "Select an item from the Store...")
    : (customText || (customMediaFile ? `Attached: ${customMediaFile.name}` : "Type a message above..."));

  const filteredStoreTemplates = storeFilterTab === "all" || storeFilterTab === "text" ? storeTemplates : [];
  const filteredStoreImages = storeFilterTab === "all" || storeFilterTab === "image"
    ? storeMedia.filter(m => m.type === "image" || m.mime_type?.startsWith("image/"))
    : [];
  const filteredStoreDocs = storeFilterTab === "all" || storeFilterTab === "document"
    ? storeMedia.filter(m => m.type === "document" || (!m.type?.startsWith("image") && !m.mime_type?.startsWith("image/")))
    : [];

  return (
    <div style={{ maxWidth: '1140px', margin: '0 auto', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Top Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#111b21', letterSpacing: '-0.01em' }}>
          Send Broadcast Messages
        </h1>
        <p style={{ fontSize: '13.5px', color: '#54656f', marginTop: '2px' }}>
          Upload your contact list from CSV or Google Sheets, pick templates & media from the Store, and broadcast directly to WhatsApp.
        </p>
      </div>

      {successMessage && (
        <div style={{
          padding: '14px 18px',
          background: '#dcfce7',
          border: '1px solid #86efac',
          borderRadius: '10px',
          color: '#16a34a',
          fontWeight: 600,
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <CheckCircle2 style={{ width: '18px', height: '18px' }} />
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmitCampaign} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Campaign Name Input */}
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e9edef',
          padding: '24px 28px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
        }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#111b21', marginBottom: '8px' }}>
            Campaign Name
          </label>
          <input
            type="text"
            placeholder="e.g. VIP Member Festival Promotion"
            value={campaignName}
            onChange={e => setCampaignName(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              background: '#f0f2f5',
              border: '1px solid #e2e8f0',
              borderRadius: '9px',
              color: '#111b21',
              fontSize: '14px',
              outline: 'none',
            }}
          />
        </div>

        {/* STEP 1: UPLOAD CONTACT LIST (CSV / EXCEL / GOOGLE SHEETS ONLY) */}
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e9edef',
          padding: '28px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <span style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              background: '#00a884',
              color: '#fff',
              fontWeight: 700,
              fontSize: '13.5px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>1</span>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#111b21' }}>
                Upload Contact List
              </h2>
              <p style={{ fontSize: '12.5px', color: '#54656f' }}>
                Messages will be sent ONLY to the contacts inside your uploaded CSV, Excel, or Google Sheet
              </p>
            </div>
          </div>

          {/* Source Selectors: CSV/Excel and Google Sheets */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
            <button
              type="button"
              onClick={() => setContactSourceTab("file")}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 18px',
                borderRadius: '8px',
                background: contactSourceTab === "file" ? '#00a884' : '#f0f2f5',
                color: contactSourceTab === "file" ? '#fff' : '#54656f',
                border: '1px solid #e2e8f0',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: contactSourceTab === "file" ? '0 2px 8px rgba(0,168,132,0.25)' : 'none',
              }}
            >
              <Upload style={{ width: '15px', height: '15px' }} />
              Upload CSV / Excel
            </button>

            <button
              type="button"
              onClick={() => setContactSourceTab("sheets")}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 18px',
                borderRadius: '8px',
                background: contactSourceTab === "sheets" ? '#00a884' : '#f0f2f5',
                color: contactSourceTab === "sheets" ? '#fff' : '#54656f',
                border: '1px solid #e2e8f0',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: contactSourceTab === "sheets" ? '0 2px 8px rgba(0,168,132,0.25)' : 'none',
              }}
            >
              <LinkIcon style={{ width: '15px', height: '15px' }} />
              Google Sheets Link
            </button>
          </div>

          {/* Tab 1: CSV/Excel Dropzone */}
          {contactSourceTab === "file" && (
            <div style={{
              border: '2px dashed #cbd5e1',
              borderRadius: '12px',
              padding: '32px',
              textAlign: 'center',
              background: '#f8fafc',
              marginBottom: '20px',
            }}>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                id="contact-file-input"
              />
              <label htmlFor="contact-file-input" style={{ cursor: 'pointer', display: 'block' }}>
                <FileSpreadsheet style={{ width: '40px', height: '40px', color: '#00a884', margin: '0 auto 10px' }} />
                <p style={{ fontSize: '14.5px', fontWeight: 700, color: '#111b21', marginBottom: '4px' }}>
                  {contactFile ? contactFile.name : "Click to select CSV or Excel file"}
                </p>
                <p style={{ fontSize: '12px', color: '#667781' }}>
                  Supports .csv, .xlsx, .xls with columns: Name, Phone (with country code), Email
                </p>
              </label>
            </div>
          )}

          {/* Tab 2: Google Sheets URL */}
          {contactSourceTab === "sheets" && (
            <div style={{
              background: '#f8fafc',
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              marginBottom: '20px',
            }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#111b21', marginBottom: '8px' }}>
                Public Google Sheets URL
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="url"
                  placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                  value={googleSheetUrl}
                  onChange={e => setGoogleSheetUrl(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '13.5px',
                    color: '#111b21',
                    outline: 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={handleGoogleSheetParse}
                  disabled={uploadingContacts || !googleSheetUrl.trim()}
                  style={{
                    padding: '10px 20px',
                    background: '#00a884',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: uploadingContacts ? 'not-allowed' : 'pointer',
                  }}
                >
                  {uploadingContacts ? "Parsing..." : "Sync Sheet"}
                </button>
              </div>
            </div>
          )}

          {/* Imported Contacts Table */}
          {contacts.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#111b21' }}>
                  Target Audience ({contactStats.total} total contacts in this file)
                </h3>
                <div style={{ display: 'flex', gap: '10px', fontSize: '12px' }}>
                  <span style={{ color: '#16a34a', fontWeight: 600 }}>✓ {contactStats.valid} Valid Numbers</span>
                  {contactStats.invalid > 0 && (
                    <span style={{ color: '#dc2626', fontWeight: 600 }}>⚠️ {contactStats.invalid} Invalid</span>
                  )}
                </div>
              </div>

              <div style={{
                maxHeight: '220px',
                overflowY: 'auto',
                border: '1px solid #e9edef',
                borderRadius: '8px',
                background: '#ffffff',
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', textAlign: 'left' }}>
                  <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e9edef', color: '#54656f', position: 'sticky', top: 0 }}>
                    <tr>
                      <th style={{ padding: '8px 14px', fontWeight: 600 }}>#</th>
                      <th style={{ padding: '8px 14px', fontWeight: 600 }}>Name</th>
                      <th style={{ padding: '8px 14px', fontWeight: 600 }}>Phone</th>
                      <th style={{ padding: '8px 14px', fontWeight: 600 }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contacts.slice(0, 100).map((c, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f0f2f5', color: '#111b21' }}>
                        <td style={{ padding: '8px 14px', color: '#8696a0' }}>{i + 1}</td>
                        <td style={{ padding: '8px 14px', fontWeight: 600 }}>{c.name || "—"}</td>
                        <td style={{ padding: '8px 14px', fontFamily: 'monospace' }}>{c.normalized_phone || c.raw_phone}</td>
                        <td style={{ padding: '8px 14px' }}>
                          <span style={{
                            padding: '2px 7px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 700,
                            background: c.is_valid !== false ? '#dcfce7' : '#fee2e2',
                            color: c.is_valid !== false ? '#16a34a' : '#dc2626',
                          }}>
                            {c.is_valid !== false ? "Valid" : "Invalid"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* STEP 2: CHOOSE FROM STORE OR CUSTOM MESSAGE */}
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e9edef',
          padding: '28px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <span style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              background: '#00a884',
              color: '#fff',
              fontWeight: 700,
              fontSize: '13.5px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>2</span>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#111b21' }}>
                Select Message Content
              </h2>
              <p style={{ fontSize: '12.5px', color: '#54656f' }}>
                Select text templates, promotional images, or catalogs from your Store
              </p>
            </div>
          </div>

          {/* Mode Switcher */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
            <button
              type="button"
              onClick={() => setMessageMode("store")}
              style={{
                flex: 1,
                padding: '14px',
                borderRadius: '10px',
                background: messageMode === "store" ? '#e7f7f3' : '#ffffff',
                border: messageMode === "store" ? '2px solid #00a884' : '1px solid #e2e8f0',
                color: '#111b21',
                textAlign: 'left',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <FolderArchive style={{ width: '18px', height: '18px', color: '#00a884' }} />
                <span style={{ fontSize: '14px', fontWeight: 700 }}>Choose from Store</span>
              </div>
              <p style={{ fontSize: '12px', color: '#54656f' }}>
                Pick text templates, product photos, or documents uploaded in your Store
              </p>
            </button>

            <button
              type="button"
              onClick={() => setMessageMode("custom")}
              style={{
                flex: 1,
                padding: '14px',
                borderRadius: '10px',
                background: messageMode === "custom" ? '#e7f7f3' : '#ffffff',
                border: messageMode === "custom" ? '2px solid #00a884' : '1px solid #e2e8f0',
                color: '#111b21',
                textAlign: 'left',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <Edit3 style={{ width: '18px', height: '18px', color: '#00a884' }} />
                <span style={{ fontSize: '14px', fontWeight: 700 }}>Write Custom Message</span>
              </div>
              <p style={{ fontSize: '12px', color: '#54656f' }}>
                Write text on the fly with personalized tags (name, phone, email)
              </p>
            </button>
          </div>

          {/* STORE PICKER */}
          {messageMode === "store" ? (
            <div>
              {/* Sub-tabs for Store */}
              <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
                {[
                  { id: "all", label: `All Store Items (${storeTemplates.length + storeMedia.length})` },
                  { id: "text", label: `Text Templates (${storeTemplates.length})` },
                  { id: "image", label: `Images (${storeMedia.filter(m => m.type === "image" || m.mime_type?.startsWith("image/")).length})` },
                  { id: "document", label: `Documents (${storeMedia.filter(m => m.type === "document" || (!m.type?.startsWith("image") && !m.mime_type?.startsWith("image/"))).length})` },
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setStoreFilterTab(tab.id as any)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      background: storeFilterTab === tab.id ? '#00a884' : '#f0f2f5',
                      color: storeFilterTab === tab.id ? '#fff' : '#54656f',
                      border: 'none',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Store Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: '12px',
                maxHeight: '340px',
                overflowY: 'auto',
                padding: '4px',
                background: '#f8fafc',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
              }}>
                {/* 1. Text Templates */}
                {filteredStoreTemplates.map(t => {
                  const isSelected = selectedStoreItem?.type === "text" && selectedStoreItem.id === t.id;
                  return (
                    <div
                      key={`tmpl_${t.id}`}
                      onClick={() => setSelectedStoreItem({
                        type: "text",
                        id: t.id,
                        name: t.name,
                        content: t.content,
                      })}
                      style={{
                        background: isSelected ? '#e7f7f3' : '#ffffff',
                        border: isSelected ? '2px solid #00a884' : '1px solid #e2e8f0',
                        borderRadius: '10px',
                        padding: '14px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <FileText style={{ width: '15px', height: '15px', color: '#00a884' }} />
                            <span style={{ fontSize: '13px', fontWeight: 700, color: '#111b21' }}>{t.name}</span>
                          </div>
                          {isSelected && <span style={{ fontSize: '10px', fontWeight: 700, background: '#00a884', color: '#fff', padding: '1px 6px', borderRadius: '4px' }}>SELECTED</span>}
                        </div>
                        <p style={{ fontSize: '12px', color: '#54656f', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {t.content}
                        </p>
                      </div>
                    </div>
                  );
                })}

                {/* 2. Images */}
                {filteredStoreImages.map(img => {
                  const mediaUrl = getFullMediaUrl(img.public_url);
                  const displayName = img.filename || img.name || "Image Asset";
                  const isSelected = selectedStoreItem?.type === "image" && selectedStoreItem?.id === img.id;
                  return (
                    <div
                      key={`img_${img.id}`}
                      onClick={() => setSelectedStoreItem({
                        type: "image",
                        id: img.id,
                        name: displayName,
                        content: img.caption || "",
                        public_url: mediaUrl,
                      })}
                      style={{
                        background: isSelected ? '#e7f7f3' : '#ffffff',
                        border: isSelected ? '2px solid #00a884' : '1px solid #e2e8f0',
                        borderRadius: '10px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                    >
                      <div style={{ height: '110px', background: '#f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        <img
                          src={mediaUrl}
                          alt={displayName}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                      <div style={{ padding: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#111b21', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {displayName}
                          </span>
                          {isSelected && <span style={{ fontSize: '9.5px', fontWeight: 700, background: '#00a884', color: '#fff', padding: '1px 5px', borderRadius: '4px' }}>SELECTED</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* 3. Documents */}
                {filteredStoreDocs.map(doc => {
                  const mediaUrl = getFullMediaUrl(doc.public_url);
                  const displayName = doc.filename || doc.name || "Document Asset";
                  const isSelected = selectedStoreItem?.type === "document" && selectedStoreItem?.id === doc.id;
                  return (
                    <div
                      key={`doc_${doc.id}`}
                      onClick={() => setSelectedStoreItem({
                        type: "document",
                        id: doc.id,
                        name: displayName,
                        content: doc.caption || "",
                        public_url: mediaUrl,
                      })}
                      style={{
                        background: isSelected ? '#e7f7f3' : '#ffffff',
                        border: isSelected ? '2px solid #00a884' : '1px solid #e2e8f0',
                        borderRadius: '10px',
                        padding: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                      }}
                    >
                      <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#ffedd5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ea580c', flexShrink: 0 }}>
                        <FileIcon style={{ width: '18px', height: '18px' }} />
                      </div>
                      <div style={{ overflow: 'hidden', flex: 1 }}>
                        <p style={{ fontSize: '12.5px', fontWeight: 700, color: '#111b21', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {displayName}
                        </p>
                        <p style={{ fontSize: '11px', color: '#8696a0' }}>PDF Document</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Custom Mode Form */
            <div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#111b21', marginBottom: '8px' }}>
                  Custom Message Text
                </label>
                <textarea
                  rows={4}
                  placeholder="Type your WhatsApp broadcast message here... Use {{name}} for dynamic tags."
                  value={customText}
                  onChange={e => setCustomText(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    background: '#f0f2f5',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    color: '#111b21',
                    fontSize: '13.5px',
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />
              </div>

              {/* Variable Helper Pills */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
                <span style={{ fontSize: '12px', color: '#667781' }}>Insert tags:</span>
                {["name", "phone", "email"].map(v => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => insertVariable(v)}
                    style={{
                      padding: '4px 10px',
                      background: '#e7f7f3',
                      border: '1px solid rgba(0, 168, 132, 0.25)',
                      borderRadius: '6px',
                      color: '#008069',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    + {`{{${v}}}`}
                  </button>
                ))}
              </div>

              {/* Media Attachment Upload & Live Preview Card */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#111b21', marginBottom: '8px' }}>
                  Attach Media (Image, PDF, Document) — Optional
                </label>

                {!customMediaFile ? (
                  <label style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px',
                    border: '2px dashed #cbd5e1',
                    borderRadius: '10px',
                    background: '#f8fafc',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#008069', fontWeight: 600, fontSize: '13.5px', marginBottom: '4px' }}>
                      <Upload style={{ width: '16px', height: '16px' }} />
                      <span>Click or drag image or document here</span>
                    </div>
                    <p style={{ fontSize: '11.5px', color: '#667781' }}>
                      Supports PNG, JPG, WEBP, PDF, DOCX, XLSX, CSV (Up to 25MB)
                    </p>
                    <input
                      type="file"
                      onChange={e => setCustomMediaFile(e.target.files?.[0] || null)}
                      style={{ display: 'none' }}
                    />
                  </label>
                ) : (
                  /* Attached Media Card Preview */
                  <div style={{
                    padding: '14px 16px',
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                      {customMediaPreview ? (
                        <div style={{ width: '48px', height: '48px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, border: '1px solid #86efac' }}>
                          <img src={customMediaPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      ) : (
                        <div style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '8px',
                          background: '#fed7aa',
                          color: '#c2410c',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          fontWeight: 800,
                          fontSize: '11px',
                        }}>
                          <FileIcon style={{ width: '20px', height: '20px' }} />
                        </div>
                      )}

                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: '#111b21', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {customMediaFile.name}
                          </span>
                          <span style={{
                            fontSize: '10.5px',
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: '4px',
                            background: '#dcfce7',
                            color: '#16a34a',
                          }}>
                            {customMediaFile.name.split('.').pop()?.toUpperCase() || "FILE"}
                          </span>
                        </div>
                        <p style={{ fontSize: '11.5px', color: '#54656f', marginTop: '2px' }}>
                          {formatBytes(customMediaFile.size)} • Ready to broadcast
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setCustomMediaFile(null)}
                      title="Remove attachment"
                      style={{
                        padding: '6px 12px',
                        background: '#fee2e2',
                        border: '1px solid #fca5a5',
                        borderRadius: '6px',
                        color: '#dc2626',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        flexShrink: 0,
                      }}
                    >
                      <X style={{ width: '13px', height: '13px' }} />
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* SAVE TO ASSET STORE TOGGLE */}
              <div style={{
                marginTop: '16px',
                padding: '14px 16px',
                background: '#f8fafc',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
              }}>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FolderArchive style={{ width: '18px', height: '18px', color: '#00a884' }} />
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 700, color: '#111b21' }}>
                        Save to Asset Store for future use
                      </p>
                      <p style={{ fontSize: '11.5px', color: '#667781' }}>
                        Save this custom message text or attachment into your permanent Store library
                      </p>
                    </div>
                  </div>

                  <input
                    type="checkbox"
                    checked={saveToStore}
                    onChange={e => setSaveToStore(e.target.checked)}
                    style={{
                      width: '18px',
                      height: '18px',
                      accentColor: '#00a884',
                      cursor: 'pointer',
                    }}
                  />
                </label>

                {saveToStore && (
                  <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#54656f', marginBottom: '6px' }}>
                      Asset Name in Store (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Festival VIP Discount Promo"
                      value={storeAssetName}
                      onChange={e => setStoreAssetName(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        fontSize: '13px',
                        outline: 'none',
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Live Message Preview Styled Like WhatsApp */}
          <div style={{ marginTop: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#667781', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                WhatsApp Live Preview
              </label>
              <span style={{ fontSize: '11.5px', color: '#8696a0' }}>
                Previewing as: {contacts[0]?.name || contacts[0]?.first_name || "Sai Sathwik"}
              </span>
            </div>

            <div style={{
              background: '#efeae2',
              backgroundImage: 'radial-gradient(#d1d7db 1px, transparent 1px)',
              backgroundSize: '16px 16px',
              borderRadius: '14px',
              padding: '20px',
              border: '1px solid #e9edef',
            }}>
              <div style={{
                background: '#d9fdd3',
                color: '#111b21',
                padding: '8px 10px',
                borderRadius: '8px 8px 2px 8px',
                maxWidth: '360px',
                marginLeft: 'auto',
                boxShadow: '0 1px 2px rgba(11,20,26,0.15)',
                fontSize: '13.5px',
                lineHeight: 1.4,
              }}>
                {/* 1. Image Preview in WhatsApp Bubble */}
                {messageMode === "store" && selectedStoreItem?.type === "image" && selectedStoreItem.public_url && (
                  <div style={{ marginBottom: '6px', borderRadius: '6px', overflow: 'hidden' }}>
                    <img
                      src={selectedStoreItem.public_url}
                      alt="Selected preview"
                      style={{ width: '100%', maxHeight: '200px', objectFit: 'cover' }}
                    />
                  </div>
                )}

                {messageMode === "custom" && customMediaPreview && (
                  <div style={{ marginBottom: '6px', borderRadius: '6px', overflow: 'hidden' }}>
                    <img
                      src={customMediaPreview}
                      alt="Custom preview"
                      style={{ width: '100%', maxHeight: '200px', objectFit: 'cover' }}
                    />
                  </div>
                )}

                {/* 2. Document Preview Card in WhatsApp Bubble */}
                {((messageMode === "store" && selectedStoreItem?.type === "document") || (messageMode === "custom" && customMediaFile && !customMediaPreview)) && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    background: '#c4f2be',
                    borderRadius: '7px',
                    marginBottom: '6px',
                    border: '1px solid rgba(0,0,0,0.06)',
                  }}>
                    <div style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '8px',
                      background: '#ea580c',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <FileIcon style={{ width: '20px', height: '20px' }} />
                    </div>
                    <div style={{ overflow: 'hidden', flex: 1 }}>
                      <p style={{ fontSize: '13px', fontWeight: 700, color: '#111b21', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {messageMode === "store" ? selectedStoreItem?.name : customMediaFile?.name}
                      </p>
                      <p style={{ fontSize: '11px', color: '#54656f', marginTop: '1px' }}>
                        {messageMode === "store" ? "PDF Document" : `${formatBytes(customMediaFile?.size || 0)} • ${(customMediaFile?.name.split('.').pop() || 'DOC').toUpperCase()}`}
                      </p>
                    </div>
                  </div>
                )}

                {/* 3. Text Message Caption */}
                <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', padding: '2px 4px' }}>
                  {(() => {
                    const raw = messageMode === "store"
                      ? (selectedStoreItem?.content || "")
                      : (customText || "");
                    const sampleName = contacts[0]?.name || contacts[0]?.first_name || "Sai Sathwik";
                    const samplePhone = contacts[0]?.phone || contacts[0]?.normalized_phone || "+91 98857 33334";
                    return raw
                      ? raw.replace(/\{\{name\}\}/gi, sampleName).replace(/\{\{phone\}\}/gi, samplePhone)
                      : (customMediaFile || selectedStoreItem?.public_url ? "" : "Type a message above...");
                  })()}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', marginTop: '4px' }}>
                  <span style={{ fontSize: '10.5px', color: '#667781' }}>
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <CheckCircle2 style={{ width: '13px', height: '13px', color: '#53bdeb' }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* STEP 3: DISPATCH TIMING */}
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e9edef',
          padding: '28px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <span style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              background: '#00a884',
              color: '#fff',
              fontWeight: 700,
              fontSize: '13.5px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>3</span>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#111b21' }}>
                Delivery Schedule
              </h2>
              <p style={{ fontSize: '12.5px', color: '#54656f' }}>
                Choose whether to dispatch this broadcast immediately or schedule for a future date
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '14px', marginBottom: '20px' }}>
            <label style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '14px 18px',
              borderRadius: '10px',
              background: sendTiming === "now" ? '#e7f7f3' : '#ffffff',
              border: sendTiming === "now" ? '2px solid #00a884' : '1px solid #e2e8f0',
              cursor: 'pointer',
            }}>
              <input
                type="radio"
                name="sendTiming"
                checked={sendTiming === "now"}
                onChange={() => setSendTiming("now")}
                style={{ accentColor: '#00a884', width: '16px', height: '16px' }}
              />
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#111b21' }}>Send Immediately</p>
                <p style={{ fontSize: '12px', color: '#54656f' }}>Queue and deliver to all recipients in this uploaded list right now</p>
              </div>
            </label>

            <label style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '14px 18px',
              borderRadius: '10px',
              background: sendTiming === "schedule" ? '#e7f7f3' : '#ffffff',
              border: sendTiming === "schedule" ? '2px solid #00a884' : '1px solid #e2e8f0',
              cursor: 'pointer',
            }}>
              <input
                type="radio"
                name="sendTiming"
                checked={sendTiming === "schedule"}
                onChange={() => setSendTiming("schedule")}
                style={{ accentColor: '#00a884', width: '16px', height: '16px' }}
              />
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#111b21' }}>Schedule Broadcast</p>
                <p style={{ fontSize: '12px', color: '#54656f' }}>Pick a target date & time for automated dispatch</p>
              </div>
            </label>
          </div>

          {sendTiming === "schedule" && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              background: '#f8fafc',
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
            }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#111b21', marginBottom: '6px' }}>
                  Target Date *
                </label>
                <input
                  type="date"
                  required
                  value={scheduledDate}
                  onChange={e => setScheduledDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    color: '#111b21',
                    fontSize: '13.5px',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#111b21', marginBottom: '6px' }}>
                  Target Time *
                </label>
                <input
                  type="time"
                  required
                  value={scheduledTime}
                  onChange={e => setScheduledTime(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    color: '#111b21',
                    fontSize: '13.5px',
                    outline: 'none',
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Submit Action Bar */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '14px' }}>
          <button
            type="button"
            onClick={() => router.push("/")}
            style={{
              padding: '12px 24px',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              color: '#54656f',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              padding: '12px 32px',
              background: '#00a884',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(0, 168, 132, 0.35)',
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                <span>Processing Broadcast...</span>
              </>
            ) : (
              <>
                <Send style={{ width: '16px', height: '16px' }} />
                <span>{sendTiming === "now" ? "Send Broadcast Now" : "Schedule Broadcast"}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
