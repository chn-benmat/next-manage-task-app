"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { TaskEditor, TaskForm } from "@/app/components/task-form";
import { PlannerNotice } from "@/app/components/planner-ui";
import { supabase } from "@/lib/supabaseClient";
import { normalizeTask, readTaskSession, type Task } from "@/lib/tasks";

export default function EditTaskPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [result, setResult] = useState<{ id: string; task: Omit<Task, "created_at"> | null } | null>(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const user = readTaskSession();
    if (!user) {
      router.replace("/login");
      return;
    }

    const request = new AbortController();
    async function loadTask(userId: string | number) {
      try {
        const { data, error } = await supabase
          .from("task_tb")
          .select("*")
          .eq("id", id)
          .eq("user_id", userId)
          .abortSignal(request.signal)
          .single();
        if (request.signal.aborted) return;
        if (error) throw error;

        setResult({ id, task: normalizeTask(data) });
      } catch {
        if (!request.signal.aborted) setResult({ id, task: null });
      }
    }

    void loadTask(user.id);
    return () => request.abort();
  }, [id, retry, router]);

  const current = result?.id === id ? result : null;
  if (current?.task) return <TaskForm key={id} task={current.task} />;

  return (
    <TaskEditor title="แก้ไขงาน">
      {!current ? (
        <div className="planner-loading" role="status">
          <span>กำลังโหลดข้อมูลงาน…</span>
          <div aria-hidden="true" />
          <div aria-hidden="true" />
        </div>
      ) : (
        <div className="planner-list-state">
          <PlannerNotice error>เปิดงานนี้ไม่สำเร็จ งานอาจถูกลบไปแล้ว</PlannerNotice>
          <button className="planner-button planner-secondary" type="button" onClick={() => {
            setResult(null);
            setRetry((value) => value + 1);
          }}>ลองอีกครั้ง</button>
        </div>
      )}
    </TaskEditor>
  );
}
