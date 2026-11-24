"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { PlannerHeader, PlannerIcon, PlannerNotice } from "@/app/components/planner-ui";
import { supabase } from "@/lib/supabaseClient";
import { cleanUpTaskImage, readTaskSession, taskUpdateFields, uploadTaskImage, type Task, type TaskFields } from "@/lib/tasks";

export function TaskEditor({ title, children, saving = false }: { title: string; children: ReactNode; saving?: boolean }) {
  return (
    <div className="planner">
      <PlannerHeader navigationDisabled={saving} />
      <main className="planner-wrap planner-editor">
        <Link href="/alltask" className="planner-back" aria-disabled={saving} onClick={(event) => {
          if (saving) event.preventDefault();
        }}>
          <PlannerIcon name="back" /> กลับไปรายการงาน
        </Link>
        <h1 className="planner-title">{title}</h1>
        {children}
      </main>
    </div>
  );
}

type EditableTask = Omit<Task, "created_at">;

export function TaskForm({ task }: { task?: EditableTask }) {
  const router = useRouter();
  const [title, setTitle] = useState(task?.title ?? "");
  const [detail, setDetail] = useState(task?.detail ?? "");
  const [completed, setCompleted] = useState(task?.is_completed ?? false);
  const [attachment, setAttachment] = useState<{ file: File; preview: string } | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const preview = attachment?.preview ?? task?.image_url;
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    return () => {
      if (attachment) URL.revokeObjectURL(attachment.preview);
    };
  }, [attachment]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    const user = readTaskSession();
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!title.trim()) {
      setError("กรุณาระบุชื่องาน");
      event.currentTarget.querySelector<HTMLInputElement>("#title")?.focus();
      return;
    }

    setSaving(true);
    setError("");
    let uploadedImage: string | null = null;
    let failureMessage = "อัปโหลดรูปภาพไม่สำเร็จ ลองเลือกรูปอีกครั้ง";
    try {
      if (attachment) uploadedImage = await uploadTaskImage(attachment.file);

      const values: TaskFields = {
        title: title.trim(),
        detail: detail.trim(),
        is_completed: completed,
        image_url: uploadedImage ?? "",
      };
      const changes: Partial<TaskFields> = {};
      if (task) {
        if (title !== task.title) changes.title = values.title;
        if (detail !== (task.detail ?? "")) changes.detail = values.detail;
        if (completed !== task.is_completed) changes.is_completed = completed;
        if (uploadedImage) changes.image_url = uploadedImage;
        if (Object.keys(changes).length === 0) {
          router.replace("/alltask");
          return;
        }
      }

      failureMessage = "ยังยืนยันการบันทึกไม่ได้ ตรวจสอบรายการงานก่อนลองอีกครั้ง";
      const { error, status } = task
        ? await supabase
            .from("task_tb")
            .update(taskUpdateFields(changes, task))
            .eq("id", task.id)
            .eq("user_id", user.id)
            .select("id")
            .single()
        : await supabase.from("task_tb").insert({ ...values, user_id: user.id });
      if (error) {
        if (status >= 400 && status < 500 && status !== 408) {
          void cleanUpTaskImage(uploadedImage);
          failureMessage = "บันทึกงานไม่สำเร็จ ลองอีกครั้ง";
        }
        throw error;
      }
    } catch {
      if (mounted.current) {
        setError(failureMessage);
        setSaving(false);
      }
      return;
    }

    if (uploadedImage && task?.image_url) void cleanUpTaskImage(task.image_url);
    if (!mounted.current) return;

    try {
      sessionStorage.setItem("planner-task-saved", task ? "edit" : "create");
    } catch {
      // A saved task is still available when the success message cannot be stored.
    }
    router.replace("/alltask");
  }

  return (
    <TaskEditor title={task ? "แก้ไขงาน" : "เพิ่มงานใหม่"} saving={saving}>
      <form className="planner-editor-form" onSubmit={save} aria-busy={saving}>
        <fieldset className="planner-editor-fields" disabled={saving}>
          <div className="planner-field planner-editor-title">
            <label htmlFor="title">ชื่องาน</label>
            <input id="title" name="title" required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="เช่น ส่งรายงานวิชาภาษาไทย" />
          </div>

          <div className="planner-field">
            <div className="planner-field-label">
              <label htmlFor="detail">รายละเอียด</label>
              <span>ไม่บังคับ</span>
            </div>
            <textarea id="detail" name="detail" rows={4} value={detail} onChange={(event) => setDetail(event.target.value)} placeholder="จดสิ่งที่อยากจำเกี่ยวกับงานนี้" />
          </div>

          <div className="planner-field">
            <div className="planner-field-label">
              <label htmlFor="status">สถานะงาน</label>
            </div>
            <select id="status" name="status" value={completed ? "1" : "0"} onChange={(event) => setCompleted(event.target.value === "1")}>
              <option value="0">ยังไม่เสร็จ</option>
              <option value="1">เสร็จแล้ว</option>
            </select>
          </div>

          <div className="planner-field planner-editor-image">
            <div className="planner-field-label">
              <label htmlFor="fileInput">รูปภาพประกอบ</label>
              <span>ไม่บังคับ</span>
            </div>
            <div className="planner-attachment">
              {preview && <Image className="planner-attachment-preview" src={preview} alt="ตัวอย่างรูปภาพประกอบ" width={104} height={104} unoptimized />}
              <div className="planner-file">
                <PlannerIcon name="image" />
                <span>{attachment?.file.name ?? (preview ? "เลือกรูปใหม่" : "เลือกรูปภาพ")}</span>
                <input id="fileInput" name="image" type="file" accept="image/*" onChange={(event) => {
                  const file = event.target.files?.[0];
                  setAttachment(file ? { file, preview: URL.createObjectURL(file) } : null);
                }} />
              </div>
            </div>
          </div>
        </fieldset>
        {error && <PlannerNotice error>{error}</PlannerNotice>}
        <div className="planner-editor-actions">
          <button type="button" className="planner-button planner-secondary" disabled={saving} onClick={() => router.replace("/alltask")}>ยกเลิก</button>
          <button type="submit" className="planner-button planner-primary" disabled={saving}>
            {saving ? "กำลังบันทึก…" : task ? "บันทึกการแก้ไข" : "บันทึกงาน"}
          </button>
        </div>
      </form>
    </TaskEditor>
  );
}
