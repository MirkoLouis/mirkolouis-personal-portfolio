// Display helpers for the projects section

// Rows visible in the collapsed "More on GitHub" list
export const COLLAPSED_ROWS = 4;

// Collapse (fade + expand control) only when there are more rows than fit
export function shouldCollapse(count: number): boolean {
    return count > COLLAPSED_ROWS;
}

// Pluralize a unit: "1 day ago", "3 days ago"
function ago(value: number, unit: string): string {
    return `${value} ${unit}${value === 1 ? "" : "s"} ago`;
}

// Coarse relative date computed at build time ("today", "3 days ago", "2 months ago")
export function formatRelative(iso: string, now: Date): string {
    const days = Math.floor((now.getTime() - Date.parse(iso)) / 86_400_000);

    // Same day (or a clock-skewed future date)
    if (days < 1) {
        return "today";
    }
    // Under a month: count days
    if (days < 30) {
        return ago(days, "day");
    }
    // Under a year: count 30-day months
    if (days < 365) {
        return ago(Math.floor(days / 30), "month");
    }
    return ago(Math.floor(days / 365), "year");
}
