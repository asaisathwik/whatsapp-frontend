export interface User {
  id: string;
  email: string;
  full_name: string;
  is_superuser?: boolean;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  role: string;
  default_country_code?: string;
}

export interface AuthState {
  access_token: string;
  user: User;
  organization: Organization;
}

export interface WhatsAppInstance {
  id: string;
  organization_id: string;
  instance_name: string;
  phone_number: string | null;
  status: "DISCONNECTED" | "CONNECTING" | "CONNECTED" | "QR_READY" | "FAILED";
  qr_code: string | null;
  is_default: boolean;
  created_at: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  status: "ACTIVE" | "UNSUBSCRIBED" | "BLOCKED" | "INVALID";
  source: string;
  custom_fields: Record<string, any>;
  tags: Tag[];
  created_at: string;
}

export interface Template {
  id: string;
  name: string;
  category: string;
  content: string;
  variables: string[];
  is_active: boolean;
  created_at: string;
}

export interface Campaign {
  id: string;
  name: string;
  whatsapp_instance_id: string | null;
  template_id: string | null;
  status: "DRAFT" | "SCHEDULED" | "QUEUED" | "RUNNING" | "PAUSED" | "COMPLETED" | "FAILED" | "CANCELLED";
  scheduled_at: string | null;
  total_recipients: number;
  sent_count: number;
  delivered_count: number;
  read_count: number;
  failed_count: number;
  rate_limit_per_second: number;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string | null;
  contact_id: string;
  direction: "INBOUND" | "OUTBOUND";
  message_type: "TEXT" | "IMAGE" | "VIDEO" | "DOCUMENT" | "AUDIO" | "LOCATION" | "TEMPLATE";
  content: string | null;
  media_url: string | null;
  status: "QUEUED" | "SENDING" | "SENT" | "DELIVERED" | "READ" | "FAILED";
  error_message?: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  read_at: string | null;
  created_at: string;
}

export interface Conversation {
  id: string;
  contact_id: string;
  contact_name: string;
  contact_phone: string;
  whatsapp_instance_id: string | null;
  status: "OPEN" | "CLOSED";
  ai_mode: "AI_ACTIVE" | "HUMAN_REQUESTED" | "HUMAN_ACTIVE" | "AI_RESUMED";
  assigned_user_id: string | null;
  unread_count: number;
  last_message_at: string;
  last_message?: Message | null;
}

export interface AIAgent {
  id: string;
  name: string;
  system_prompt: string;
  personality: string;
  model: string;
  status: string;
  business_description: string | null;
  faq_data: Array<{ question: string; answer: string }>;
  products_services: Array<Record<string, any>>;
  working_hours: Record<string, string>;
  allowed_tools: string[];
  handoff_rules: Record<string, any>;
  is_default: boolean;
}

export interface KnowledgeDoc {
  id: string;
  title: string;
  category: string;
  content: string;
  created_at: string;
}

export interface DashboardMetrics {
  messages_sent: number;
  messages_delivered: number;
  messages_read: number;
  messages_failed: number;
  messages_inbound: number;
  messages_outbound: number;
  active_conversations: number;
  ai_conversations: number;
  human_conversations: number;
  total_campaigns: number;
  total_contacts: number;
}
