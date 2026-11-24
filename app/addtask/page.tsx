"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { TaskForm } from "@/app/components/task-form";
import { readTaskSession } from "@/lib/tasks";

export default function AddTaskPage() {
  const router = useRouter();

  useEffect(() => {
    if (!readTaskSession()) router.replace("/login");
  }, [router]);

  return <TaskForm />;
}
