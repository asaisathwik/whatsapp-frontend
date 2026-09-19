# 🚀 WhatsApp AI SaaS - Frontend

A modern, high-performance Next.js 14 web application for WhatsApp Marketing, AI Auto-Replies, Campaign Broadcasting, Live Chat Monitoring, and Media Content Store.

---

## ✨ Features

- **📊 Dashboard**: Real-time campaign stats, active sessions, deliverability analytics, and system health monitors.
- **⚡ Broadcast Campaigns**: CSV contact upload, multi-column merge tags, media attachment support, real-time progress bar, and instant retry.
- **💬 Live WhatsApp Web Hub**: Real-time connected session viewer with incoming/outgoing message feeds, image lightbox, document download previews, and QR status check.
- **✉️ User-Friendly Send Composer**: Live WhatsApp chat bubble preview, one-click template variable tags (`{{name}}`, `{{phone}}`), and direct file attachment.
- **📁 Content Store**: Save templates, text snippets, and uploaded documents/images into a persistent media store for one-click reuse.
- **📜 Detailed Broadcast History & Recipient Audit**: Complete audit logs of all sent, pending, and failed campaign recipients with one-click individual or bulk retry.
- **🔐 Authentication**: Fast JWT-based login, signup, session guard, and auto-redirects.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 14 (App Router)](https://nextjs.org/)
- **UI & Icons**: [Lucide React](https://lucide.dev/), Custom Glassmorphic Dark Design System
- **State & Networking**: React Hooks, Fetch API with JWT Bearer Token Injection
- **Animations**: CSS3 GPU Transitions & Keyframe Animations

---

## 🏁 Getting Started

### 1. Prerequisites
- Node.js 18+ or 20+
- npm or yarn

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/asaisathwik/whatsapp-frontend.git
cd whatsapp-frontend

# Install dependencies
npm install
```

### 3. Environment Setup
Create a `.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```
*(For production, replace `http://localhost:8000` with your deployed FastAPI backend URL, e.g., `https://your-backend.koyeb.app` or `https://your-backend.onrender.com`)*

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🚢 Free Deployment to Vercel

1. Push your code to GitHub.
2. Sign in to [Vercel](https://vercel.com) with your GitHub account.
3. Click **"Add New Project"** and import `whatsapp-frontend`.
4. Add the Environment Variable:
   - `NEXT_PUBLIC_API_URL` = `https://<YOUR_BACKEND_URL>`
5. Click **Deploy**. Vercel will build and assign an SSL `.vercel.app` domain automatically.

---

## 📄 License
MIT License.
