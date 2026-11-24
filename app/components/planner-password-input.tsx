"use client";

import { useState, type ComponentPropsWithoutRef } from "react";
import { PlannerIcon } from "@/app/components/planner-ui";

type PasswordInputProps = Omit<ComponentPropsWithoutRef<"input">, "type"> & {
  id: string;
  fieldLabel?: string;
};

export function PlannerPasswordInput({
  id,
  fieldLabel = "รหัสผ่าน",
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="planner-password">
      <input {...props} id={id} type={visible ? "text" : "password"} />
      <button
        type="button"
        className="planner-icon-button planner-password-toggle"
        aria-label={(visible ? "ซ่อน" : "แสดง") + fieldLabel}
        aria-controls={id}
        disabled={props.disabled}
        onClick={() => setVisible((value) => !value)}
      >
        <PlannerIcon name={visible ? "eyeOff" : "eye"} />
      </button>
    </div>
  );
}
