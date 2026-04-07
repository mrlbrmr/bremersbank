import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatMonthYear = (date: Date | string) => {
  const d = date instanceof Date ? date : new Date(`${date}T00:00:00`);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

export const parseInstallmentVirtualId = (virtualId: string) => {
  const cleanId = virtualId.replace(/^installment-/, "");
  const lastDash = cleanId.lastIndexOf("-");
  if (lastDash === -1) return null;

  const installmentId = cleanId.slice(0, lastDash);
  const installmentNumber = Number(cleanId.slice(lastDash + 1));
  if (!installmentId || !Number.isInteger(installmentNumber)) return null;

  return { installmentId, installmentNumber };
};
