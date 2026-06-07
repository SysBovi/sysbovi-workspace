export const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

async function request<T>(
  method: string,
  endpoint: string,
  body?: unknown,
): Promise<T> {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401) {
    window.location.href = '/login';
    throw new Error('Sessão expirada.');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro desconhecido.' }));
    throw new Error(error.message ?? 'Erro na requisição.');
  }

  const contentType = response.headers.get('content-type');
  if (response.status === 204 || !contentType?.includes('application/json')) {
    return undefined as T;
  }
  return response.json();
}

export const api = {
  get: <T>(endpoint: string) => request<T>('GET', endpoint),
  post: <T>(endpoint: string, body: unknown) => request<T>('POST', endpoint, body),
  put: <T>(endpoint: string, body: unknown) => request<T>('PUT', endpoint, body),
  patch: <T>(endpoint: string, body: unknown) => request<T>('PATCH', endpoint, body),
  delete: <T>(endpoint: string, body?: unknown) => request<T>('DELETE', endpoint, body),
};
