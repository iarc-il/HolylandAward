/**
 * Get the API base URL from environment variables
 * Falls back to localhost:1293 for development
 */
export const getApiBaseUrl = (): string => {
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:1293';
};

/**
 * Create a fetch wrapper with consistent API base URL and error handling
 */
export const apiClient = {
  async fetch(endpoint: string, options: RequestInit = {}) {
    const url = `${getApiBaseUrl()}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response;
  },

  async get(endpoint: string, headers?: HeadersInit) {
    return this.fetch(endpoint, { method: 'GET', headers });
  },

  async post(endpoint: string, data?: any, headers?: HeadersInit) {
    return this.fetch(endpoint, {
      method: 'POST',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  async patch(endpoint: string, data?: any, headers?: HeadersInit) {
    return this.fetch(endpoint, {
      method: 'PATCH',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  async put(endpoint: string, data?: any, headers?: HeadersInit) {
    return this.fetch(endpoint, {
      method: 'PUT',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  async delete(endpoint: string, headers?: HeadersInit) {
    return this.fetch(endpoint, { method: 'DELETE', headers });
  },

  async upload(endpoint: string, formData: FormData, headers?: HeadersInit) {
    const url = `${getApiBaseUrl()}${endpoint}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers, // Don't set Content-Type for FormData, let browser set it
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response;
  },
};