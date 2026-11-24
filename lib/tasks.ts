import { supabase } from "@/lib/supabaseClient";

export type TaskFields = {
  title: string;
  detail: string;
  is_completed: boolean;
  image_url: string | null;
};

export type Task = TaskFields & {
  id: string;
  created_at: string;
  update_at?: string | null;
};

export { readTaskSession } from "./task-session";

type TaskRow = Omit<Task, "is_completed"> & {
  is_completed: boolean | string | null;
};

export function normalizeTask(row: TaskRow): Task {
  const status = row.is_completed;
  return {
    ...row,
    is_completed: status === true || (typeof status === "string" && status.trim().toLowerCase() === "true"),
  };
}

export function taskUpdateFields<T extends Partial<TaskFields>>(fields: T, task: Pick<Task, "update_at">) {
  return "update_at" in task ? { ...fields, update_at: new Date().toISOString() } : fields;
}

const taskImages = supabase.storage.from("task_bk");

export async function uploadTaskImage(file: File) {
  const extension = file.name.match(/\.[a-z\d]{1,10}$/i)?.[0] ?? "";
  const filename = crypto.getRandomValues(new Uint32Array(4)).join("-") + extension.toLowerCase();
  const { error } = await taskImages.upload(filename, file);
  if (error) throw new Error("อัปโหลดรูปภาพไม่สำเร็จ ลองเลือกรูปอีกครั้ง");

  return taskImages.getPublicUrl(filename).data.publicUrl;
}

export async function cleanUpTaskImage(url: string | null) {
  if (!url) return;

  try {
    const filename = new URL(url).pathname.split("/").pop();
    if (!filename) return;

    const { error } = await taskImages.remove([decodeURIComponent(filename)]);
    if (error) console.warn("Could not remove unused task image", error.message);
  } catch (error) {
    console.warn("Could not remove unused task image", error);
  }
}
