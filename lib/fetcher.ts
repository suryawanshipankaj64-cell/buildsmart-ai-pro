export const fetcher = (url: string) => fetch(url).then((r) => {
  if (!r.ok) throw new Error('Request failed');
  return r.json();
});

export async function postJson(url: string, body: unknown, method: 'POST' | 'PATCH' | 'DELETE' = 'POST') {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: method === 'DELETE' ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}
