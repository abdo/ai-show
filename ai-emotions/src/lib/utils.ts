/**
 * Get current time in 12h or 24h format
 */
export function getTime(format: "12" | "24" = "24"): string {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, "0");

  if (format === "12") {
    const period = hours >= 12 ? "PM" : "AM";
    const hour12 = hours % 12 || 12;
    return `${hour12}:${minutes} ${period}`;
  }

  return `${hours.toString().padStart(2, "0")}:${minutes}`;
}

/**
 * Generate greeting based on time of day
 */
export function greetingPerTime(userName?: string): string {
  const hour = new Date().getHours();
  const name = userName ? `, ${userName}` : "";

  if (hour < 12) {
    return `Good morning${name}! 🌅`;
  } else if (hour < 18) {
    return `Good afternoon${name}! ☀️`;
  } else {
    return `Good evening${name}! 🌙`;
  }
}



