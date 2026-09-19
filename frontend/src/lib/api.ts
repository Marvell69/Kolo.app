const API_URL = import.meta.env.VITE_API_URL;

export async function apiFetch(path: string, opts: RequestInit = {}, token?: string) {
  const res = await fetch(`${API_URL}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts.headers,
    },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
