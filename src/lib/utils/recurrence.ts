import { addDays, addMonths, addYears, format } from "date-fns";
import { BillFrequency } from "@/types/database";

/**
 * Parses a date string or Date object into a reliable midnight date without timezone skew.
 */
function parseBaseDate(input: string | Date): Date {
  if (input instanceof Date) {
    return new Date(input.getFullYear(), input.getMonth(), input.getDate());
  }
  const parts = input.split("-").map(Number);
  if (parts.length >= 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }
  const fallback = new Date(input);
  return new Date(fallback.getFullYear(), fallback.getMonth(), fallback.getDate());
}

/**
 * Calculates the exact due date for a specific occurrence of a recurring bill.
 *
 * @param startDate - The initial start date (YYYY-MM-DD or Date)
 * @param frequency - One of 'daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'
 * @param intervalValue - Interval multiplier (e.g. 1 = every period, 2 = every 2 periods)
 * @param occurrenceNumber - 0-indexed repetition count (0 = start date itself)
 * @returns Formatted date string in 'YYYY-MM-DD' format
 */
export function calculateNextDueDate(
  startDate: string | Date,
  frequency: BillFrequency,
  intervalValue: number,
  occurrenceNumber: number
): string {
  const baseDate = parseBaseDate(startDate);

  if (occurrenceNumber <= 0) {
    return format(baseDate, "yyyy-MM-dd");
  }

  let calculatedDate: Date;

  switch (frequency) {
    case "daily":
      calculatedDate = addDays(baseDate, intervalValue * occurrenceNumber);
      break;

    case "weekly":
      calculatedDate = addDays(baseDate, intervalValue * occurrenceNumber * 7);
      break;

    case "biweekly":
      // Biweekly means every 2 weeks (14 days) per interval step
      calculatedDate = addDays(baseDate, intervalValue * occurrenceNumber * 14);
      break;

    case "monthly":
      // date-fns addMonths gracefully handles month-end clamping (e.g. Jan 31 -> Feb 28)
      calculatedDate = addMonths(baseDate, intervalValue * occurrenceNumber);
      break;

    case "quarterly":
      // Quarterly means every 3 months per interval step
      calculatedDate = addMonths(baseDate, intervalValue * occurrenceNumber * 3);
      break;

    case "yearly":
      calculatedDate = addYears(baseDate, intervalValue * occurrenceNumber);
      break;

    default:
      calculatedDate = addMonths(baseDate, intervalValue * occurrenceNumber);
      break;
  }

  return format(calculatedDate, "yyyy-MM-dd");
}

/**
 * Generates an array of the next `count` upcoming due dates starting from a specific occurrence.
 *
 * @param startDate - The initial start date (YYYY-MM-DD or Date)
 * @param frequency - One of 'daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'
 * @param intervalValue - Interval multiplier (e.g. 1 or 2)
 * @param count - How many future dates to generate
 * @param startFromOccurrence - Starting occurrence index (default 0)
 * @returns Array of 'YYYY-MM-DD' formatted strings
 */
export function generateUpcomingDates(
  startDate: string | Date,
  frequency: BillFrequency,
  intervalValue: number,
  count: number,
  startFromOccurrence = 0
): string[] {
  const dates: string[] = [];
  const safeCount = Math.max(1, Math.min(count, 50)); // Clamp between 1 and 50

  for (let i = 0; i < safeCount; i++) {
    const nextDate = calculateNextDueDate(
      startDate,
      frequency,
      intervalValue,
      startFromOccurrence + i
    );
    dates.push(nextDate);
  }

  return dates;
}

/**
 * Formats recurrence configuration into friendly natural English text.
 *
 * Examples:
 * - ("monthly", 1, null) => "Monthly, forever"
 * - ("biweekly", 1, 12) => "Every 2 weeks, 12 times"
 * - ("weekly", 2, null) => "Every 2 weeks, forever"
 * - ("daily", 1, 30) => "Daily, 30 times"
 */
export function getRecurrenceDescription(
  frequency: BillFrequency,
  intervalValue: number,
  totalReps: number | null
): string {
  let cadence = "";

  switch (frequency) {
    case "daily":
      cadence = intervalValue === 1 ? "Daily" : `Every ${intervalValue} days`;
      break;
    case "weekly":
      cadence = intervalValue === 1 ? "Weekly" : `Every ${intervalValue} weeks`;
      break;
    case "biweekly":
      cadence = intervalValue === 1 ? "Every 2 weeks" : `Every ${intervalValue * 2} weeks`;
      break;
    case "monthly":
      cadence = intervalValue === 1 ? "Monthly" : `Every ${intervalValue} months`;
      break;
    case "quarterly":
      cadence = intervalValue === 1 ? "Quarterly" : `Every ${intervalValue * 3} months`;
      break;
    case "yearly":
      cadence = intervalValue === 1 ? "Yearly" : `Every ${intervalValue} years`;
      break;
    default:
      cadence = "Recurring";
  }

  let duration = "";
  if (totalReps === null || totalReps === undefined) {
    duration = "forever";
  } else if (totalReps === 1) {
    duration = "1 time";
  } else {
    duration = `${totalReps} times`;
  }

  return `${cadence}, ${duration}`;
}
