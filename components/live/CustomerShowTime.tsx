"use client";

import { useEffect, useState } from "react";

type CustomerShowTimeProps = {
  value: string;
};

export function CustomerShowTime({ value }: CustomerShowTimeProps) {
  const [label, setLabel] = useState("");

  useEffect(() => {
    const date = new Date(value);

    if (!Number.isFinite(date.getTime())) {
      setLabel("");
      return;
    }

    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setLabel(
      new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone,
        timeZoneName: "short",
      }).format(date),
    );
  }, [value]);

  return <span suppressHydrationWarning>{label || "Time loading..."}</span>;
}
