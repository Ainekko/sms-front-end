/**
 * Date utilities for scheduling and timezone handling.
 * 
 * The datetime-local input expects values in LOCAL time format (YYYY-MM-DDTHH:mm),
 * but toISOString() returns UTC time. These utilities ensure proper timezone handling.
 */

/**
 * Format a Date object to a local datetime string suitable for datetime-local input.
 * Returns format: "YYYY-MM-DDTHH:mm"
 */
export function toLocalDatetimeString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Get the current local time as a datetime-local compatible string.
 * Use this for the `min` attribute on datetime-local inputs.
 */
export function getLocalMinDatetime(): string {
    return toLocalDatetimeString(new Date());
}

/**
 * Get tomorrow at a specific hour in local time as a datetime-local string.
 * Defaults to 9:00 AM.
 */
export function getTomorrowAtHour(hour: number = 9): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(hour, 0, 0, 0);
    return toLocalDatetimeString(tomorrow);
}
