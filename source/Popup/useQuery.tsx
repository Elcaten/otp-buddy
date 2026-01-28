import { useState, useEffect } from "react";

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function useQuery<TData>({
  queryFn,
  enabled = true,
}: {
  queryFn: () => Promise<TData>;
  enabled?: boolean;
}) {
  const [data, setData] = useState<TData | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    setLoading(true);
    queryFn()
      .then((query) => {
        setData(query);
      })
      .catch((e) => {
        setError(e);
      })
      .finally(() => {
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return { data, error, loading };
}
