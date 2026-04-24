/**
 * The free-tier breakdown cap resets at midnight Eastern Time to match the
 * rest of the app's date handling (slate headers, breakdown timestamps).
 * Accounts for DST by probing -04:00 (EDT) first and falling back to -05:00
 * (EST) if the candidate instant falls on the wrong ET calendar day.
 *
 * Returns the UTC ISO timestamp of the most recent midnight ET.
 */
export function getStartOfDayET(): string {
  const now = new Date();
  const etDateStr = now.toLocaleDateString("en-CA", { timeZone: "America/New_York" });

  const candidate = new Date(`${etDateStr}T00:00:00-04:00`);
  const verifyEtDate = candidate.toLocaleDateString("en-CA", { timeZone: "America/New_York" });
  if (verifyEtDate === etDateStr) return candidate.toISOString();

  return new Date(`${etDateStr}T00:00:00-05:00`).toISOString();
}
