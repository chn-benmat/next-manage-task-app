"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { PlannerPasswordInput } from "@/app/components/planner-password-input";
import { PlannerAuth, PlannerIcon, PlannerNotice } from "@/app/components/planner-ui";
import { supabase } from "@/lib/supabaseClient";

export default function RegisterPage() {
  const router = useRouter();
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    const fields = new FormData(event.currentTarget);
    const file = fields.get("user_image_url");
    const fullname = String(fields.get("fullname") ?? "").trim();
    if (!fullname) {
      setError("กรุณาระบุชื่อและนามสกุล");
      event.currentTarget.querySelector<HTMLInputElement>("#fullname")?.focus();
      return;
    }

    setLoading(true);
    setError("");
    let failureMessage = "สร้างบัญชีไม่สำเร็จ ลองอีกครั้ง";

    try {
      let imageUrl = "";
      if (file instanceof File && file.size > 0) {
        failureMessage = "อัปโหลดรูปโปรไฟล์ไม่สำเร็จ ลองเลือกรูปอีกครั้ง";
        const extension = file.name.match(/\.[a-z\d]{1,10}$/i)?.[0]?.toLowerCase() ?? "";
        const name = crypto.getRandomValues(new Uint32Array(4)).join("-");
        const path = "profiles/" + name + extension;
        const storage = supabase.storage.from("user_bk");
        const { error: uploadError } = await storage.upload(path, file);
        if (uploadError) throw uploadError;
        imageUrl = storage.getPublicUrl(path).data.publicUrl;
        failureMessage = "สร้างบัญชีไม่สำเร็จ ลองอีกครั้ง";
      }

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullname,
          email: String(fields.get("email") ?? "").trim(),
          password: fields.get("password"),
          gender: fields.get("gender"),
          user_image_url: imageUrl,
        }),
      });

      if (!response.ok) {
        if (response.status === 409) failureMessage = "อีเมลนี้มีบัญชีอยู่แล้ว";
        throw new Error("Registration failed");
      }

      router.replace("/login");
    } catch {
      setError(failureMessage);
      setLoading(false);
    }
  }

  return (
    <PlannerAuth title="สร้างบัญชีใหม่">
      <form className="planner-form" onSubmit={handleRegister} aria-busy={loading}>
        <fieldset className="planner-auth-fields" disabled={loading}>
          <div className="planner-field">
            <label htmlFor="fullname">ชื่อและนามสกุล</label>
            <input id="fullname" name="fullname" autoComplete="name" placeholder="เช่น พิม ชื่นใจ" required />
          </div>

          <div className="planner-field">
            <label htmlFor="email">อีเมล</label>
            <input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
          </div>

          <div className="planner-field">
            <label htmlFor="password">รหัสผ่าน</label>
            <PlannerPasswordInput id="password" name="password" placeholder="ตั้งรหัสผ่าน" autoComplete="new-password" minLength={6} aria-describedby="password-help" required />
            <p className="planner-signup" id="password-help">อย่างน้อย 6 ตัวอักษร</p>
          </div>

          <div className="planner-register-optionals">
            <div className="planner-field">
              <div className="planner-field-label">
                <label htmlFor="gender">เพศ</label>
                <span>ไม่บังคับ</span>
              </div>
              <select id="gender" name="gender" defaultValue="">
                <option value="">เลือกเพศ</option>
                <option value="Male">ชาย</option>
                <option value="Female">หญิง</option>
                <option value="Other">อื่น ๆ</option>
              </select>
            </div>

            <div className="planner-field">
              <div className="planner-field-label">
                <label htmlFor="user_image_url">รูปโปรไฟล์</label>
                <span>ไม่บังคับ</span>
              </div>
              <div className="planner-file planner-register-upload">
                <PlannerIcon name="image" />
                <span>{fileName || "เลือกรูปภาพ"}</span>
                <input id="user_image_url" name="user_image_url" type="file" accept="image/*" onChange={(event) => {
                  setFileName(event.target.files?.[0]?.name ?? "");
                }} />
              </div>
            </div>
          </div>
        </fieldset>

        {error && <PlannerNotice error>{error}</PlannerNotice>}
        <button type="submit" className="planner-button planner-primary" disabled={loading}>
          {loading ? "กำลังสร้างบัญชี…" : "สร้างบัญชี"}
        </button>
      </form>
      <p className="planner-signup">
        มีบัญชีแล้ว? <Link href="/login">เข้าสู่ระบบ</Link>
      </p>
    </PlannerAuth>
  );
}
