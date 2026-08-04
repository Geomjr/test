"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { FormCard, TextField } from "@/components/ui/fields";
import { OrbitLogo } from "@/components/OrbitLogo";

export function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const signUp = mode === "sign-up";

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(signUp ? { name, email, password } : { email, password }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(body?.error ?? "Something went wrong. Try again.");
        setBusy(false);
        return;
      }
      // Full navigation so the whole app tree picks up the new session.
      window.location.assign("/");
    } catch {
      setError("Network error. Check your connection and try again.");
      setBusy(false);
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col items-center gap-4 pb-9 text-center">
        <OrbitLogo size={72} />
        <div>
          <h1 className="text-[30px] font-bold tracking-[-0.02em]">Orbit</h1>
          <p className="pt-0.5 text-[15px] text-label-2">Your people, in orbit.</p>
        </div>
      </div>

      <form onSubmit={submit}>
        <FormCard>
          {signUp ? (
            <TextField
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              autoComplete="name"
              required
            />
          ) : null}
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@school.edu"
            autoComplete="email"
            inputMode="email"
            autoCapitalize="none"
            required
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={signUp ? "At least 8 characters" : "Your password"}
            autoComplete={signUp ? "new-password" : "current-password"}
            required
            minLength={signUp ? 8 : undefined}
          />
        </FormCard>

        {error ? (
          <p className="px-2 pt-3 text-center text-[14px] text-red">{error}</p>
        ) : null}

        <div className="pt-5">
          <Button type="submit" block loading={busy}>
            {signUp ? "Create Account" : "Sign In"}
          </Button>
        </div>
      </form>

      <p className="pt-6 text-center text-[15px] text-label-2">
        {signUp ? "Already have an account? " : "New to Orbit? "}
        <Link
          className="font-semibold text-tint"
          href={signUp ? "/sign-in" : "/sign-up"}
        >
          {signUp ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </div>
  );
}
