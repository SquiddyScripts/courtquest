"use client";

import { useEffect, useState } from "react";
import { supabase } from "./supabase";

const KEY = "cq-admin";

export interface AdminIdentity {
  /** Credential passed to every gated RPC: a session token, or the master PIN. */
  cred: string;
  name: string;
  email: string | null;
  role: "owner" | "admin";
  viaPin: boolean;
}

interface Stored {
  cred: string;
  viaPin: boolean;
}

/**
 * Admin session. Two ways in:
 *  - email + password account (owner approves new accounts)
 *  - the master leadership PIN (counts as owner)
 * The credential is accepted everywhere the old PIN was.
 */
export function useAdmin() {
  const [me, setMe] = useState<AdminIdentity | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    queueMicrotask(async () => {
      try {
        const raw = localStorage.getItem(KEY);
        if (!raw) return;
        const stored = JSON.parse(raw) as Stored;
        if (stored.viaPin) {
          const { data } = await supabase.rpc("verify_admin", { pin: stored.cred });
          if (data) {
            setMe({ cred: stored.cred, name: "Leadership PIN", email: null, role: "owner", viaPin: true });
          } else {
            localStorage.removeItem(KEY);
          }
        } else {
          const { data } = await supabase.rpc("admin_me", { token_in: stored.cred });
          if (data) {
            setMe({ cred: stored.cred, name: data.name, email: data.email, role: data.role, viaPin: false });
          } else {
            localStorage.removeItem(KEY);
          }
        }
      } finally {
        setChecked(true);
      }
    });
  }, []);

  async function login(email: string, password: string): Promise<string | null> {
    const { data, error } = await supabase.rpc("admin_login", {
      email_in: email,
      password_in: password,
    });
    if (error) {
      if (error.message.includes("pending")) return "Your account is waiting for approval. Ask the owner to activate it.";
      return "Wrong email or password.";
    }
    localStorage.setItem(KEY, JSON.stringify({ cred: data.token, viaPin: false } satisfies Stored));
    setMe({ cred: data.token, name: data.name, email: data.email, role: data.role, viaPin: false });
    return null;
  }

  async function loginPin(pin: string): Promise<boolean> {
    const { data } = await supabase.rpc("verify_admin", { pin: pin.trim() });
    if (!data) return false;
    localStorage.setItem(KEY, JSON.stringify({ cred: pin.trim(), viaPin: true } satisfies Stored));
    setMe({ cred: pin.trim(), name: "Leadership PIN", email: null, role: "owner", viaPin: true });
    return true;
  }

  async function signup(email: string, name: string, password: string): Promise<string | null> {
    const { error } = await supabase.rpc("admin_signup", {
      email_in: email,
      name_in: name,
      password_in: password,
    });
    if (error) {
      if (error.message.includes("exists")) return "An account with this email already exists.";
      if (error.message.includes("password")) return "Password must be at least 8 characters.";
      return "Check your name and email, then try again.";
    }
    return null;
  }

  async function logout() {
    if (me && !me.viaPin) await supabase.rpc("admin_logout", { token_in: me.cred });
    localStorage.removeItem(KEY);
    setMe(null);
  }

  return { me, checked, login, loginPin, signup, logout };
}
