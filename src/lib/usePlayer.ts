"use client";

import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import type { PlayerIdentity } from "./types";

const KEY = "cq-player";

export function storePlayerSession(p: PlayerIdentity) {
  localStorage.setItem(KEY, JSON.stringify(p));
}

/**
 * Optional player session. Everything on the site works without one; this
 * only unlocks the personal dashboard and profile ownership.
 */
export function usePlayer() {
  const [player, setPlayer] = useState<PlayerIdentity | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    queueMicrotask(async () => {
      try {
        const raw = localStorage.getItem(KEY);
        if (!raw) return;
        const stored = JSON.parse(raw) as PlayerIdentity;
        const { data } = await supabase.rpc("player_me", { token_in: stored.token });
        if (data) {
          setPlayer({ id: data.id, name: data.name, email: data.email, token: stored.token });
        } else {
          localStorage.removeItem(KEY);
        }
      } finally {
        setChecked(true);
      }
    });
  }, []);

  async function login(email: string, password: string): Promise<string | null> {
    const { data, error } = await supabase.rpc("player_login", {
      email_in: email,
      password_in: password,
    });
    if (error) return "Wrong email or password.";
    const p: PlayerIdentity = { id: data.id, name: data.name, email: data.email, token: data.token };
    storePlayerSession(p);
    setPlayer(p);
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
    const p: PlayerIdentity = { id: data.id, name: data.name, email: data.email, token: data.token };
    storePlayerSession(p);
    setPlayer(p);
    return null;
  }

  async function logout() {
    if (player) await supabase.rpc("player_logout", { token_in: player.token });
    localStorage.removeItem(KEY);
    setPlayer(null);
  }

  return { player, checked, login, signup, logout };
}
