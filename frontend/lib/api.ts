// Base URL for the VitalCore backend.
// NEXT_PUBLIC_API_URL should be set in Vercel (Production) to the Render backend URL.
// If it isn't set, fall back to the known production backend on any non-localhost
// host, so the deployed site still works instead of silently calling localhost.
const PRODUCTION_API_URL = 'https://vitalcore-api.onrender.com'
const LOCAL_API_URL = 'http://localhost:8000'

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? PRODUCTION_API_URL
    : LOCAL_API_URL)

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers)
  if (typeof window !== 'undefined') {
    try {
      const stored = JSON.parse(localStorage.getItem('vc_user') || 'null') as { access_token?: string } | null
      if (stored?.access_token) headers.set('Authorization', `Bearer ${stored.access_token}`)
    } catch {
      localStorage.removeItem('vc_user')
    }
  }
  return fetch(`${API_BASE_URL}${path}`, { ...init, headers })
}
