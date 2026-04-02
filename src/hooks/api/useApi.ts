'use client';
import { useState, useEffect } from 'react';

export function useApi<T>(endpoint: string, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(endpoint)
      .then(async res => {
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error?.message ?? `Error ${res.status}`);
        }
        return json.data as T;
      })
      .then(d => { if (!cancelled) { setData(d); setLoading(false); } })
      .catch(e => { if (!cancelled) { setError(e.message); setLoading(false); } });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, ...deps]);

  return { data, loading, error, refetch: () => {} };
}

export function usePost<TBody, TResp>(endpoint: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const post = async (body: TBody): Promise<TResp | null> => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message ?? 'Request failed');
      return json.data as TResp;
    } catch (e: unknown) {
      setError((e as Error).message);
      return null;
    } finally {
      setLoading(false);
    }
  };
  return { post, loading, error };
}
