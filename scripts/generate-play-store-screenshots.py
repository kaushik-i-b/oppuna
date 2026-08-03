#!/usr/bin/env python3
"""Generate Oppuna Google Play phone screenshots (1080×1920) with taglines.

Outputs PNGs to assets/play-store/screenshots/ and a TAGLINES.md index.
Requires: Pillow
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "assets" / "play-store" / "screenshots"
ICON_PATH = ROOT / "assets" / "icon.png"

W, H = 1080, 1920

# Brand tokens (Soft Sage)
SAGE = (61, 107, 90)
SAGE_DEEP = (47, 84, 70)
SAGE_MUTED = (220, 232, 226)
SAND = (247, 244, 239)
SAND_ALT = (239, 234, 227)
SURFACE = (255, 252, 248)
INK = (28, 36, 32)
INK_SOFT = (63, 74, 68)
MUTED = (92, 103, 95)
FAINT = (142, 152, 145)
BORDER = (226, 220, 211)
WHITE = (255, 255, 255)
PHONE_BEZEL = (28, 36, 32)

FONT_DIR = Path("/usr/share/fonts/truetype/macos")
FONT_BOLD = FONT_DIR / "PublicSans-Bold.ttf"
FONT_REG = FONT_DIR / "PublicSans-Regular.ttf"
FONT_FALLBACK_BOLD = Path("/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf")
FONT_FALLBACK_REG = Path("/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf")


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    path = FONT_BOLD if bold else FONT_REG
    if not path.exists():
        path = FONT_FALLBACK_BOLD if bold else FONT_FALLBACK_REG
    return ImageFont.truetype(str(path), size)


def lerp(a: tuple[int, int, int], b: tuple[int, int, int], t: float) -> tuple[int, int, int]:
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))  # type: ignore[return-value]


def vertical_gradient(
    size: tuple[int, int],
    top: tuple[int, int, int],
    bottom: tuple[int, int, int],
) -> Image.Image:
    img = Image.new("RGB", size)
    px = img.load()
    for y in range(size[1]):
        c = lerp(top, bottom, y / max(1, size[1] - 1))
        for x in range(size[0]):
            px[x, y] = c
    return img


def radial_wash(
    base: Image.Image,
    center: tuple[int, int],
    radius: int,
    color: tuple[int, int, int],
    strength: float = 0.35,
) -> Image.Image:
    overlay = Image.new("RGBA", base.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    steps = 40
    for i in range(steps, 0, -1):
        t = i / steps
        alpha = int(255 * strength * (1 - t) ** 2)
        r = int(radius * t)
        draw.ellipse(
            (center[0] - r, center[1] - r, center[0] + r, center[1] + r),
            fill=(*color, alpha),
        )
    return Image.alpha_composite(base.convert("RGBA"), overlay)


def rounded_rect(
    draw: ImageDraw.ImageDraw,
    box: tuple[int, int, int, int],
    radius: int,
    fill=None,
    outline=None,
    width: int = 1,
) -> None:
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def text_size(draw: ImageDraw.ImageDraw, text: str, fnt: ImageFont.ImageFont) -> tuple[int, int]:
    bbox = draw.textbbox((0, 0), text, font=fnt)
    return bbox[2] - bbox[0], bbox[3] - bbox[1]


def draw_centered_text(
    draw: ImageDraw.ImageDraw,
    y: int,
    text: str,
    fnt: ImageFont.ImageFont,
    fill: tuple[int, int, int],
    max_width: int | None = None,
) -> int:
    """Draw centered text; wraps if max_width given. Returns bottom y."""
    lines: list[str] = []
    if max_width is None:
        lines = [text]
    else:
        words = text.split()
        current = ""
        for word in words:
            trial = f"{current} {word}".strip()
            if text_size(draw, trial, fnt)[0] <= max_width:
                current = trial
            else:
                if current:
                    lines.append(current)
                current = word
        if current:
            lines.append(current)

    cy = y
    for line in lines:
        tw, th = text_size(draw, line, fnt)
        draw.text(((W - tw) // 2, cy), line, font=fnt, fill=fill)
        cy += th + 10
    return cy


def draw_leaf(draw: ImageDraw.ImageDraw, cx: int, cy: int, scale: float = 1.0, fill=WHITE, vein=SAGE) -> None:
    """Simple Living Leaf mark."""
    w = int(72 * scale)
    h = int(90 * scale)
    # Leaf body as ellipse + point via polygon approximation
    points = []
    for i in range(33):
        t = i / 32
        # Parametric teardrop-ish leaf
        angle = math.pi * (0.15 + 0.7 * t)
        rx = math.sin(math.pi * t) * (w / 2)
        ry = -h / 2 + t * h
        points.append((cx - rx, cy + ry))
    for i in range(32, -1, -1):
        t = i / 32
        rx = math.sin(math.pi * t) * (w / 2)
        ry = -h / 2 + t * h
        points.append((cx + rx, cy + ry))
    draw.polygon(points, fill=fill)
    # Veins
    draw.line((cx, cy - int(h * 0.38), cx, cy + int(h * 0.42)), fill=vein, width=max(2, int(3 * scale)))
    for dy, spread in ((-0.08, 0.22), (0.08, 0.24), (0.24, 0.18)):
        y0 = cy + int(h * dy)
        draw.line((cx, y0, cx - int(w * spread), y0 + int(h * 0.12)), fill=vein, width=max(2, int(2 * scale)))
        draw.line((cx, y0, cx + int(w * spread), y0 + int(h * 0.12)), fill=vein, width=max(2, int(2 * scale)))


def phone_frame(content: Image.Image) -> Image.Image:
    """Wrap UI content in a phone bezel."""
    pad = 18
    radius = 68
    outer_w = content.width + pad * 2
    outer_h = content.height + pad * 2
    phone = Image.new("RGBA", (outer_w + 40, outer_h + 40), (0, 0, 0, 0))

    # Soft drop shadow
    shadow = Image.new("RGBA", phone.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle(
        (28, 36, 28 + outer_w, 36 + outer_h),
        radius=radius + 4,
        fill=(28, 36, 32, 70),
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(22))
    phone = Image.alpha_composite(phone, shadow)

    ox, oy = 20, 12
    draw = ImageDraw.Draw(phone)
    rounded_rect(draw, (ox, oy, ox + outer_w, oy + outer_h), radius + 6, fill=PHONE_BEZEL)

    # Screen clip area
    screen = Image.new("RGBA", (content.width, content.height), (0, 0, 0, 0))
    mask = Image.new("L", content.size, 0)
    md = ImageDraw.Draw(mask)
    md.rounded_rectangle((0, 0, content.width - 1, content.height - 1), radius=52, fill=255)
    screen.paste(content.convert("RGBA"), (0, 0))
    phone.paste(screen, (ox + pad, oy + pad), mask)

    # Notch
    nd = ImageDraw.Draw(phone)
    nx0 = ox + outer_w // 2 - 90
    ny0 = oy + 18
    nd.rounded_rectangle((nx0, ny0, nx0 + 180, ny0 + 34), radius=18, fill=(10, 12, 11))

    return phone


def ui_canvas(bg: tuple[int, int, int] = SAND) -> tuple[Image.Image, ImageDraw.ImageDraw]:
    img = Image.new("RGB", (720, 1280), bg)
    return img, ImageDraw.Draw(img)


def draw_status_bar(draw: ImageDraw.ImageDraw, light: bool = True) -> None:
    fill = INK if light else WHITE
    f = font(18, bold=True)
    draw.text((36, 48), "9:41", font=f, fill=fill)
    # Simple signal/battery glyphs
    draw.rounded_rectangle((620, 52, 678, 72), radius=4, outline=fill, width=2)
    draw.rectangle((678, 58, 684, 66), fill=fill)
    draw.rounded_rectangle((624, 56, 668, 68), radius=2, fill=fill)


def draw_check(draw: ImageDraw.ImageDraw, cx: int, cy: int, size: int = 14, fill=WHITE) -> None:
    """Simple check mark drawn as two thick segments."""
    s = size
    w = max(3, size // 3)
    p1 = (cx - s // 2, cy)
    p2 = (cx - s // 8, cy + s // 2)
    p3 = (cx + s // 2 + 1, cy - s // 2)
    draw.line([p1, p2], fill=fill, width=w)
    draw.line([p2, p3], fill=fill, width=w)


def draw_bottom_nav(draw: ImageDraw.ImageDraw, active: int = 0) -> None:
    y0 = 1188
    rounded_rect(draw, (0, y0, 720, 1280), 0, fill=SURFACE)
    draw.line((0, y0, 720, y0), fill=BORDER, width=2)
    labels = ["Home", "Mood", "Chat", "Journal", "More"]
    for i, label in enumerate(labels):
        x = 72 + i * 144
        color = SAGE if i == active else FAINT
        draw.ellipse((x - 10, y0 + 22, x + 10, y0 + 42), fill=color)
        draw.text((x - 22, y0 + 52), label, font=font(16), fill=color)


# --- Per-screen UI painters -------------------------------------------------

def paint_home() -> Image.Image:
    img, d = ui_canvas()
    draw_status_bar(d)
    d.text((40, 100), "Good afternoon", font=font(22), fill=MUTED)
    d.text((40, 132), "Welcome back", font=font(42, bold=True), fill=INK)

    # Wellness score card
    rounded_rect(d, (40, 210, 680, 390), 28, fill=SAGE)
    d.text((72, 250), "Today’s wellness", font=font(22), fill=SAGE_MUTED)
    d.text((72, 290), "78", font=font(72, bold=True), fill=WHITE)
    d.text((180, 330), "/ 100", font=font(28), fill=SAGE_MUTED)
    d.text((72, 360), "3-day care streak", font=font(20), fill=SAGE_MUTED)

    # Plan card
    rounded_rect(d, (40, 420, 680, 700), 28, fill=SURFACE, outline=BORDER, width=2)
    d.text((72, 450), "Today’s plan", font=font(28, bold=True), fill=INK)
    items = [("Breathing · 4 min", True), ("Mood check-in", True), ("Journal prompt", False)]
    for i, (label, done) in enumerate(items):
        y = 510 + i * 52
        if done:
            d.ellipse((72, y, 100, y + 28), fill=SAGE)
            draw_check(d, 86, y + 14, size=12, fill=WHITE)
        else:
            d.ellipse((72, y, 100, y + 28), outline=BORDER, width=2)
        d.text((120, y + 2), label, font=font(24), fill=INK_SOFT)

    # Quick actions
    for i, (title, sub) in enumerate([("Log mood", "How do you feel?"), ("Chat", "On-device AI")]):
        x0 = 40 + i * 330
        rounded_rect(d, (x0, 730, x0 + 310, 900), 28, fill=SURFACE, outline=BORDER, width=2)
        d.ellipse((x0 + 28, 770, x0 + 68, 810), fill=SAGE_MUTED)
        d.text((x0 + 28, 830), title, font=font(26, bold=True), fill=INK)
        d.text((x0 + 28, 866), sub, font=font(20), fill=MUTED)

    # Privacy chip
    rounded_rect(d, (40, 930, 680, 1020), 24, fill=SAGE_MUTED)
    d.text((72, 960), "100% offline · data stays on this phone", font=font(22, bold=True), fill=SAGE_DEEP)

    draw_bottom_nav(d, 0)
    return img


def paint_chat() -> Image.Image:
    img, d = ui_canvas((18, 22, 20))
    draw_status_bar(d, light=False)
    d.text((40, 100), "Companion", font=font(36, bold=True), fill=WHITE)
    d.text((40, 150), "On-device · Qwen local model", font=font(20), fill=(168, 180, 173))

    bubbles = [
        ("user", "I’ve been feeling overwhelmed today."),
        ("ai", "I’m here with you. Want to unpack what’s weighing most, or try a short grounding pause first?"),
        ("user", "A grounding pause sounds good."),
        ("ai", "Let’s start with five things you can see around you — no rush."),
    ]
    y = 220
    for role, text in bubbles:
        fnt = font(22)
        # wrap
        words = text.split()
        lines: list[str] = []
        cur = ""
        max_w = 420
        for w_ in words:
            trial = f"{cur} {w_}".strip()
            if text_size(d, trial, fnt)[0] <= max_w:
                cur = trial
            else:
                lines.append(cur)
                cur = w_
        if cur:
            lines.append(cur)
        bh = 28 + len(lines) * 30
        if role == "user":
            x0 = 200
            rounded_rect(d, (x0, y, 680, y + bh), 22, fill=(36, 53, 46))
            fill = WHITE
        else:
            x0 = 40
            rounded_rect(d, (x0, y, 520, y + bh), 22, fill=(26, 33, 30), outline=(44, 53, 49), width=2)
            fill = (238, 242, 239)
        for i, line in enumerate(lines):
            d.text((x0 + 20, y + 14 + i * 30), line, font=fnt, fill=fill)
        y += bh + 24

    rounded_rect(d, (40, 1120, 680, 1210), 28, fill=(26, 33, 30), outline=(44, 53, 49), width=2)
    d.text((68, 1150), "Message stays on device…", font=font(22), fill=(116, 128, 121))
    return img


def paint_mood() -> Image.Image:
    img, d = ui_canvas()
    draw_status_bar(d)
    d.text((40, 100), "How are you", font=font(42, bold=True), fill=INK)
    d.text((40, 155), "feeling?", font=font(42, bold=True), fill=INK)
    d.text((40, 220), "Private check-in · never uploaded", font=font(22), fill=MUTED)

    moods = [
        ("Great", (61, 107, 90)),
        ("Good", (106, 154, 127)),
        ("Okay", (212, 168, 75)),
        ("Low", (224, 138, 80)),
        ("Hard", (192, 57, 43)),
    ]
    for i, (label, color) in enumerate(moods):
        x = 48 + i * 130
        r = 46 if i != 1 else 54
        cy = 360
        d.ellipse((x + 20 - r // 2, cy - r, x + 20 + r // 2, cy + r - r // 2 + 20), fill=color)
        if i == 1:
            d.ellipse((x + 20 - r // 2 - 6, cy - r - 6, x + 20 + r // 2 + 6, cy + r - r // 2 + 26), outline=SAGE, width=4)
        d.text((x, 430), label, font=font(20, bold=True), fill=INK_SOFT)

    rounded_rect(d, (40, 500, 680, 620), 28, fill=SURFACE, outline=BORDER, width=2)
    d.text((72, 530), "Intensity", font=font(22, bold=True), fill=INK)
    d.rounded_rectangle((72, 575, 560, 595), radius=10, fill=SAGE_MUTED)
    d.rounded_rectangle((72, 575, 360, 595), radius=10, fill=SAGE)
    d.ellipse((340, 565, 380, 605), fill=SAGE_DEEP)
    d.text((580, 570), "6", font=font(28, bold=True), fill=SAGE)

    rounded_rect(d, (40, 660, 680, 900), 28, fill=SURFACE, outline=BORDER, width=2)
    d.text((72, 700), "Note (optional)", font=font(22, bold=True), fill=INK)
    d.text((72, 750), "A little better after a walk.", font=font(24), fill=INK_SOFT)
    tags = ["walk", "work", "calm"]
    x = 72
    for tag in tags:
        tw, _ = text_size(d, tag, font(20))
        rounded_rect(d, (x, 820, x + tw + 36, 865), 18, fill=SAGE_MUTED)
        d.text((x + 18, 828), tag, font=font(20), fill=SAGE_DEEP)
        x += tw + 52

    rounded_rect(d, (40, 940, 680, 1040), 28, fill=SAGE)
    d.text((0, 970), "Save check-in", font=font(28, bold=True), fill=WHITE, anchor=None)
    # center button label manually
    tw, th = text_size(d, "Save check-in", font(28, bold=True))
    d.text(((720 - tw) // 2, 970), "Save check-in", font=font(28, bold=True), fill=WHITE)

    draw_bottom_nav(d, 1)
    return img


def paint_journal() -> Image.Image:
    img, d = ui_canvas()
    draw_status_bar(d)
    d.text((40, 100), "Journal", font=font(42, bold=True), fill=INK)
    d.text((40, 160), "Yours alone · searchable offline", font=font(22), fill=MUTED)

    entries = [
        ("Gratitude", "Three quiet things from today…", "Today"),
        ("Thought record", "Noticing the story I’m telling…", "Yesterday"),
        ("Daily", "A softer evening than expected.", "Mon"),
    ]
    y = 230
    for title, body, when in entries:
        rounded_rect(d, (40, y, 680, y + 170), 28, fill=SURFACE, outline=BORDER, width=2)
        d.text((72, y + 28), title, font=font(26, bold=True), fill=INK)
        d.text((480, y + 32), when, font=font(20), fill=FAINT)
        d.text((72, y + 78), body, font=font(22), fill=INK_SOFT)
        d.text((72, y + 120), "Stored only on this device", font=font(18), fill=MUTED)
        y += 196

    # FAB
    d.ellipse((560, 1050, 660, 1150), fill=SAGE)
    d.text((592, 1075), "+", font=font(48, bold=True), fill=WHITE)
    draw_bottom_nav(d, 3)
    return img


def paint_breathing() -> Image.Image:
    img = vertical_gradient((720, 1280), (61, 107, 90), (30, 58, 48))
    d = ImageDraw.Draw(img)
    draw_status_bar(d, light=False)
    d.text((40, 100), "Breathing", font=font(40, bold=True), fill=WHITE)
    d.text((40, 155), "4-4-6 · find a steady rhythm", font=font(22), fill=SAGE_MUTED)

    cx, cy, r = 360, 620, 180
    d.ellipse((cx - r - 30, cy - r - 30, cx + r + 30, cy + r + 30), outline=(220, 232, 226, ), width=3)
    d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=(124, 168, 148))
    d.ellipse((cx - r + 40, cy - r + 40, cx + r - 40, cy + r - 40), fill=(90, 140, 118))
    tw, th = text_size(d, "Inhale", font(36, bold=True))
    d.text((cx - tw // 2, cy - th // 2 - 10), "Inhale", font=font(36, bold=True), fill=WHITE)
    tw2, _ = text_size(d, "4 seconds", font(22))
    d.text((cx - tw2 // 2, cy + 28), "4 seconds", font=font(22), fill=SAGE_MUTED)

    d.text((0, 900), "", font=font(20))
    for i, label in enumerate(["Inhale 4", "Hold 4", "Exhale 6"]):
        x = 70 + i * 210
        rounded_rect(d, (x, 980, x + 180, 1050), 20, fill=(47, 84, 70))
        tw, _ = text_size(d, label, font(20, bold=True))
        d.text((x + (180 - tw) // 2, 1000), label, font=font(20, bold=True), fill=WHITE)

    tw, _ = text_size(d, "Cycle 2 of 6", font(24))
    d.text(((720 - tw) // 2, 1120), "Cycle 2 of 6", font=font(24), fill=SAGE_MUTED)
    return img


def paint_grounding() -> Image.Image:
    img, d = ui_canvas()
    draw_status_bar(d)
    d.text((40, 100), "Grounding", font=font(42, bold=True), fill=INK)
    d.text((40, 160), "5-4-3-2-1 senses", font=font(22), fill=MUTED)

    steps = [
        ("5", "See", "Name five things you can see"),
        ("4", "Touch", "Four things you can feel"),
        ("3", "Hear", "Three sounds around you"),
        ("2", "Smell", "Two scents you notice"),
        ("1", "Taste", "One thing you can taste"),
    ]
    y = 230
    for num, sense, prompt in steps:
        rounded_rect(d, (40, y, 680, y + 130), 26, fill=SURFACE, outline=BORDER, width=2)
        d.ellipse((64, y + 30, 134, y + 100), fill=SAGE_MUTED)
        tw, th = text_size(d, num, font(32, bold=True))
        d.text((64 + (70 - tw) // 2, y + 30 + (70 - th) // 2), num, font=font(32, bold=True), fill=SAGE_DEEP)
        d.text((160, y + 34), sense, font=font(28, bold=True), fill=INK)
        d.text((160, y + 78), prompt, font=font(22), fill=MUTED)
        y += 150
    return img


def paint_sleep() -> Image.Image:
    img = vertical_gradient((720, 1280), (24, 36, 42), (14, 22, 26))
    d = ImageDraw.Draw(img)
    draw_status_bar(d, light=False)
    d.text((40, 100), "Sleep wind-down", font=font(38, bold=True), fill=WHITE)
    d.text((40, 155), "Quiet checklist · device TTS", font=font(22), fill=(168, 180, 186))

    items = [
        ("Dim the lights", True),
        ("Put the phone aside soon", True),
        ("One slow breath", False),
        ("Spoken wind-down", False),
    ]
    y = 240
    for label, done in items:
        rounded_rect(d, (40, y, 680, y + 110), 24, fill=(30, 42, 48), outline=(48, 62, 70), width=2)
        if done:
            d.ellipse((70, y + 35, 110, y + 75), fill=(124, 168, 148))
            draw_check(d, 90, y + 55, size=14, fill=(14, 22, 26))
        else:
            d.ellipse((70, y + 35, 110, y + 75), outline=(90, 110, 120), width=2)
        d.text((140, y + 40), label, font=font(26), fill=WHITE)
        y += 130

    rounded_rect(d, (40, 820, 680, 980), 28, fill=(47, 84, 70))
    tw, _ = text_size(d, "Start spoken wind-down", font(26, bold=True))
    d.text(((720 - tw) // 2, 880), "Start spoken wind-down", font=font(26, bold=True), fill=WHITE)
    tw, _ = text_size(d, "Audio stays on your phone", font(20))
    d.text(((720 - tw) // 2, 1040), "Audio stays on your phone", font=font(20), fill=(168, 180, 186))
    return img


def paint_insights() -> Image.Image:
    img, d = ui_canvas()
    draw_status_bar(d)
    d.text((40, 100), "Insights", font=font(42, bold=True), fill=INK)
    d.text((40, 160), "Weekly patterns · local only", font=font(22), fill=MUTED)

    rounded_rect(d, (40, 220, 680, 560), 28, fill=SURFACE, outline=BORDER, width=2)
    d.text((72, 250), "Mood this week", font=font(26, bold=True), fill=INK)
    bars = [0.45, 0.6, 0.55, 0.75, 0.68, 0.8, 0.72]
    days = ["M", "T", "W", "T", "F", "S", "S"]
    base_y = 500
    for i, (h_frac, day) in enumerate(zip(bars, days)):
        x = 80 + i * 80
        bh = int(180 * h_frac)
        rounded_rect(d, (x, base_y - bh, x + 44, base_y), 12, fill=SAGE if i < 6 else (106, 154, 127))
        tw, _ = text_size(d, day, font(18))
        d.text((x + (44 - tw) // 2, base_y + 16), day, font=font(18), fill=MUTED)

    rounded_rect(d, (40, 600, 340, 780), 28, fill=SAGE_MUTED)
    d.text((72, 640), "Avg mood", font=font(20), fill=SAGE_DEEP)
    d.text((72, 680), "6.8", font=font(48, bold=True), fill=SAGE_DEEP)
    rounded_rect(d, (380, 600, 680, 780), 28, fill=SURFACE, outline=BORDER, width=2)
    d.text((412, 640), "Check-ins", font=font(20), fill=MUTED)
    d.text((412, 680), "12", font=font(48, bold=True), fill=INK)

    rounded_rect(d, (40, 820, 680, 980), 28, fill=SURFACE, outline=BORDER, width=2)
    d.text((72, 860), "Nothing leaves this device.", font=font(24, bold=True), fill=INK)
    d.text((72, 910), "Charts computed only from local data.", font=font(20), fill=MUTED)
    draw_bottom_nav(d, 4)
    return img


def paint_privacy() -> Image.Image:
    img = vertical_gradient((720, 1280), SAGE, SAGE_DEEP)
    d = ImageDraw.Draw(img)
    draw_status_bar(d, light=False)
    draw_leaf(d, 360, 280, scale=1.35, fill=WHITE, vein=SAGE)
    tw, _ = text_size(d, "Oppuna", font(48, bold=True))
    d.text(((720 - tw) // 2, 400), "Oppuna", font=font(48, bold=True), fill=WHITE)
    tw, _ = text_size(d, "Privacy by architecture", font(26))
    d.text(((720 - tw) // 2, 465), "Privacy by architecture", font=font(26), fill=SAGE_MUTED)

    points = [
        ("No account required", "Open and use — nothing to sign in"),
        ("No cloud sync", "Journal, mood, and chat stay local"),
        ("No analytics SDKs", "Nothing phones home"),
        ("Airplane mode ready", "Full support without a signal"),
    ]
    y = 560
    for title, sub in points:
        rounded_rect(d, (48, y, 672, y + 120), 24, fill=(47, 84, 70))
        d.ellipse((72, y + 38, 112, y + 78), fill=SAGE_MUTED)
        draw_check(d, 92, y + 58, size=14, fill=SAGE_DEEP)
        d.text((136, y + 28), title, font=font(24, bold=True), fill=WHITE)
        d.text((136, y + 68), sub, font=font(20), fill=SAGE_MUTED)
        y += 140
    return img


def paint_plan() -> Image.Image:
    img, d = ui_canvas()
    draw_status_bar(d)
    d.text((40, 100), "Daily plan", font=font(42, bold=True), fill=INK)
    d.text((40, 160), "Personalized offline · your pace", font=font(22), fill=MUTED)

    rounded_rect(d, (40, 220, 680, 360), 28, fill=SAGE)
    d.text((72, 255), "Progress today", font=font(22), fill=SAGE_MUTED)
    d.text((72, 295), "2 of 4 complete", font=font(34, bold=True), fill=WHITE)
    d.rounded_rectangle((360, 305, 640, 325), radius=10, fill=(47, 84, 70))
    d.rounded_rectangle((360, 305, 500, 325), radius=10, fill=SAGE_MUTED)

    activities = [
        ("Morning mood check-in", "2 min", True),
        ("Breathing · box", "4 min", True),
        ("Gratitude journal", "5 min", False),
        ("Evening wind-down", "6 min", False),
    ]
    y = 400
    for title, dur, done in activities:
        rounded_rect(d, (40, y, 680, y + 130), 26, fill=SURFACE, outline=BORDER, width=2)
        color = SAGE if done else BORDER
        d.ellipse((70, y + 40, 120, y + 90), fill=color if done else SURFACE, outline=SAGE if not done else None, width=3)
        if done:
            draw_check(d, 95, y + 65, size=16, fill=WHITE)
        d.text((150, y + 36), title, font=font(26, bold=True), fill=INK)
        d.text((150, y + 78), dur, font=font(20), fill=MUTED)
        y += 150
    return img


@dataclass(frozen=True)
class Slide:
    filename: str
    tagline: str
    support: str
    painter: str
    bg_top: tuple[int, int, int]
    bg_bottom: tuple[int, int, int]
    tagline_color: tuple[int, int, int]
    support_color: tuple[int, int, int]


SLIDES: list[Slide] = [
    Slide(
        "01-private-ai.png",
        "Private AI for your thoughts",
        "Mental wellness support that lives only on your phone",
        "home",
        (232, 242, 236),
        (247, 244, 239),
        INK,
        MUTED,
    ),
    Slide(
        "02-fully-offline.png",
        "Works fully offline",
        "Airplane mode. Full companion. Zero cloud.",
        "privacy",
        (47, 84, 70),
        (30, 58, 48),
        WHITE,
        SAGE_MUTED,
    ),
    Slide(
        "03-ai-companion.png",
        "On-device AI companion",
        "Chat processed locally — nothing is uploaded",
        "chat",
        (18, 24, 22),
        (28, 40, 34),
        WHITE,
        (168, 180, 173),
    ),
    Slide(
        "04-mood-tracker.png",
        "Track your mood privately",
        "Check-ins, tags, and trends — stored on device",
        "mood",
        (247, 244, 239),
        (232, 242, 236),
        INK,
        MUTED,
    ),
    Slide(
        "05-journal.png",
        "A journal only you can read",
        "Daily, gratitude, and thought records stay local",
        "journal",
        (239, 234, 227),
        (247, 244, 239),
        INK,
        MUTED,
    ),
    Slide(
        "06-breathing.png",
        "Breathe your way back to calm",
        "Guided 4-4-6, box breathing, and calm sessions",
        "breathing",
        (61, 107, 90),
        (36, 70, 58),
        WHITE,
        SAGE_MUTED,
    ),
    Slide(
        "07-grounding.png",
        "Ground yourself in the moment",
        "A guided 5-4-3-2-1 senses exercise",
        "grounding",
        (247, 244, 239),
        (220, 232, 226),
        INK,
        MUTED,
    ),
    Slide(
        "08-sleep.png",
        "Wind down without the noise",
        "Gentle sleep checklist and spoken wind-down",
        "sleep",
        (20, 32, 38),
        (14, 22, 26),
        WHITE,
        (168, 180, 186),
    ),
    Slide(
        "09-daily-plan.png",
        "A daily plan at your pace",
        "Personalized offline activities and progress",
        "plan",
        (232, 242, 236),
        (247, 244, 239),
        INK,
        MUTED,
    ),
    Slide(
        "10-no-tracking.png",
        "No accounts. No tracking.",
        "Privacy by architecture — not just a policy",
        "insights",
        (247, 244, 239),
        (239, 234, 227),
        INK,
        MUTED,
    ),
]


PAINTERS = {
    "home": paint_home,
    "chat": paint_chat,
    "mood": paint_mood,
    "journal": paint_journal,
    "breathing": paint_breathing,
    "grounding": paint_grounding,
    "sleep": paint_sleep,
    "insights": paint_insights,
    "privacy": paint_privacy,
    "plan": paint_plan,
}


def compose_slide(slide: Slide) -> Image.Image:
    canvas = vertical_gradient((W, H), slide.bg_top, slide.bg_bottom).convert("RGBA")
    # Soft brand wash
    wash_color = SAGE if slide.tagline_color == INK else (124, 168, 148)
    canvas = radial_wash(canvas, (W // 2, int(H * 0.55)), 700, wash_color, strength=0.18)

    draw = ImageDraw.Draw(canvas)

    # Top brand mark
    if ICON_PATH.exists():
        icon = Image.open(ICON_PATH).convert("RGBA").resize((64, 64), Image.Resampling.LANCZOS)
        # circular mask
        mask = Image.new("L", (64, 64), 0)
        ImageDraw.Draw(mask).ellipse((0, 0, 63, 63), fill=255)
        canvas.paste(icon, (W // 2 - 32, 72), mask)
    else:
        draw_leaf(draw, W // 2, 104, scale=0.55)

    draw_centered_text(draw, 155, "Oppuna", font(28, bold=True), slide.tagline_color)

    # Tagline
    tagline_bottom = draw_centered_text(
        draw, 220, slide.tagline, font(52, bold=True), slide.tagline_color, max_width=920
    )
    draw_centered_text(
        draw, tagline_bottom + 8, slide.support, font(26), slide.support_color, max_width=880
    )

    # Phone — leave room under taglines and a bottom margin so the frame isn’t clipped
    ui = PAINTERS[slide.painter]()
    phone = phone_frame(ui)
    top_content_end = 420
    bottom_margin = 56
    target_h = H - top_content_end - bottom_margin
    scale = target_h / phone.height
    phone = phone.resize((int(phone.width * scale), target_h), Image.Resampling.LANCZOS)
    px = (W - phone.width) // 2
    py = top_content_end + (H - top_content_end - bottom_margin - phone.height) // 2
    canvas.paste(phone, (px, py), phone)

    return canvas.convert("RGB")


def write_taglines_md(slides: list[Slide]) -> None:
    lines = [
        "# Play Store screenshot taglines",
        "",
        "Phone screenshots are **1080×1920** PNGs in this folder.",
        "Regenerate with: `python3 scripts/generate-play-store-screenshots.py`",
        "",
        "| # | File | Tagline | Supporting line |",
        "| --- | --- | --- | --- |",
    ]
    for i, s in enumerate(slides, 1):
        lines.append(f"| {i} | `{s.filename}` | {s.tagline} | {s.support} |")
    lines.extend(
        [
            "",
            "## Suggested Play Console order",
            "",
            "Upload in the numbered order above. Lead with privacy/offline, then AI companion,",
            "then core wellness tools (mood, journal, breathing), then plan/insights.",
            "",
            "## Notes",
            "",
            "- These are branded marketing mockups (not live device captures).",
            "- Chat / journal editor screens use FLAG_SECURE in the app, so mockups are appropriate for store listing.",
            "- Copy matches confirmed product capabilities in `docs/APP_STORE.md` and `website/FEATURE_INVENTORY.md`.",
            "",
        ]
    )
    (OUT_DIR / "TAGLINES.md").write_text("\n".join(lines), encoding="utf-8")


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for slide in SLIDES:
        img = compose_slide(slide)
        path = OUT_DIR / slide.filename
        img.save(path, "PNG", optimize=True)
        print(f"Wrote {path.relative_to(ROOT)} ({img.size[0]}×{img.size[1]})")
    write_taglines_md(SLIDES)
    print(f"Wrote {(OUT_DIR / 'TAGLINES.md').relative_to(ROOT)}")


if __name__ == "__main__":
    main()
