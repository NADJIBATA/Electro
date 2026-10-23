import { useCallback, useEffect, useRef, useState } from "react";
import { api, errorMessage } from "./api";

// Charge une ressource GET ; se relance quand l'URL change
export default function useApi(url, { enabled = true } = {}) {
  const [state, setState] = useState({ data: null, loading: Boolean(url && enabled), error: null });
  const reqId = useRef(0);

  const load = useCallback(async () => {
    if (!url || !enabled) return;
    const id = ++reqId.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const { data } = await api.get(url);
      if (id === reqId.current) setState({ data, loading: false, error: null });
    } catch (err) {
      if (id === reqId.current) setState({ data: null, loading: false, error: errorMessage(err), status: err.response?.status });
    }
  }, [url, enabled]);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, reload: load, setData: (data) => setState((s) => ({ ...s, data })) };
}
