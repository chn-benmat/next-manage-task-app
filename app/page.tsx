"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PlannerHeader, PlannerIcon } from "@/app/components/planner-ui";
import { readTaskSession } from "@/lib/task-session";

const exampleRows = [
  { title: "ทำโครงร่างรายงาน", completed: true },
  { title: "อ่านบทที่ 4", completed: false },
  { title: "เตรียมสไลด์งานกลุ่ม", completed: false },
];

export default function HomePage() {
  const [user, setUser] = useState<ReturnType<typeof readTaskSession>>(null);

  useEffect(() => {
    setUser(readTaskSession());
  }, []);

  function logout() {
    localStorage.removeItem("user");
    setUser(null);
  }

  return (
    <div className="planner planner-home">
      <PlannerHeader>
        {user ? (
          <button className="planner-button planner-quiet" type="button" onClick={logout}>
            <PlannerIcon name="logout" /> ออกจากระบบ
          </button>
        ) : (
          <nav className="planner-home-nav" aria-label="บัญชีผู้ใช้">
            <Link href="/login" className="planner-button planner-quiet">เข้าสู่ระบบ</Link>
            <Link href="/register" className="planner-button planner-secondary">สมัครสมาชิก</Link>
          </nav>
        )}
      </PlannerHeader>
      <main className="planner-wrap">
        <section className="planner-home-intro" aria-labelledby="home-heading">
          <div className="planner-home-copy">
            <h1 className="planner-title" id="home-heading">จัดการงานในที่เดียว</h1>
            <p className="planner-muted">จดสิ่งที่ต้องทำ แนบรูป แล้วติ๊กเสร็จได้จากรายการ</p>
            <Link href={user ? "/alltask" : "/login"} className="planner-button planner-primary">
              {user ? "เปิดรายการงาน" : "เริ่มต้นใช้งาน"}
            </Link>
          </div>
          <section className="planner-home-example" aria-labelledby="example-heading">
            <h2 id="example-heading">ตัวอย่างรายการงาน</h2>
            <ul>
              {exampleRows.map((row) => (
                <li key={row.title}>
                  <span className="planner-home-check" data-completed={row.completed} aria-hidden="true">
                    {row.completed && <PlannerIcon name="check" />}
                  </span>
                  <span>{row.title}</span>
                  <span className="planner-home-status" data-completed={row.completed}>
                    {row.completed ? "เสร็จแล้ว" : "ยังไม่เสร็จ"}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </section>
        <dl className="planner-home-features">
          <div>
            <dt>จดบันทึกงาน</dt>
            <dd>เพิ่มชื่องานและกลับมาแก้ไขรายละเอียดได้</dd>
          </div>
          <div>
            <dt>แนบรูปภาพ</dt>
            <dd>เก็บรูปที่เกี่ยวข้องไว้กับงานแต่ละรายการ</dd>
          </div>
          <div>
            <dt>ติดตามสถานะ</dt>
            <dd>เห็นว่างานไหนเสร็จแล้วและงานไหนยังค้างอยู่</dd>
          </div>
        </dl>
      </main>
    </div>
  );
}
