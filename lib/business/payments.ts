import { addMonths, addYears, differenceInDays } from "date-fns";

export function getNextDueDate(
  currentDueDate: Date | string,
  frequency: string
): Date {
  const d = new Date(currentDueDate);
  switch (frequency) {
    case "monthly":
      return addMonths(d, 1);
    case "quarterly":
      return addMonths(d, 3);
    case "half_yearly":
      return addMonths(d, 6);
    case "yearly":
      return addYears(d, 1);
    default:
      return d;
  }
}

export function calcLateFee(
  amountDue: number,
  dueDate: Date | string,
  paymentDate: Date | string
): number {
  const due = new Date(dueDate);
  const paid = new Date(paymentDate);
  if (paid <= due) return 0;
  const daysLate = differenceInDays(paid, due);
  const monthsLate = Math.ceil(daysLate / 30);
  return Math.floor(amountDue / 1000) * monthsLate;
}

export function getFinancialYear(date: Date | string): string {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  if (m >= 4) return `${y}-${String(y + 1).slice(-2)}`;
  return `${y - 1}-${String(y).slice(-2)}`;
}
