const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('sysbovi_user');
    if (!raw) return null;
    return JSON.parse(raw).accessToken ?? null;
  } catch {
    return null;
  }
}

async function request<T>(
  method: string,
  endpoint: string,
  body?: unknown,
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401) {
    localStorage.removeItem('sysbovi_user');
    window.location.href = '/login';
    throw new Error('Sessão expirada.');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro desconhecido.' }));
    throw new Error(error.message ?? 'Erro na requisição.');
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}

export const api = {
  get: <T>(endpoint: string) => request<T>('GET', endpoint),
  post: <T>(endpoint: string, body: unknown) => request<T>('POST', endpoint, body),
  put: <T>(endpoint: string, body: unknown) => request<T>('PUT', endpoint, body),
  patch: <T>(endpoint: string, body: unknown) => request<T>('PATCH', endpoint, body),
  delete: <T>(endpoint: string) => request<T>('DELETE', endpoint),
};
