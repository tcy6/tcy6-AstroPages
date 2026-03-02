import dayjs, { type Dayjs } from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

const pad2 = (value: number) => String(value).padStart(2, "0");

/**
 * Parse datetime as wall time in a target timezone.
 * - For Date input, UTC clock fields are reinterpreted as wall time.
 * - For string input, timezone suffixes are ignored and the clock time
 *   is interpreted directly in the target timezone.
 */
export function parseShanghaiWallTime(
  value: string | Date,
  timezoneName: string
): Dayjs {
  if (value instanceof Date) {
    const y = value.getUTCFullYear();
    const m = pad2(value.getUTCMonth() + 1);
    const d = pad2(value.getUTCDate());
    const hh = pad2(value.getUTCHours());
    const mm = pad2(value.getUTCMinutes());
    const ss = pad2(value.getUTCSeconds());
    return dayjs.tz(`${y}-${m}-${d}T${hh}:${mm}:${ss}`, timezoneName);
  }

  const raw = String(value).trim();
  const cleaned = raw
    .replace(/([+-]\d{2}:\d{2})$/, "")
    .replace(/Z$/, "");

  return dayjs.tz(cleaned, timezoneName);
}

