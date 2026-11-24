"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { PlannerPasswordInput } from "@/app/components/planner-password-input";
import { PlannerAuth, PlannerNotice } from "@/app/components/planner-ui";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.status === 400 || res.status === 401) {
        setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
        setLoading(false);
        return;
      }

      const data = await res.json();
      if (!res.ok || (typeof data.user?.id !== "string" && typeof data.user?.id !== "number")) {
        throw new Error("Invalid login response");
      }

      localStorage.setItem("user", JSON.stringify(data.user));
      router.replace("/alltask");
    } catch {
      setError("เข้าสู่ระบบไม่สำเร็จ ลองอีกครั้ง");
      setLoading(false);
    }
  }

  return (
    <PlannerAuth title="เข้าสู่ระบบ" description="เข้าสู่ระบบเพื่อดูรายการงานของคุณ">
      <form className="planner-form" onSubmit={handleLogin} aria-busy={loading}>
        <div className="planner-field">
          <label htmlFor="email">อีเมล</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            placeholder="you@example.com"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <div className="planner-field">
          <div className="planner-field-label">
            <label htmlFor="password">รหัสผ่าน</label>
            <Link href="/forgot-password">ลืมรหัสผ่าน?</Link>
          </div>
          <PlannerPasswordInput
            id="password"
            name="password"
            placeholder="กรอกรหัสผ่าน"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
        {error && <PlannerNotice error>{error}</PlannerNotice>}
        <button className="planner-button planner-primary" type="submit" disabled={loading}>
          {loading ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบ"}
        </button>
      </form>
      <p className="planner-signup">
        ยังไม่มีบัญชี? <Link href="/register">สร้างบัญชีใหม่</Link>
      </p>
    </PlannerAuth>
  );
}
