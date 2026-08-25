"use client";

import { useClientFormattedTime } from "./useClientFormattedTime";

type CustomerShowTimeProps = {
  value: string;
};

const customerShowTimeFormatOptions = {
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  month: "short",
  timeZoneName: "short",
  year: "numeric",
} satisfies Intl.DateTimeFormatOptions;

export function CustomerShowTime({ value }: CustomerShowTimeProps) {
  const label = useClientFormattedTime(value, customerShowTimeFormatOptions);

  return <span suppressHydrationWarning>{label || "Time loading..."}</span>;
}
