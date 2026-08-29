import { useCallback, useEffect, useState } from "react";

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

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    fetcher(params)
      .then((res) => {
        setRows(res.rows);
        setTotal(res.total);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey, reloadToken]);

  useEffect(() => {
    load();
  }, [load]);

  return { rows, total, loading, error, retry: () => setReloadToken((t) => t + 1) };
}
