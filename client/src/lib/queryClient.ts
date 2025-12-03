import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// CSRF Token management using Double Submit Cookie pattern
// The token is stored in a cookie (set by server) and sent in header
let csrfTokenPromise: Promise<string> | null = null;

// Read CSRF token from cookie
function getCsrfTokenFromCookie(): string | null {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'csrf-token') {
      return value;
    }
  }
  return null;
}

// Fetch new CSRF token from server (also sets cookie)
async function fetchCsrfToken(): Promise<string> {
  const res = await fetch("/api/csrf-token", { credentials: "include" });
  if (!res.ok) {
    throw new Error("Failed to fetch CSRF token");
  }
  const data = await res.json();
  return data.csrfToken;
}

// Get CSRF token - first from cookie, then fetch if needed
async function getCsrfToken(): Promise<string | null> {
  // First try to get from cookie
  const cookieToken = getCsrfTokenFromCookie();
  if (cookieToken) {
    return cookieToken;
  }
  
  // Prevent multiple concurrent fetches
  if (csrfTokenPromise) return csrfTokenPromise;
  
  try {
    csrfTokenPromise = fetchCsrfToken();
    await csrfTokenPromise;
    // After fetch, the cookie should be set
    return getCsrfTokenFromCookie();
  } catch (e) {
    // User might not be authenticated yet
    return null;
  } finally {
    csrfTokenPromise = null;
  }
}

// Reset CSRF token (call on logout - cookie will be cleared by browser on next request)
export function resetCsrfToken() {
  csrfTokenPromise = null;
  // Clear the cookie
  document.cookie = 'csrf-token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
}

// Refresh CSRF token (call after login)
export async function refreshCsrfToken() {
  csrfTokenPromise = null;
  return fetchCsrfToken().catch(() => null);
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const headers: Record<string, string> = {};
  
  if (data) {
    headers["Content-Type"] = "application/json";
  }
  
  // Add CSRF token for state-changing requests
  if (!["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase())) {
    const token = await getCsrfToken();
    if (token) {
      headers["X-CSRF-Token"] = token;
    }
  }
  
  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  // If CSRF token is invalid, refresh and retry once
  if (res.status === 403) {
    const errorText = await res.clone().text();
    if (errorText.includes("CSRF")) {
      // Clear the cookie and fetch a new token
      resetCsrfToken();
      await refreshCsrfToken();
      const newToken = getCsrfTokenFromCookie();
      if (newToken) {
        headers["X-CSRF-Token"] = newToken;
        const retryRes = await fetch(url, {
          method,
          headers,
          body: data ? JSON.stringify(data) : undefined,
          credentials: "include",
        });
        await throwIfResNotOk(retryRes);
        return retryRes;
      }
    }
  }

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "returnNull" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 60000,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
