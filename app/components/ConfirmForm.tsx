"use client";

import * as React from "react";

interface ConfirmFormProps {
  action: string;
  method: string;
  inputs: Record<string, string>;
  label: string;
  confirmMessage: string;
  className?: string;
}

export default function ConfirmForm({
  action,
  method,
  inputs,
  label,
  confirmMessage,
  className,
}: ConfirmFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!window.confirm(confirmMessage)) {
      return;
    }

    const form = document.createElement("form");

    form.action = action;
    form.method = method;

    Object.entries(inputs).forEach(([name, value]) => {
      const input = document.createElement("input");

      input.type = "hidden";
      input.name = name;
      input.value = value;
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
  };

  return (
    <form style={{ display: "contents" }} onSubmit={handleSubmit}>
      <button className={className} type="submit">
        {label}
      </button>
    </form>
  );
}
