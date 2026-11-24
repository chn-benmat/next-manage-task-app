"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PlannerHeader, PlannerIcon, PlannerNotice } from "@/app/components/planner-ui";
import { supabase } from "@/lib/supabaseClient";
import { cleanUpTaskImage, normalizeTask, readTaskSession, taskUpdateFields, type Task } from "@/lib/tasks";

const dateTime = new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short" });

function TaskTime({ date, label }: { date: string; label: string }) {
  const timestamp = Date.parse(date);
  if (!Number.isFinite(timestamp)) return null;

  return <time dateTime={date}>{label} {dateTime.format(timestamp)}</time>;
}

export default function AllTasksPage() {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [name, setName] = useState("");
  const [view, setView] = useState<"loading" | "ready" | "error">("loading");
  const [retry, setRetry] = useState(0);
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [problem, setProblem] = useState("");
  const [notice, setNotice] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("planner-task-saved");
      if (saved) {
        setNotice(saved === "create" ? "เพิ่มงานเรียบร้อย" : "บันทึกการแก้ไขเรียบร้อย");
        sessionStorage.removeItem("planner-task-saved");
      }
    } catch {
      // The notice is optional when browser storage is unavailable.
    }
  }, []);

  useEffect(() => {
    const user = readTaskSession();
    if (!user) {
      router.replace("/login");
      return;
    }

    const request = new AbortController();
    async function loadTasks(userId: string | number) {
      try {
        const { data, error } = await supabase
          .from("task_tb")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .abortSignal(request.signal);
        if (request.signal.aborted) return;
        if (error) throw error;

        setTasks(data.map(normalizeTask));
        setView("ready");
      } catch {
        if (!request.signal.aborted) setView("error");
      }
    }

    setName(user.fullname?.trim() ?? "");
    void loadTasks(user.id);
    return () => request.abort();
  }, [retry, router]);

  function logout() {
    localStorage.removeItem("user");
    router.replace("/login");
  }

  async function changeStatus(task: Task, completed: boolean) {
    const user = readTaskSession();
    if (!user) {
      router.replace("/login");
      return;
    }
    if (busy[task.id]) return;

    setProblem("");
    setNotice("");
    setBusy((previous) => ({ ...previous, [task.id]: true }));
    try {
      const updates = taskUpdateFields({ is_completed: completed }, task);
      const { error } = await supabase
        .from("task_tb")
        .update(updates)
        .eq("id", task.id)
        .eq("user_id", user.id)
        .select("id")
        .single();
      if (error) throw error;

      setTasks((previous) => previous.map((item) => item.id === task.id
        ? { ...item, ...updates }
        : item));
    } catch {
      setProblem("เปลี่ยนสถานะไม่สำเร็จ ลองอีกครั้ง");
    } finally {
      setBusy((previous) => ({ ...previous, [task.id]: false }));
    }
  }

  async function deleteTask(task: Task) {
    dialog.current?.close();
    const user = readTaskSession();
    if (!user) {
      router.replace("/login");
      return;
    }
    if (busy[task.id]) return;

    setProblem("");
    setNotice("");
    setBusy((previous) => ({ ...previous, [task.id]: true }));
    try {
      const { error } = await supabase
        .from("task_tb")
        .delete()
        .eq("id", task.id)
        .eq("user_id", user.id)
        .select("id")
        .single();
      if (error) throw error;

      setTasks((previous) => previous.filter((item) => item.id !== task.id));
      setNotice("ลบงานเรียบร้อย");
      void cleanUpTaskImage(task.image_url);
    } catch {
      setProblem("ลบงานไม่สำเร็จ ลองอีกครั้ง");
    } finally {
      setBusy((previous) => ({ ...previous, [task.id]: false }));
    }
  }

  const completedCount = tasks.filter((task) => task.is_completed).length;

  return (
    <div className="planner">
      <PlannerHeader>
        <button className="planner-button planner-quiet" type="button" onClick={logout}>
          <PlannerIcon name="logout" /> ออกจากระบบ
        </button>
      </PlannerHeader>
      <main className="planner-wrap planner-workspace">
        <div className="planner-overview">
          <div>
            <h1 className="planner-title">งานของฉัน</h1>
            {name && <p className="planner-greeting">สวัสดี {name}</p>}
          </div>
          {view === "ready" && tasks.length > 0 && (
            <section className="planner-progress" aria-labelledby="progress-title">
              <h2 id="progress-title">งานที่ทำเสร็จ</h2>
              <p><strong>{completedCount}</strong> <span>จาก {tasks.length} งาน</span></p>
              <progress value={completedCount} max={tasks.length} aria-labelledby="progress-title" />
            </section>
          )}
        </div>

        <section aria-labelledby="tasks-heading" aria-busy={view === "loading"}>
          <div className="planner-list-head">
            <h2 id="tasks-heading">รายการงาน</h2>
            <Link className="planner-button planner-primary" href="/addtask">
              <PlannerIcon name="plus" /> เพิ่มงานใหม่
            </Link>
          </div>
          {problem && <PlannerNotice error>{problem}</PlannerNotice>}
          {notice && <PlannerNotice>{notice}</PlannerNotice>}

          {view === "loading" && (
            <div className="planner-loading" role="status">
              <span>กำลังโหลดรายการงาน…</span>
              <div aria-hidden="true" />
              <div aria-hidden="true" />
              <div aria-hidden="true" />
            </div>
          )}
          {view === "error" && (
            <div className="planner-list-state">
              <PlannerNotice error>โหลดรายการงานไม่สำเร็จ</PlannerNotice>
              <button className="planner-button planner-secondary" type="button" onClick={() => {
                setView("loading");
                setRetry((value) => value + 1);
              }}>
                ลองอีกครั้ง
              </button>
            </div>
          )}
          {view === "ready" && tasks.length === 0 && (
            <div className="planner-list-state">
              <span className="planner-state-icon"><PlannerIcon name="list" /></span>
              <h3>ยังไม่มีงานในรายการ</h3>
              <p className="planner-muted">กดเพิ่มงานใหม่เพื่อเริ่มจดสิ่งที่ต้องทำ</p>
            </div>
          )}
          {view === "ready" && tasks.length > 0 && (
            <ul className="planner-task-list">
              {tasks.map((task) => (
                <li className="planner-task-row" key={task.id} data-completed={task.is_completed} aria-busy={Boolean(busy[task.id])}>
                  <input
                    className="planner-task-check"
                    type="checkbox"
                    aria-label={"สถานะงาน " + task.title}
                    checked={task.is_completed}
                    aria-disabled={Boolean(busy[task.id])}
                    onChange={(event) => void changeStatus(task, event.target.checked)}
                  />
                  <div className="planner-task-copy">
                    <h3>{task.title}</h3>
                    {task.detail && <p className="planner-task-detail">{task.detail}</p>}
                    <div className="planner-task-meta">
                      <span>{task.is_completed ? "เสร็จแล้ว" : "ยังไม่เสร็จ"}</span>
                      <TaskTime date={task.created_at} label="เพิ่ม" />
                      {task.update_at && task.update_at !== task.created_at && (
                        <TaskTime date={task.update_at} label="แก้ไข" />
                      )}
                    </div>
                  </div>
                  {task.image_url && (
                    <Image className="planner-task-image" src={task.image_url} alt="รูปภาพประกอบงาน" width={56} height={56} />
                  )}
                  <div className="planner-task-actions">
                    <Link
                      className="planner-icon-button"
                      href={"/edittask/" + task.id}
                      aria-label={"แก้ไข " + task.title}
                      aria-disabled={Boolean(busy[task.id])}
                      onClick={(event) => {
                        if (busy[task.id]) event.preventDefault();
                      }}
                    >
                      <PlannerIcon name="edit" />
                    </Link>
                    <button
                      className="planner-icon-button planner-danger"
                      type="button"
                      aria-label={"ลบ " + task.title}
                      disabled={busy[task.id]}
                      onClick={() => {
                        setDeleteTarget(task);
                        dialog.current?.showModal();
                      }}
                    >
                      <PlannerIcon name="trash" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
      <dialog ref={dialog} className="planner-dialog" aria-labelledby="delete-heading" aria-describedby="delete-detail" onClose={() => setDeleteTarget(null)}>
        <h2 id="delete-heading">ลบงานนี้?</h2>
        <p id="delete-detail">{deleteTarget?.title}</p>
        <div className="planner-dialog-actions">
          <button className="planner-button planner-secondary" type="button" autoFocus onClick={() => dialog.current?.close()}>ยกเลิก</button>
          <button className="planner-button planner-delete" type="button" onClick={() => {
            if (deleteTarget) void deleteTask(deleteTarget);
          }}>ลบงาน</button>
        </div>
      </dialog>
    </div>
  );
}
