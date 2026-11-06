// Nerd Font icon lookup; icons.json is shared with scripts/subset-fonts.py
import icons from "./icons.json";

// Every valid icon name, derived from the JSON keys
export type IconName = keyof typeof icons;

// Return the Private Use Area character for an icon (render with the .icon class)
export function glyph(name: IconName): string {
    return String.fromCodePoint(parseInt(icons[name], 16));
}
