"use client";

import { useState } from "react";
import { usePersonalData } from "@/components/personal-data-provider";

export function AccountMenu() {
  const { user, authReady, authConfigured, authError, signIn, signOut } = usePersonalData();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    try {
      if (await signIn(email, password)) {
        setPassword("");
        setOpen(false);
      }
    } finally {
      setPending(false);
    }
  }

  async function logout() {
    setPending(true);
    try {
      if (await signOut()) setOpen(false);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="account-menu-wrap">
      <button
        type="button"
        className="account-menu-trigger"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="dialog"
        disabled={!authReady}
      >
        <span className="account-menu-avatar">{user?.email?.slice(0, 1).toUpperCase() ?? "↗"}</span>
        <span>{!authReady ? "Checking" : user ? "Account" : "Sign in"}</span>
      </button>
      {open && (
        <div className="account-menu-panel" role="dialog" aria-label="Account">
          <div className="account-menu-heading">
            <span className="eyebrow">PERSONAL DATA SYNC</span>
            <button type="button" className="account-menu-close" onClick={() => setOpen(false)} aria-label="Close account panel">×</button>
          </div>
          {user ? (
            <>
              <strong className="account-menu-email">{user.email ?? "Signed-in user"}</strong>
              <p>Your Watchlist, Portfolio, Investment Memory, and Notes sync with this account.</p>
              {authError && <p className="account-menu-error" role="alert">{authError}</p>}
              <button type="button" className="primary-button account-menu-submit" onClick={logout} disabled={pending}>
                {pending ? "Signing out…" : "Sign out"}
              </button>
            </>
          ) : (
            <>
              <p>Sign in to sync your personal investment data across devices.</p>
              {authConfigured ? (
                <form className="account-menu-form" onSubmit={submit}>
                  <label className="personal-field"><span>Email</span>
                    <input type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required />
                  </label>
                  <label className="personal-field"><span>Password</span>
                    <input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
                  </label>
                  {authError && <p className="account-menu-error" role="alert">{authError}</p>}
                  <button type="submit" className="primary-button account-menu-submit" disabled={pending}>
                    {pending ? "Signing in…" : "Sign in"}
                  </button>
                </form>
              ) : (
                <p className="account-menu-error">This build needs NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY).</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
