"use client";

import { useEffect, useState } from "react";
import type { SessionPayload } from "@/types";

interface SessionState {
  session: SessionPayload | null;
  loading: boolean;
}

export function useSession(): SessionState {
  const [state, setState] = useState<SessionState>({
    session: null,
    loading: true,
  });

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setState({ session: data?.session ?? null, loading: false });
      })
      .catch(() => {
        setState({ session: null, loading: false });
      });
  }, []);

  return state;
}
