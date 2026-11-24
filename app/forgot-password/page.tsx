"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { PlannerPasswordInput } from "@/app/components/planner-password-input";
import { PlannerAuth, PlannerNotice } from "@/app/components/planner-ui";

type ResetError = { message: string; field?: "confirmPassword" };

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [error, setError] = useState<ResetError | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!success) return;
    const timer = window.setTimeout(() => router.replace("/login"), 3000);
    return () => window.clearTimeout(timer);
  }, [router, success]);

  function clearMismatch() {
    if (error?.field === "confirmPassword") setError(null);
  }

  async function handleResetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading || success) return;

    const form = event.currentTarget;
    const fields = new FormData(form);
    const email = String(fields.get("email") ?? "").trim();
    const newPassword = fields.get("newPassword");

    if (newPassword !== fields.get("confirmPassword")) {
      setError({ message: "รหัสผ่านไม่ตรงกัน", field: "confirmPassword" });
      form.querySelector<HTMLInputElement>("#confirmPassword")?.focus();
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword }),
      });

      if (!response.ok) {
        const data = await response.json();
        const message = typeof data?.error === "string" ? data.error : "รีเซ็ตรหัสผ่านไม่สำเร็จ ลองอีกครั้ง";
        setError({ message });
        return;
      }

      form.reset();
      setSuccess(true);
    } catch {
      setError({ message: "รีเซ็ตรหัสผ่านไม่สำเร็จ ลองอีกครั้ง" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <PlannerAuth title="รีเซ็ตรหัสผ่าน" description="กรอกอีเมลและตั้งรหัสผ่านใหม่">
      <form className="planner-form" onSubmit={handleResetPassword} aria-busy={loading}>
        <fieldset className="planner-auth-fields" disabled={loading || success}>
          <div className="planner-field">
            <label htmlFor="email">อีเมล</label>
            <input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
          </div>

          <div className="planner-field">
            <label htmlFor="newPassword">รหัสผ่านใหม่</label>
            <PlannerPasswordInput
              id="newPassword"
              name="newPassword"
              fieldLabel="รหัสผ่านใหม่"
              autoComplete="new-password"
              placeholder="อย่างน้อย 6 ตัวอักษร"
              minLength={6}
              required
              onChange={clearMismatch}
            />
          </div>

          <div className="planner-field">
            <label htmlFor="confirmPassword">ยืนยันรหัสผ่านใหม่</label>
            <PlannerPasswordInput
              id="confirmPassword"
              name="confirmPassword"
              fieldLabel="รหัสผ่านยืนยัน"
              autoComplete="new-password"
              placeholder="พิมพ์รหัสผ่านใหม่อีกครั้ง"
              minLength={6}
              required
              aria-invalid={error?.field === "confirmPassword" || undefined}
              onChange={clearMismatch}
            />
          </div>
        </fieldset>

        {error && <PlannerNotice error>{error.message}</PlannerNotice>}
        {success && <PlannerNotice>รีเซ็ตรหัสผ่านสำเร็จ กำลังกลับไปหน้าเข้าสู่ระบบ</PlannerNotice>}
        <button type="submit" className="planner-button planner-primary" disabled={loading || success}>
          {loading ? "กำลังรีเซ็ตรหัสผ่าน…" : "รีเซ็ตรหัสผ่าน"}
        </button>
      </form>
      <p className="planner-signup">
        <Link href="/login">กลับไปหน้าเข้าสู่ระบบ</Link>
      </p>
    </PlannerAuth>
  );
}
