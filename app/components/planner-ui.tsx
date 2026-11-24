import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import taskLogo from "@/assets/task.png";

const iconPaths = {
  eye: "M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z",
  eyeOff: "m3 3 18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 6.2A11 11 0 0 1 12 6c6.5 0 10 6 10 6a14.3 14.3 0 0 1-2.4 2.9M6.5 6.9C3.5 8.6 2 12 2 12s3.5 6 10 6a12 12 0 0 0 4.7-1",
  check: "m5 12 4 4L19 6",
  plus: "M12 5v14M5 12h14",
  back: "m12 19-7-7 7-7M5 12h14",
  edit: "m15 5 4 4M4 20h4l12-12a2.8 2.8 0 0 0-4-4L4 16v4Z",
  trash: "M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v5m4-5v5",
  image: "M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M15 9h.01",
  logout: "M10 4H5v16h5m4-12 4 4-4 4m-5-4h9",
  list: "M9 5h10M9 12h10M9 19h10M4 5h.01M4 12h.01M4 19h.01",
} as const;

export function PlannerIcon({ name }: { name: keyof typeof iconPaths }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
      <path d={iconPaths[name]} />
    </svg>
  );
}

export function PlannerHeader({ children, navigationDisabled = false }: { children?: ReactNode; navigationDisabled?: boolean }) {
  return (
    <header className="planner-header">
      <div className="planner-wrap planner-header-inner">
        <Link href="/" className="planner-brand" aria-label="Manage Task" aria-disabled={navigationDisabled} onClick={(event) => {
          if (navigationDisabled) event.preventDefault();
        }}>
          <Image src={taskLogo} alt="" width={36} height={36} />
          <span>Manage Task</span>
        </Link>
        {children}
      </div>
    </header>
  );
}

export function PlannerNotice({ children, error = false }: { children: ReactNode; error?: boolean }) {
  return (
    <p className={error ? "planner-notice planner-notice-error" : "planner-notice"} role={error ? "alert" : "status"}>
      {children}
    </p>
  );
}

export function PlannerAuth({ title, description, children }: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="planner">
      <PlannerHeader />
      <main className="planner-wrap planner-login">
        <div className="planner-login-art" aria-hidden="true">
          <div className="planner-login-paper">
            <Image src={taskLogo} alt="" width={140} height={140} priority />
          </div>
        </div>
        <section className="planner-login-panel" aria-labelledby="planner-auth-heading">
          <h1 className="planner-title" id="planner-auth-heading">{title}</h1>
          {description && <p className="planner-muted">{description}</p>}
          {children}
        </section>
      </main>
    </div>
  );
}
