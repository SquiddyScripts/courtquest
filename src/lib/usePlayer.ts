"use client";

import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import type { PlayerIdentity } from "./types";

const KEY = "cq-player";

/* ────────────────────────────────────────────────────────────────────────────
   Shared player session store. Every usePlayer() consumer (the nav circle,
   /me, the register form) reads from one source, so signing in or out updates
   all of them at once instead of leaving a stale profile circle behind until
   the next full page load.
──────────────────────────────────────────────────────────────────────────── */

type PlayerState = { player: PlayerIdentity | null; checked: boolean };

let state: PlayerState = { player: null, checked: false };
const listeners = new Set<() => void>();

function setState(next: Partial<PlayerState>) {
  state = { ...state, ...next };
  for (const listener of listeners) listener();
}

let bootstrapped = false;
function bootstrap() {
  if (bootstrapped) return;
  bootstrapped = true;
  queueMicrotask(async () => {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) {
        setState({ checked: true });
        return;
      }
      const stored = JSON.parse(raw) as PlayerIdentity;
      const { data } = await supabase.rpc("player_me", { token_in: stored.token });
      if (data) {
        setState({ player: { id: data.id, name: data.name, email: data.email, token: stored.token }, checked: true });
      } else {
        localStorage.removeItem(KEY);
        setState({ player: null, checked: true });
      }
    } catch {
      setState({ checked: true });
    }
  });
}

export function storePlayerSession(p: PlayerIdentity) {
  localStorage.setItem(KEY, JSON.stringify(p));
  setState({ player: p, checked: true });
}

async function login(email: string, password: string): Promise<string | null> {
  const { data, error } = await supabase.rpc("player_login", {
    email_in: email,
    password_in: password,
  });
  if (error) return "Wrong email or password.";
  storePlayerSession({ id: data.id, name: data.name, email: data.email, token: data.token });
  return null;
}

async function signup(name: string, email: string, password: string): Promise<string | null> {
  const { data, error } = await supabase.rpc("player_signup", {
    name_in: name,
    email_in: email,
    password_in: password,
  });
  if (error) {
    if (error.message.includes("exists")) return "A profile with this email already exists. Sign in instead.";
    if (error.message.includes("password")) return "Password must be at least 8 characters.";
    return "Check your name and email, then try again.";
  }
  storePlayerSession({ id: data.id, name: data.name, email: data.email, token: data.token });
  return null;
}

async function logout() {
  if (state.player) await supabase.rpc("player_logout", { token_in: state.player.token });
  localStorage.removeItem(KEY);
  setState({ player: null });
}

/**
 * Optional player session. Everything on the site works without one; this
 * only unlocks the personal dashboard and profile ownership. Backed by the
 * shared store above so sign-in / sign-out is reflected everywhere instantly.
 */
export function usePlayer() {
  const [snap, setSnap] = useState(state);

  useEffect(() => {
    const listener = () => setSnap(state);
    listeners.add(listener);
    listener();   // pick up whatever the store already holds
    bootstrap();  // verify the stored token once, app-wide
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return { player: snap.player, checked: snap.checked, login, signup, logout };
}
