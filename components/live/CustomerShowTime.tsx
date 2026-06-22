"use client";

import { useClientFormattedTime } from "./useClientFormattedTime";

type CustomerShowTimeProps = {
  value: string;
};

const customerShowTimeFormatOptions = {
  dateStyle: "medium",
  timeStyle: "short",
  timeZoneName: "short",
} satisfies Intl.DateTimeFormatOptions;

export function CustomerShowTime({ value }: CustomerShowTimeProps) {
  const label = useClientFormattedTime(value, customerShowTimeFormatOptions);

  return <span suppressHydrationWarning>{label || "Time loading..."}</span>;
}
