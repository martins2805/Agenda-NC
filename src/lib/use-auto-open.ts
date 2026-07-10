"use client";

import { useEffect, useRef } from "react";

export function useAutoOpenFromQuery<T extends { id: string }>(
  items: T[],
  loading: boolean,
  onFound: (item: T) => void
) {
  const consumed = useRef(false);

  useEffect(() => {
    if (consumed.current || loading) return;
    const params = new URLSearchParams(window.location.search);
    const openId = params.get("open");
    if (openId) {
      const item = items.find((i) => i.id === openId);
      if (item) onFound(item);
    }
    consumed.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, loading]);
}
