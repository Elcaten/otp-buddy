import {useState, useEffect} from 'react';

export function useQuery<TData, TError = Error>({
  queryKey,
  queryFn,
  enabled = true,
  onError,
}: {
  queryKey: string;
  queryFn: () => Promise<TData>;
  enabled?: boolean;
  onError?: (error: unknown) => TError;
}) {
  const [data, setData] = useState<TData | null>(null);
  const [error, setError] = useState<TError | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    setLoading(true);
    setData(null);
    setError(null);

    queryFn()
      .then((query) => {
        setData(query);
      })
      .catch((e) => {
        setData(null);
        setError(onError ? onError(e) : e);
      })
      .finally(() => {
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, queryKey]);

  return {data, error, loading};
}
