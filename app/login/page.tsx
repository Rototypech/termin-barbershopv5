"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit() {
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setLoading(false);
    if (res.ok) {
      router.push("/admin");
    } else {
      setError("Falsches Passwort");
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center">
      <div className="w-full max-w-sm p-6 rounded-lg border border-[#C5A059] bg-black">
        <h1 className="text-xl text-[#C5A059] mb-4">Admin Login</h1>
        <div className="mb-4 flex gap-2 items-center">
          <input
            type={show ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Passwort"
            className="flex-1 px-3 py-2 rounded bg-black border border-[#C5A059] text-white"
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="px-3 py-2 rounded border border-[#C5A059] text-[#C5A059]"
          >
            {show ? "Verbergen" : "Anzeigen"}
          </button>
        </div>
        <button
          disabled={loading || !password}
          onClick={submit}
          className="w-full px-4 py-2 rounded bg-[#C5A059] text-black disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Einloggen
        </button>
        {error && <div className="mt-3 text-sm text-red-400">{error}</div>}
      </div>
    </div>
  );
}
