import { useEffect, useState } from "react";

interface PagedResult<T> {
  rows: T[];
  total: number;
}

export function usePagedQuery<T, P extends Record<string, unknown>>(
  fetcher: (params: P) => Promise<PagedResult<T>>,
  params: P,
) {
  const [rows, setRows] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  const paramsKey = JSON.stringify(params);

  useEffect(() => {
    // Every keystroke in a search box starts a request, and responses can come
    // back out of order. Only the latest request may update the table; a slower
    // answer to an older query is dropped instead of overwriting newer results.
    let stale = false;
    setLoading(true);
    setError(false);
    fetcher(params)
      .then((res) => {
        if (stale) return;
        setRows(res.rows);
        setTotal(res.total);
      })
      .catch(() => {
        if (!stale) setError(true);
      })
      .finally(() => {
        if (!stale) setLoading(false);
      });
    return () => {
      stale = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey, reloadToken]);

  return { rows, total, loading, error, retry: () => setReloadToken((t) => t + 1) };
}
