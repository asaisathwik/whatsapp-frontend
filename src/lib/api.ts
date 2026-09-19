export const getApiBase = (): string => {
  const url = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  return url.replace(/\/+$/, "");
};

export class ApiClient {
  private static getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("saas_token");
  }

  public static setAuth(token: string, user: any, org: any) {
    if (typeof window === "undefined") return;
    localStorage.setItem("saas_token", token);
    localStorage.setItem("saas_user", JSON.stringify(user));
    localStorage.setItem("saas_org", JSON.stringify(org));
  }

  public static clearAuth() {
    if (typeof window === "undefined") return;
    localStorage.removeItem("saas_token");
    localStorage.removeItem("saas_user");
    localStorage.removeItem("saas_org");
  }

  public static getAuth() {
    if (typeof window === "undefined") return null;
    const token = localStorage.getItem("saas_token");
    const user = localStorage.getItem("saas_user");
    const org = localStorage.getItem("saas_org");
    if (!token || !user || !org) return null;
    try {
      return {
        token,
        user: JSON.parse(user),
        organization: JSON.parse(org)
      };
    } catch {
      return null;
    }
  }

  public static getAuthToken(): string | null {
    return this.getToken();
  }

  public static async upload<T = any>(endpoint: string, formData: FormData): Promise<T> {
    await this.ensureAuth();
    const token = this.getToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const url = `${getApiBase()}${endpoint}`;
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: formData,
    });
    if (!res.ok) {
      const errorText = await res.text();
      let errorJson;
      try {
        errorJson = JSON.parse(errorText);
      } catch {
        errorJson = { detail: errorText || res.statusText };
      }
      throw new Error(errorJson.detail || `Upload failed with status ${res.status}`);
    }
    return res.json();
  }

  public static async request<T = any>(endpoint: string, options: RequestInit = {}, isRetry = false): Promise<T> {
    await this.ensureAuth();
    const token = this.getToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s safety timeout

    const url = `${getApiBase()}${endpoint}`;
    try {
      const res = await fetch(url, {
        ...options,
        signal: options.signal || controller.signal,
        headers,
      });

      clearTimeout(timeoutId);

      if (res.status === 401 && !isRetry) {
        // Token expired - clear and re-auth once
        this.clearAuth();
        await this.ensureAuth(true);
        return this.request<T>(endpoint, options, true);
      }

      if (!res.ok) {
        const errorText = await res.text();
        let errorJson;
        try {
          errorJson = JSON.parse(errorText);
        } catch {
          errorJson = { detail: errorText || res.statusText };
        }
        throw new Error(errorJson.detail || `Request failed with status ${res.status}`);
      }

      return res.json();
    } catch (err: any) {
      clearTimeout(timeoutId);
      throw err;
    }
  }

  // Quick auto-login or register for instant demo preview
  public static async ensureAuth(force = false): Promise<void> {
    if (!force && this.getAuth()) return;
    try {
      const base = getApiBase();
      const res = await fetch(`${base}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "demo@business.com",
          password: "demopassword123"
        })
      });

      if (res.ok) {
        const authRes = await res.json();
        this.setAuth(authRes.access_token, authRes.user, authRes.organization);
        return;
      }

      // If login failed, register
      const regRes = await fetch(`${base}/api/v1/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "demo@business.com",
          full_name: "Demo Admin",
          password: "demopassword123",
          organization_name: "Demo Enterprise"
        })
      });

      if (regRes.ok) {
        const data = await regRes.json();
        this.setAuth(data.access_token, data.user, data.organization);
      }
    } catch (e) {
      console.warn("Auto auth setup notice:", e);
    }
  }
}
