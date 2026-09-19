"use client";

import React, { useState, useEffect } from "react";
import {
  FolderArchive,
  FileText,
  Image as ImageIcon,
  File as FileIcon,
  Plus,
  Trash2,
  Send,
  ExternalLink,
  Upload,
  X,
  Loader2,
  CheckCircle2,
  Copy,
  Eye,
  Download,
} from "lucide-react";
import { ApiClient } from "@/lib/api";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function StorePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"all" | "text" | "image" | "document">("all");
  const [templates, setTemplates] = useState<any[]>([]);
  const [media, setMedia] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modals
  const [modalType, setModalType] = useState<"text" | "image" | "document" | null>(null);
  
  // Text template form
  const [templateName, setTemplateName] = useState("");
  const [templateCategory, setTemplateCategory] = useState("MARKETING");
  const [templateContent, setTemplateContent] = useState("");

  // Media upload form
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileCaption, setFileCaption] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadStoreData();
  }, []);

  // Cleanup object URL
  useEffect(() => {
    if (selectedFile && selectedFile.type.startsWith("image/")) {
      const objectUrl = URL.createObjectURL(selectedFile);
      setFilePreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } else {
      setFilePreview(null);
    }
  }, [selectedFile]);

  async function loadStoreData() {
    setLoading(true);
    try {
      await ApiClient.ensureAuth();
      const [tmplList, mediaList] = await Promise.all([
        ApiClient.request("/api/v1/templates").catch(() => []),
        ApiClient.request("/api/v1/media").catch(() => []),
      ]);
      setTemplates(Array.isArray(tmplList) ? tmplList : []);
      setMedia(Array.isArray(mediaList) ? mediaList : []);
    } catch (err) {
      console.error("Failed to load store data:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateTemplate(e: React.FormEvent) {
    e.preventDefault();
    if (!templateName.trim() || !templateContent.trim()) return;
    setUploading(true);
    try {
      await ApiClient.request("/api/v1/templates", {
        method: "POST",
        body: JSON.stringify({
          name: templateName.trim(),
          category: templateCategory,
          content: templateContent.trim(),
        }),
      });
      setModalType(null);
      setTemplateName("");
      setTemplateContent("");
      loadStoreData();
    } catch (err: any) {
      alert(err.message || "Failed to save template");
    } finally {
      setUploading(false);
    }
  }

  async function handleUploadMedia(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      
      await ApiClient.upload("/api/v1/media/upload", formData);

      setModalType(null);
      setSelectedFile(null);
      setFilePreview(null);
      setFileCaption("");
      loadStoreData();
    } catch (err: any) {
      alert(err.message || "Failed to upload file");
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteTemplate(id: string) {
    if (!confirm("Are you sure you want to delete this text template?")) return;
    try {
      await ApiClient.request(`/api/v1/templates/${id}`, { method: "DELETE" });
      setTemplates(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      alert("Failed to delete template");
    }
  }

  async function handleDeleteMedia(id: string) {
    if (!confirm("Are you sure you want to delete this media asset?")) return;
    try {
      await ApiClient.request(`/api/v1/media/${id}`, { method: "DELETE" });
      setMedia(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      alert("Failed to delete media");
    }
  }

  function handleCopyContent(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function handleUseInBroadcast(item: any, type: "text" | "image" | "document") {
    const itemName = item.filename || item.name || item.original_filename || "Asset";
    const fullUrl = item.public_url ? (item.public_url.startsWith("http") ? item.public_url : `${API_BASE}${item.public_url}`) : undefined;
    
    sessionStorage.setItem("selected_store_item", JSON.stringify({
      type,
      id: item.id,
      name: itemName,
      content: item.content || item.caption || "",
      public_url: fullUrl,
    }));
    router.push("/send");
  }

  const getFullMediaUrl = (url?: string) => {
    if (!url) return "";
    return url.startsWith("http") ? url : `${API_BASE}${url}`;
  };

  const filteredTemplates = activeTab === "all" || activeTab === "text" ? templates : [];
  const filteredImages = activeTab === "all" || activeTab === "image"
    ? media.filter(m => m.type === "image" || m.mime_type?.startsWith("image/") || m.media_type === "IMAGE")
    : [];
  const filteredDocs = activeTab === "all" || activeTab === "document"
    ? media.filter(m => m.type === "document" || m.media_type === "DOCUMENT" || (!m.type?.startsWith("image") && !m.mime_type?.startsWith("image/")))
    : [];

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Top Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px',
      }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#111b21', letterSpacing: '-0.01em' }}>
            Asset & Template Store
          </h1>
          <p style={{ fontSize: '13.5px', color: '#54656f', marginTop: '2px' }}>
            Upload and manage WhatsApp text templates, promotional images, product catalogs, and PDF documents for your campaigns.
          </p>
        </div>

        {/* Action Buttons to Add */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => { setSelectedFile(null); setFilePreview(null); setModalType("text"); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 16px',
              background: '#00a884',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0, 168, 132, 0.25)',
            }}
          >
            <Plus style={{ width: '15px', height: '15px' }} />
            <span>Add Text Template</span>
          </button>

          <button
            onClick={() => { setSelectedFile(null); setFilePreview(null); setModalType("image"); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 16px',
              background: '#ffffff',
              color: '#0284c7',
              border: '1px solid #bae6fd',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <ImageIcon style={{ width: '15px', height: '15px' }} />
            <span>Upload Image</span>
          </button>

          <button
            onClick={() => { setSelectedFile(null); setFilePreview(null); setModalType("document"); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 16px',
              background: '#ffffff',
              color: '#ea580c',
              border: '1px solid #fed7aa',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <FileIcon style={{ width: '15px', height: '15px' }} />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* Tabs Filter */}
      <div style={{
        display: 'flex',
        gap: '8px',
        borderBottom: '1px solid #e9edef',
        paddingBottom: '12px',
        marginBottom: '24px',
      }}>
        {[
          { id: "all", label: `All Assets (${templates.length + media.length})` },
          { id: "text", label: `Text Templates (${templates.length})` },
          { id: "image", label: `Images (${media.filter(m => m.type === "image" || m.mime_type?.startsWith("image/")).length})` },
          { id: "document", label: `Documents (${media.filter(m => m.type === "document" || (!m.type?.startsWith("image") && !m.mime_type?.startsWith("image/"))).length})` },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              background: activeTab === tab.id ? '#00a884' : '#ffffff',
              color: activeTab === tab.id ? '#fff' : '#54656f',
              border: activeTab === tab.id ? 'none' : '1px solid #e2e8f0',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#8696a0' }}>
          <Loader2 style={{ width: '32px', height: '32px', animation: 'spin 1s linear infinite', margin: '0 auto 12px', color: '#00a884' }} />
          <p>Loading your Store items...</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* 1. Text Templates Section */}
          {filteredTemplates.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <FileText style={{ width: '18px', height: '18px', color: '#00a884' }} />
                <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#111b21' }}>
                  Text Templates ({filteredTemplates.length})
                </h2>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '16px',
              }}>
                {filteredTemplates.map(t => (
                  <div
                    key={t.id}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e9edef',
                      borderRadius: '14px',
                      padding: '18px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '14.5px', fontWeight: 700, color: '#111b21' }}>{t.name}</span>
                        <span style={{
                          fontSize: '10.5px',
                          fontWeight: 700,
                          background: '#e7f7f3',
                          color: '#008069',
                          padding: '2px 8px',
                          borderRadius: '4px',
                        }}>
                          {t.category}
                        </span>
                      </div>
                      <div style={{
                        fontSize: '13px',
                        color: '#334155',
                        lineHeight: 1.5,
                        background: '#f8fafc',
                        padding: '12px 14px',
                        borderRadius: '8px',
                        border: '1px solid #f0f2f5',
                        marginBottom: '14px',
                        whiteSpace: 'pre-wrap',
                        maxHeight: '120px',
                        overflowY: 'auto',
                      }}>
                        {t.content}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f0f2f5', paddingTop: '12px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleCopyContent(t.content, t.id)}
                          title="Copy text"
                          style={{ background: 'transparent', border: 'none', color: copiedId === t.id ? '#16a34a' : '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
                        >
                          {copiedId === t.id ? <CheckCircle2 style={{ width: '13px', height: '13px' }} /> : <Copy style={{ width: '13px', height: '13px' }} />}
                          <span>{copiedId === t.id ? "Copied" : "Copy"}</span>
                        </button>

                        <button
                          onClick={() => handleDeleteTemplate(t.id)}
                          title="Delete template"
                          style={{ background: 'transparent', border: 'none', color: '#dc2626', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
                        >
                          <Trash2 style={{ width: '13px', height: '13px' }} />
                          <span>Delete</span>
                        </button>
                      </div>

                      <button
                        onClick={() => handleUseInBroadcast(t, "text")}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '7px 14px',
                          background: '#00a884',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          boxShadow: '0 2px 6px rgba(0,168,132,0.25)',
                        }}
                      >
                        <Send style={{ width: '12px', height: '12px' }} />
                        Use in Broadcast
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. Images Section */}
          {filteredImages.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <ImageIcon style={{ width: '18px', height: '18px', color: '#0284c7' }} />
                <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#111b21' }}>
                  Images & Promo Photos ({filteredImages.length})
                </h2>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '16px',
              }}>
                {filteredImages.map(img => {
                  const mediaUrl = getFullMediaUrl(img.public_url);
                  const displayName = img.filename || img.name || img.original_filename || "Image Asset";
                  return (
                    <div
                      key={img.id}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #e9edef',
                        borderRadius: '14px',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                      }}
                    >
                      <div style={{ height: '180px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
                        <img
                          src={mediaUrl}
                          alt={displayName}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                          }}
                        />
                        <a
                          href={mediaUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            background: 'rgba(255,255,255,0.85)',
                            padding: '4px',
                            borderRadius: '6px',
                            color: '#111b21',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <ExternalLink style={{ width: '14px', height: '14px' }} />
                        </a>
                      </div>

                      <div style={{ padding: '14px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <p style={{ fontSize: '13.5px', fontWeight: 700, color: '#111b21', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '2px' }}>
                            {displayName}
                          </p>
                          <p style={{ fontSize: '11.5px', color: '#8696a0' }}>
                            {img.file_size ? `${Math.round(img.file_size / 1024)} KB` : "Image Asset"}
                          </p>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f0f2f5', paddingTop: '10px', marginTop: '12px' }}>
                          <button
                            onClick={() => handleDeleteMedia(img.id)}
                            style={{ background: 'transparent', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Trash2 style={{ width: '13px', height: '13px' }} />
                            <span>Delete</span>
                          </button>
                          <button
                            onClick={() => handleUseInBroadcast(img, "image")}
                            style={{
                              padding: '7px 14px',
                              background: '#00a884',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              boxShadow: '0 2px 6px rgba(0,168,132,0.25)',
                            }}
                          >
                            <Send style={{ width: '12px', height: '12px' }} />
                            Use in Broadcast
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. Documents Section */}
          {filteredDocs.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <FileIcon style={{ width: '18px', height: '18px', color: '#ea580c' }} />
                <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#111b21' }}>
                  PDF & Documents ({filteredDocs.length})
                </h2>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '16px',
              }}>
                {filteredDocs.map(doc => {
                  const mediaUrl = getFullMediaUrl(doc.public_url);
                  const displayName = doc.filename || doc.name || doc.original_filename || "Document Asset";
                  return (
                    <div
                      key={doc.id}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #e9edef',
                        borderRadius: '14px',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '14px' }}>
                        <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#ffedd5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ea580c', flexShrink: 0 }}>
                          <FileIcon style={{ width: '22px', height: '22px' }} />
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                          <p style={{ fontSize: '13.5px', fontWeight: 700, color: '#111b21', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {displayName}
                          </p>
                          <p style={{ fontSize: '11.5px', color: '#8696a0', marginTop: '2px' }}>
                            {doc.file_size ? `${Math.round(doc.file_size / 1024)} KB` : "Document Asset"}
                          </p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f0f2f5', paddingTop: '10px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <a
                            href={mediaUrl}
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: '#0284c7', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', textDecoration: 'none' }}
                          >
                            <Download style={{ width: '13px', height: '13px' }} />
                            View
                          </a>

                          <button
                            onClick={() => handleDeleteMedia(doc.id)}
                            style={{ background: 'transparent', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Trash2 style={{ width: '13px', height: '13px' }} />
                            Delete
                          </button>
                        </div>

                        <button
                          onClick={() => handleUseInBroadcast(doc, "document")}
                          style={{
                            padding: '7px 14px',
                            background: '#00a884',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 2px 6px rgba(0,168,132,0.25)',
                          }}
                        >
                          <Send style={{ width: '12px', height: '12px' }} />
                          Use in Broadcast
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {filteredTemplates.length === 0 && filteredImages.length === 0 && filteredDocs.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: '#ffffff', borderRadius: '16px', border: '1px solid #e9edef' }}>
              <FolderArchive style={{ width: '40px', height: '40px', color: '#8696a0', margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#111b21', marginBottom: '6px' }}>
                No assets found in this category
              </h3>
              <p style={{ fontSize: '13px', color: '#54656f' }}>
                Use the buttons above to upload text templates, promotional images, or documents.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ─── MODAL 1: ADD TEXT TEMPLATE ─── */}
      {modalType === "text" && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(11,20,26,0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px',
        }}>
          <div style={{
            background: '#ffffff',
            border: '1px solid #e9edef',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '480px',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0,0,0,0.12)',
          }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #e9edef',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#111b21' }}>Create Text Template</h3>
              <button onClick={() => setModalType(null)} style={{ background: 'transparent', border: 'none', color: '#8696a0', fontSize: '18px', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleCreateTemplate} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#111b21', marginBottom: '6px' }}>
                  Template Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VIP Welcome Message"
                  value={templateName}
                  onChange={e => setTemplateName(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', background: '#f0f2f5', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#111b21', fontSize: '13.5px', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#111b21', marginBottom: '6px' }}>
                  Category
                </label>
                <select
                  value={templateCategory}
                  onChange={e => setTemplateCategory(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', background: '#f0f2f5', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#111b21', fontSize: '13.5px', outline: 'none' }}
                >
                  <option value="MARKETING">Marketing & Promotions</option>
                  <option value="SUPPORT">Customer Care & Support</option>
                  <option value="NOTIFICATION">Transactional & Alerts</option>
                </select>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12.5px', fontWeight: 600, color: '#111b21' }}>
                    Template Content *
                  </label>
                  <span style={{ fontSize: '11px', color: '#008069' }}>Use &#123;&#123;name&#125;&#125; for recipient name</span>
                </div>
                <textarea
                  rows={4}
                  required
                  placeholder="Hello {{name}}, thank you for choosing us! Here is your update..."
                  value={templateContent}
                  onChange={e => setTemplateContent(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', background: '#f0f2f5', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#111b21', fontSize: '13.5px', outline: 'none', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  style={{ flex: 1, padding: '10px', background: '#f0f2f5', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#54656f', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  style={{ flex: 1, padding: '10px', background: '#00a884', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                >
                  {uploading ? "Saving..." : "Save Template"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: UPLOAD IMAGE / DOCUMENT ─── */}
      {(modalType === "image" || modalType === "document") && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(11,20,26,0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px',
        }}>
          <div style={{
            background: '#ffffff',
            border: '1px solid #e9edef',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '480px',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0,0,0,0.12)',
          }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #e9edef',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#111b21' }}>
                {modalType === "image" ? "Upload Image Asset" : "Upload Document / Catalog"}
              </h3>
              <button onClick={() => setModalType(null)} style={{ background: 'transparent', border: 'none', color: '#8696a0', fontSize: '18px', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleUploadMedia} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#111b21', marginBottom: '8px' }}>
                  Select File ({modalType === "image" ? "PNG, JPG, WebP" : "PDF, DOCX, XLSX"}) *
                </label>

                <div style={{
                  border: '2px dashed #cbd5e1',
                  borderRadius: '10px',
                  padding: '20px',
                  textAlign: 'center',
                  background: '#f8fafc',
                  cursor: 'pointer',
                }}>
                  <input
                    type="file"
                    id="store-file-upload-input"
                    required
                    accept={modalType === "image" ? "image/png,image/jpeg,image/webp,image/gif" : ".pdf,.doc,.docx,.xls,.xlsx,.csv"}
                    onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="store-file-upload-input" style={{ cursor: 'pointer', display: 'block' }}>
                    {filePreview ? (
                      <div>
                        <img
                          src={filePreview}
                          alt="Preview"
                          style={{ maxHeight: '140px', maxWidth: '100%', borderRadius: '8px', objectFit: 'contain', margin: '0 auto 8px' }}
                        />
                        <p style={{ fontSize: '12.5px', fontWeight: 600, color: '#00a884' }}>
                          {selectedFile?.name} ({Math.round((selectedFile?.size || 0) / 1024)} KB)
                        </p>
                      </div>
                    ) : selectedFile ? (
                      <div>
                        <FileIcon style={{ width: '32px', height: '32px', color: '#ea580c', margin: '0 auto 6px' }} />
                        <p style={{ fontSize: '13px', fontWeight: 700, color: '#111b21' }}>{selectedFile.name}</p>
                        <p style={{ fontSize: '11.5px', color: '#64748b' }}>{Math.round(selectedFile.size / 1024)} KB</p>
                      </div>
                    ) : (
                      <div>
                        {modalType === "image" ? (
                          <ImageIcon style={{ width: '32px', height: '32px', color: '#0284c7', margin: '0 auto 6px' }} />
                        ) : (
                          <FileIcon style={{ width: '32px', height: '32px', color: '#ea580c', margin: '0 auto 6px' }} />
                        )}
                        <p style={{ fontSize: '13px', fontWeight: 600, color: '#111b21' }}>
                          Click to browse or drag file here
                        </p>
                        <p style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                          Maximum size: 25 MB
                        </p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => { setModalType(null); setSelectedFile(null); setFilePreview(null); }}
                  style={{ flex: 1, padding: '10px', background: '#f0f2f5', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#54656f', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !selectedFile}
                  style={{ flex: 1, padding: '10px', background: '#00a884', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  {uploading ? <Loader2 style={{ width: '14px', height: '14px', animation: 'spin 1s linear infinite' }} /> : <Upload style={{ width: '14px', height: '14px' }} />}
                  {uploading ? "Uploading..." : "Upload Asset"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
