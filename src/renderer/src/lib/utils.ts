const appleEpoch = new Date("2001-01-01T00:00:00Z").getTime() / 1000;

export function convertAppleDateInt(appleDateInt: number): string {
  const secondsSinceAppleEpoch = appleDateInt / 1_000_000_000;
  const unixTimestamp = secondsSinceAppleEpoch + appleEpoch;
  return new Date(unixTimestamp * 1000).toISOString();
}
