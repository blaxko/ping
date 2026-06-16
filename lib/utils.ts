import { clsx, type ClassValue } from "clsx";
import { format, formatDistanceToNowStrict, isToday, isTomorrow } from "date-fns";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDueDate(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);

  if (isToday(date)) {
    return `Today at ${format(date, "p")}`;
  }

  if (isTomorrow(date)) {
    return `Tomorrow at ${format(date, "p")}`;
  }

  return format(date, "EEE, MMM d 'at' p");
}

export function formatTimestamp(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  return format(date, "MMM d, yyyy 'at' p");
}

export function relativeDeadline(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  return formatDistanceToNowStrict(date, { addSuffix: true });
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
