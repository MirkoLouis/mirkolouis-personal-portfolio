#!/usr/bin/env python3
"""Subset Inter and Inconsolata Nerd Font from the Nix store into small woff2 files.

Run inside `nix develop` (the dev shell exports INTER_FONT_DIR and INCONSOLATA_NF_DIR):
    npm run fonts
Output goes to public/fonts/ and is committed, so the Vercel build needs neither Nix nor Python.
"""
import json
import os
import sys
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "public" / "fonts"
ICONS_JSON = ROOT / "src" / "lib" / "icons.json"

# Text ranges kept in every font: Basic Latin, Latin-1, dashes, quotes, bullet, ellipsis, arrows
TEXT_UNICODES = [
    *range(0x0020, 0x007F),
    *range(0x00A0, 0x0100),
    0x2013, 0x2014,
    *range(0x2018, 0x201E),
    0x2022, 0x2026,
    *range(0x2190, 0x2194),
]


def fail(message: str) -> None:
    """Print an error and exit non-zero."""
    print(f"subset-fonts: {message}", file=sys.stderr)
    sys.exit(1)


def find_font(env_var: str, filename: str) -> Path:
    """Locate a TTF by name under the store path held in env_var."""
    base = os.environ.get(env_var)
    # The dev shell must provide the store path
    if not base:
        fail(f"{env_var} is not set; run this inside `nix develop`")
    matches = list(Path(base).rglob(filename))
    # Exactly one match is expected per file name
    if not matches:
        fail(f"{filename} not found under {base}")
    return matches[0]


def load_icon_codepoints() -> list[int]:
    """Read the icon codepoints shared with src/lib/icons.ts."""
    icons = json.loads(ICONS_JSON.read_text())
    return [int(code, 16) for code in icons.values()]


def verify_icons(font_path: Path, codepoints: list[int]) -> None:
    """Fail if any icon codepoint is missing from the font (would render as tofu)."""
    cmap = TTFont(font_path).getBestCmap()
    icons = json.loads(ICONS_JSON.read_text())
    missing = [f"{name}={code}" for name, code in icons.items() if int(code, 16) not in cmap]
    # Every icon must exist in the source font
    if missing:
        fail(f"icons missing from {font_path.name}: {', '.join(missing)}")


def subset_font(source: Path, target: Path, unicodes: list[int]) -> None:
    """Write a woff2 of source containing only the given codepoints."""
    options = subset.Options()
    options.flavor = "woff2"
    options.layout_features = ["*"]
    options.name_IDs = ["*"]
    options.notdef_outline = True
    font = subset.load_font(str(source), options)
    subsetter = subset.Subsetter(options)
    subsetter.populate(unicodes=unicodes)
    subsetter.subset(font)
    subset.save_font(font, str(target), options)
    print(f"{target.relative_to(ROOT)}: {target.stat().st_size / 1024:.1f} KB")


def main() -> None:
    """Locate the fonts, verify icons, and write the three subsets."""
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    icon_codepoints = load_icon_codepoints()

    inter = find_font("INTER_FONT_DIR", "InterVariable.ttf")
    mono_regular = find_font("INCONSOLATA_NF_DIR", "InconsolataNerdFont-Regular.ttf")
    mono_bold = find_font("INCONSOLATA_NF_DIR", "InconsolataNerdFont-Bold.ttf")

    # Check icons in both weights before writing anything
    for mono in (mono_regular, mono_bold):
        verify_icons(mono, icon_codepoints)

    subset_font(inter, OUT_DIR / "inter-latin.woff2", TEXT_UNICODES)
    subset_font(mono_regular, OUT_DIR / "inconsolata-nf-regular.woff2", TEXT_UNICODES + icon_codepoints)
    subset_font(mono_bold, OUT_DIR / "inconsolata-nf-bold.woff2", TEXT_UNICODES + icon_codepoints)


if __name__ == "__main__":
    main()
