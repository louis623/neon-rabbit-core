"use client";

import { useCallback, useSyncExternalStore } from "react";

const subscribeToClientSnapshot = () => () => {};
const getServerSnapshot = () => "";

export function useClientFormattedTime(value: string, options: Intl.DateTimeFormatOptions): string {
  const getSnapshot = useCallback(() => formatClientTime(value, options), [options, value]);

  return useSyncExternalStore(subscribeToClientSnapshot, getSnapshot, getServerSnapshot);
}

function formatClientTime(value: string, options: Intl.DateTimeFormatOptions): string {
  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) {
    return "";
  }

  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return new Intl.DateTimeFormat("en-US", {
    ...options,
    timeZone,
  }).format(date);
}
