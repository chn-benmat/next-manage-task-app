type TaskSession = {
  id: string | number;
  fullname?: string;
};

export function readTaskSession(): TaskSession | null {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return null;

    const user = JSON.parse(raw) as Partial<TaskSession> | null;
    if (typeof user?.id !== "string" && typeof user?.id !== "number") return null;

    return { id: user.id, fullname: typeof user.fullname === "string" ? user.fullname : undefined };
  } catch {
    return null;
  }
}
