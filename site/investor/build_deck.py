#!/usr/bin/env python3
"""Build Oppuna investor pitch deck (PPTX) — 14 core + 3 appendix slides, 16:9."""

from __future__ import annotations

from pathlib import Path

from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.oxml.ns import qn
from pptx.oxml import parse_xml
from pptx.util import Emu, Inches, Pt

ROOT = Path(__file__).resolve().parent
ASSETS = ROOT / "assets"

# Brand
IVORY = RGBColor(0xF7, 0xF4, 0xEF)
SURFACE = RGBColor(0xFF, 0xFC, 0xF8)
SAGE = RGBColor(0x3D, 0x6B, 0x5A)
SAGE_DEEP = RGBColor(0x2F, 0x54, 0x46)
SAGE_SOFT = RGBColor(0xDC, 0xE8, 0xE2)
TEXT = RGBColor(0x1C, 0x24, 0x20)
MUTED = RGBColor(0x5A, 0x67, 0x5F)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
LINE = RGBColor(0xC9, 0xD4, 0xCE)

SLIDE_W = Inches(13.333)
SLIDE_H = Inches(7.5)

FONT_DISPLAY = "Fraunces"
FONT_BODY = "Outfit"


def set_run_font(run, name: str, size_pt: float, color: RGBColor, bold: bool = False):
    run.font.name = name
    run.font.size = Pt(size_pt)
    run.font.color.rgb = color
    run.font.bold = bold
    # Ensure East Asian / latin theme fonts also set
    rPr = run._r.get_or_add_rPr()
    for tag in ("latin", "ea", "cs"):
        el = rPr.find(qn(f"a:{tag}"))
        if el is None:
            el = parse_xml(f'<a:{tag} xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" typeface="{name}"/>')
            rPr.append(el)
        else:
            el.set("typeface", name)


def add_textbox(slide, left, top, width, height, text, *, font=FONT_BODY, size=16, color=TEXT, bold=False, align=PP_ALIGN.LEFT, anchor=MSO_ANCHOR.TOP):
    box = slide.shapes.add_textbox(left, top, width, height)
    tf = box.text_frame
    tf.word_wrap = True
    tf.auto_size = None
    try:
        tf._txBody.bodyPr.set("anchor", {MSO_ANCHOR.TOP: "t", MSO_ANCHOR.MIDDLE: "ctr", MSO_ANCHOR.BOTTOM: "b"}[anchor])
    except Exception:
        pass
    p = tf.paragraphs[0]
    p.alignment = align
    run = p.add_run()
    run.text = text
    set_run_font(run, font, size, color, bold=bold)
    return box


def add_paragraph(tf, text, *, font=FONT_BODY, size=16, color=TEXT, bold=False, align=PP_ALIGN.LEFT, space_before=0, space_after=6):
    p = tf.add_paragraph()
    p.alignment = align
    p.space_before = Pt(space_before)
    p.space_after = Pt(space_after)
    run = p.add_run()
    run.text = text
    set_run_font(run, font, size, color, bold=bold)
    return p


def fill_solid(shape, color: RGBColor):
    shape.fill.solid()
    shape.fill.fore_color.rgb = color
    shape.line.fill.background()


def add_rect(slide, left, top, width, height, color: RGBColor):
    shape = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, left, top, width, height)
    fill_solid(shape, color)
    return shape


def add_round_rect(slide, left, top, width, height, color: RGBColor):
    shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
    fill_solid(shape, color)
    # soften corners
    try:
        shape.adjustments[0] = 0.12
    except Exception:
        pass
    return shape


def add_notes(slide, text: str):
    notes = slide.notes_slide.notes_text_frame
    notes.clear()
    p = notes.paragraphs[0]
    run = p.add_run()
    run.text = text


def new_slide(prs, bg=IVORY):
    layout = prs.slide_layouts[6]  # blank
    slide = prs.slides.add_slide(layout)
    add_rect(slide, 0, 0, SLIDE_W, SLIDE_H, bg)
    return slide


def footer_meta(slide, page: str):
    add_textbox(slide, Inches(0.6), Inches(7.1), Inches(4), Inches(0.3), "Oppuna · Confidential", font=FONT_BODY, size=11, color=MUTED)
    add_textbox(slide, Inches(11.5), Inches(7.1), Inches(1.3), Inches(0.3), page, font=FONT_BODY, size=11, color=MUTED, align=PP_ALIGN.RIGHT)


def title_block(slide, takeaway: str, kicker: str | None = None):
    if kicker:
        add_textbox(slide, Inches(0.7), Inches(0.35), Inches(11.5), Inches(0.35), kicker, font=FONT_BODY, size=14, color=SAGE, bold=True)
        top = Inches(0.7)
    else:
        top = Inches(0.45)
    add_textbox(slide, Inches(0.7), top, Inches(12), Inches(1.1), takeaway, font=FONT_DISPLAY, size=35, color=SAGE_DEEP, bold=True)


def bullet_block(slide, left, top, width, height, items: list[str], *, size=16, color=TEXT):
    box = slide.shapes.add_textbox(left, top, width, height)
    tf = box.text_frame
    tf.word_wrap = True
    for i, item in enumerate(items):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = PP_ALIGN.LEFT
        p.space_after = Pt(10)
        p.level = 0
        run = p.add_run()
        run.text = f"•  {item}"
        set_run_font(run, FONT_BODY, size, color)
    return box


def metric_card(slide, left, top, width, height, value: str, label: str):
    add_round_rect(slide, left, top, width, height, SURFACE)
    add_textbox(slide, left + Inches(0.25), top + Inches(0.35), width - Inches(0.5), Inches(0.7), value, font=FONT_DISPLAY, size=36, color=SAGE_DEEP, bold=True, align=PP_ALIGN.CENTER)
    add_textbox(slide, left + Inches(0.25), top + Inches(1.15), width - Inches(0.5), Inches(0.7), label, font=FONT_BODY, size=15, color=MUTED, align=PP_ALIGN.CENTER)


def build():
    prs = Presentation()
    prs.slide_width = SLIDE_W
    prs.slide_height = SLIDE_H

    icon = ASSETS / "icon.png"
    screen_home = ASSETS / "screen_02.jpg"
    screen_journal = ASSETS / "screen_01.jpg"
    screen_splash = ASSETS / "screen_00.jpg"
    qr = ASSETS / "play-qr.png"
    feature = ASSETS / "banner_12.jpg" if (ASSETS / "banner_12.jpg").exists() else ASSETS / "feature-image.png"

    # ─── 1 Cover ───
    s = new_slide(prs, IVORY)
    add_rect(s, 0, 0, Inches(5.2), SLIDE_H, SAGE_DEEP)
    if icon.exists():
        s.shapes.add_picture(str(icon), Inches(0.7), Inches(0.7), Inches(0.9), Inches(0.9))
    add_textbox(s, Inches(0.7), Inches(1.9), Inches(4.1), Inches(0.9), "Oppuna", font=FONT_DISPLAY, size=54, color=WHITE, bold=True)
    add_textbox(s, Inches(0.7), Inches(2.85), Inches(4.1), Inches(0.8), "Private AI for your thoughts.", font=FONT_DISPLAY, size=26, color=SAGE_SOFT, bold=True)
    add_textbox(s, Inches(0.7), Inches(3.8), Inches(4.1), Inches(0.9), "Offline, private emotional wellness on Android", font=FONT_BODY, size=16, color=WHITE)
    add_textbox(s, Inches(0.7), Inches(5.5), Inches(4.1), Inches(0.4), "https://oppuna.com", font=FONT_BODY, size=14, color=SAGE_SOFT)
    add_textbox(s, Inches(0.7), Inches(5.95), Inches(4.1), Inches(0.5), "Kaushik I B · Technical Founder\nADILAKSHMI INFOTECH PRIVATE LIMITED", font=FONT_BODY, size=13, color=WHITE)
    if screen_home.exists():
        s.shapes.add_picture(str(screen_home), Inches(6.4), Inches(0.55), height=Inches(6.4))
    add_notes(
        s,
        "SPEAKER (~40s)\n"
        "Open with the product in hand: Oppuna is already live on Android as a private, offline-first emotional-wellness companion.\n"
        "Promise: useful everyday support without accounts, cloud processing, ads, or invasive tracking.\n"
        "Ask: a fundraising or strategic-partnership conversation.\n\n"
        "SOURCES\n"
        f"- Product site: https://oppuna.com\n"
        "- Google Play: https://play.google.com/store/apps/details?id=com.oppuna.care\n"
        "- Cover screenshot: live Google Play listing creative for Oppuna (com.oppuna.care), retrieved Aug 2026.",
    )

    # ─── 2 Origin ───
    s = new_slide(prs)
    title_block(s, "Dignity and privacy are not premium features.")
    add_textbox(
        s,
        Inches(0.7),
        Inches(2.0),
        Inches(7.8),
        Inches(1.4),
        "Oppuna is a coined, Koraga-inspired name. The Koraga verb root “oppu” means “to be agreeable” or “to be in accord.”",
        font=FONT_BODY,
        size=18,
        color=TEXT,
    )
    add_round_rect(s, Inches(0.7), Inches(3.5), Inches(7.8), Inches(1.5), SAGE_SOFT)
    add_textbox(
        s,
        Inches(0.95),
        Inches(3.75),
        Inches(7.3),
        Inches(1.1),
        "“Oppuna represents meeting a person where they are—with agreement, dignity and without judgement.”",
        font=FONT_DISPLAY,
        size=20,
        color=SAGE_DEEP,
        bold=True,
    )
    bullet_block(
        s,
        Inches(0.7),
        Inches(5.2),
        Inches(7.8),
        Inches(1.5),
        [
            "The name honours the Koraga indigenous community of coastal Karnataka.",
            "The product is dedicated to inclusion—and designed for a broad audience.",
            "Technology should respect users before asking for trust.",
        ],
        size=15,
    )
    if icon.exists():
        s.shapes.add_picture(str(icon), Inches(10.3), Inches(2.4), Inches(2.2), Inches(2.2))
        add_textbox(s, Inches(9.8), Inches(4.8), Inches(3), Inches(0.8), "Living-leaf mark\nDignity, not spectacle", font=FONT_BODY, size=14, color=MUTED, align=PP_ALIGN.CENTER)
    footer_meta(s, "02")
    add_notes(
        s,
        "SPEAKER (~40s)\n"
        "Explain the name with restraint: Oppuna is coined and Koraga-inspired. Do not claim a dictionary translation for the full word.\n"
        "oppu = to be agreeable / in accord. Brand interpretation: meet people where they are, without judgement.\n"
        "Honour the Koraga community of coastal Karnataka through language and dignity—not costume imagery.\n\n"
        "SOURCES\n"
        "- D. N. Shankara Bhat, The Koraga Language: https://dnshankarabhat.net/wp-content/uploads/2014/11/Koraga_Language.pdf\n"
        "  (documents the Koraga verb root oppu: “to be agreeable / to be in accord”).",
    )

    # ─── 3 Problem ───
    s = new_slide(prs)
    title_block(s, "The most sensitive thoughts are still being asked to trust the cloud.")
    cards = [
        ("Privacy", "Vulnerable thoughts still pass through accounts, servers and third-party AI pipelines."),
        ("Access", "Many products depend on continuous connectivity and subscriptions for basic support."),
        ("Trust", "People hesitate to open up when they do not control where their information goes."),
    ]
    for i, (h, body) in enumerate(cards):
        left = Inches(0.7 + i * 4.05)
        add_round_rect(s, left, Inches(2.2), Inches(3.8), Inches(2.6), SURFACE)
        add_rect(s, left, Inches(2.2), Inches(0.12), Inches(2.6), SAGE)
        add_textbox(s, left + Inches(0.35), Inches(2.45), Inches(3.2), Inches(0.5), h, font=FONT_DISPLAY, size=24, color=SAGE_DEEP, bold=True)
        add_textbox(s, left + Inches(0.35), Inches(3.15), Inches(3.2), Inches(1.4), body, font=FONT_BODY, size=16, color=TEXT)
    add_textbox(
        s,
        Inches(0.7),
        Inches(5.15),
        Inches(12),
        Inches(1.4),
        "India context: ~10.6% of adults live with a current mental disorder (NMHS), with treatment gaps of ~70–92%. "
        "958M active internet users (IAMAI–Kantar 2025), on a ~95% Android mobile OS base (Statcounter). "
        "Oppuna targets everyday self-reflection—not clinical diagnosis.",
        font=FONT_BODY,
        size=14,
        color=MUTED,
    )
    footer_meta(s, "03")
    add_notes(
        s,
        "SPEAKER (~50s)\n"
        "Frame three connected barriers—privacy, access, trust—without medicalising the product.\n"
        "Use India evidence to show scale and access gap, then pivot: Oppuna is for everyday wellness, not treatment.\n\n"
        "SOURCES\n"
        "- NIMHANS / National Mental Health Survey of India 2015–16: current mental morbidity ~10.6%; lifetime ~13.7%; "
        "treatment gap commonly reported 70–92% across disorders. Summary: https://cdn.who.int/media/docs/default-source/searo/india/health-topic-pdf/summary.pdf ; "
        "PIB reference: https://www.pib.gov.in/PressReleasePage.aspx?PRID=2188003\n"
        "- IAMAI–Kantar Internet in India Report 2025: 958 million active internet users. "
        "Press PDF: https://www.indiadigitalsummit.in/wp-content/uploads/2026/01/Internet-in-India-2025-Press-Release-Final.pdf\n"
        "- Statcounter Mobile OS share India (Mar 2025 snapshot): Android ~94.8%. "
        "https://gs.statcounter.com/os-market-share/mobile/india/\n"
        "- Product positioning (wellness, not therapy): https://oppuna.com",
    )

    # ─── 4 Solution ───
    s = new_slide(prs)
    title_block(s, "Oppuna keeps everyday wellness support on the phone.")
    points = [
        ("No account", "Open and begin—no signup wall."),
        ("No cloud processing", "Journals, moods and chats stay local."),
        ("No advertisements", "No ads inside vulnerable moments."),
        ("No invasive analytics", "Support without selling attention."),
        ("Works offline", "Useful in airplane mode and low connectivity."),
        ("User control", "Local export and delete-all controls."),
    ]
    for i, (h, b) in enumerate(points):
        col = i % 2
        row = i // 2
        left = Inches(0.7 + col * 5.4)
        top = Inches(2.0 + row * 1.35)
        add_round_rect(s, left, top, Inches(5.1), Inches(1.15), SURFACE)
        add_textbox(s, left + Inches(0.3), top + Inches(0.2), Inches(4.5), Inches(0.4), h, font=FONT_BODY, size=18, color=SAGE_DEEP, bold=True)
        add_textbox(s, left + Inches(0.3), top + Inches(0.6), Inches(4.5), Inches(0.4), b, font=FONT_BODY, size=15, color=MUTED)
    if screen_journal.exists():
        s.shapes.add_picture(str(screen_journal), Inches(10.6), Inches(1.9), height=Inches(4.8))
    footer_meta(s, "04")
    add_notes(
        s,
        "SPEAKER (~45s)\n"
        "State the solution plainly: private information remains under the user’s control on the Android device.\n"
        "Clarify: general wellness and self-reflection—not therapy, diagnosis, a medical device, or emergency care.\n\n"
        "SOURCES\n"
        "- Confirmed capabilities and privacy claims: https://oppuna.com and https://oppuna.com/privacy/\n"
        "- Screenshot: Google Play listing creative for Oppuna Journal screen, Aug 2026.",
    )

    # ─── 5 Product experience ───
    s = new_slide(prs)
    title_block(s, "One private space for the small practices that build consistency.")
    steps = ["1. Check in with a mood", "2. Receive a gentle daily plan", "3. Journal, breathe, ground or talk", "4. Return and observe patterns"]
    for i, step in enumerate(steps):
        left = Inches(0.7 + i * 3.1)
        add_round_rect(s, left, Inches(1.85), Inches(2.95), Inches(0.7), SAGE_SOFT)
        add_textbox(s, left + Inches(0.1), Inches(1.98), Inches(2.75), Inches(0.5), step, font=FONT_BODY, size=13, color=SAGE_DEEP, bold=True, align=PP_ALIGN.CENTER)
    for i, path in enumerate([screen_splash, screen_home, screen_journal]):
        if path.exists():
            s.shapes.add_picture(str(path), Inches(0.9 + i * 4.1), Inches(2.8), height=Inches(3.9))
    footer_meta(s, "05")
    add_notes(
        s,
        "SPEAKER (~50s)\n"
        "Walk the journey: mood → plan → practices (journal / breathe / companion) → patterns over time.\n"
        "Mention verified capabilities: mood check-ins, private journaling, personalised daily plans, breathing/grounding, "
        "sleep wind-down, local voice notes, on-device companion, export/delete, English/Hindi/Spanish, crisis-resource guidance, offline use.\n\n"
        "SOURCES\n"
        "- Product feature inventory & website: https://oppuna.com\n"
        "- Languages verified in marketing configuration / app FAQ: English, Hindi, Spanish\n"
        "- Screenshots: official Google Play listing creatives (splash, Today’s Care, Journal), Aug 2026.",
    )

    # ─── 6 Technical advantage ───
    s = new_slide(prs)
    title_block(s, "Privacy is built into the architecture.")
    # architecture flow
    boxes = [
        (Inches(0.9), "User"),
        (Inches(4.3), "Android device"),
        (Inches(8.0), "Local storage +\non-device intelligence"),
    ]
    for left, label in boxes:
        add_round_rect(s, left, Inches(2.3), Inches(3.0), Inches(1.3), SURFACE)
        add_textbox(s, left + Inches(0.15), Inches(2.55), Inches(2.7), Inches(0.9), label, font=FONT_BODY, size=18, color=SAGE_DEEP, bold=True, align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
    for left in (Inches(3.95), Inches(7.65)):
        add_textbox(s, left, Inches(2.65), Inches(0.4), Inches(0.5), "→", font=FONT_DISPLAY, size=28, color=SAGE, bold=True)
    bullet_block(
        s,
        Inches(0.9),
        Inches(4.0),
        Inches(11.5),
        Inches(2.5),
        [
            "Journals, moods, voice notes and conversations remain on the device.",
            "Deterministic safety logic and local crisis guidance complement the on-device companion.",
            "Offline and airplane-mode operation are first-class product behaviours.",
            "No claim of perfect safety, clinical validation, or certifications beyond what is verified.",
        ],
        size=16,
    )
    footer_meta(s, "06")
    add_notes(
        s,
        "SPEAKER (~45s)\n"
        "Show architecture as product strategy: privacy is not a policy add-on.\n"
        "Safety: local crisis-resource guidance + deterministic checks; do not overclaim.\n\n"
        "SOURCES\n"
        "- Architecture / privacy description: https://oppuna.com and https://oppuna.com/privacy/\n"
        "- Crisis resources referenced on site: 112, Tele-MANAS, KIRAN (official government pages linked from oppuna.com).",
    )

    # ─── 7 Traction ───
    s = new_slide(prs)
    title_block(s, "Early users are coming back.")
    metric_card(s, Inches(0.9), Inches(2.1), Inches(5.4), Inches(2.2), "80–100", "Early users")
    metric_card(s, Inches(6.9), Inches(2.1), Inches(5.4), Inches(2.2), "~90%", "Returning during observation period")
    add_textbox(
        s,
        Inches(0.9),
        Inches(4.6),
        Inches(11.5),
        Inches(0.7),
        "Even at an early stage, repeat usage indicates that privacy and offline access are resonating.",
        font=FONT_BODY,
        size=18,
        color=TEXT,
    )
    add_textbox(
        s,
        Inches(0.9),
        Inches(5.4),
        Inches(11.5),
        Inches(0.9),
        "Live on Google Play · Production website at oppuna.com\n"
        "* Based on founder-reported internal early-user tracking across approximately 80–100 users. "
        "Replace with a defined D7/D30 cohort before final investor distribution.",
        font=FONT_BODY,
        size=13,
        color=MUTED,
    )
    footer_meta(s, "07")
    add_notes(
        s,
        "SPEAKER (~40s)\n"
        "Lead with the two metrics. Use exact audience wording: "
        "“Approximately 90% of our early users have returned during the current observation period.”\n"
        "Do not call this D7/D30/DAU/MAU until cohort windows are defined.\n"
        "No invented downloads, revenue, ratings, or testimonials.\n\n"
        "SOURCES\n"
        "- Traction figures: founder-reported internal early-user tracking (Aug 2026 brief)\n"
        "- Distribution: Google Play listing https://play.google.com/store/apps/details?id=com.oppuna.care\n"
        "- Website: https://oppuna.com",
    )

    # ─── 8 Market ───
    s = new_slide(prs)
    title_block(s, "India is the starting point for private, accessible digital wellness.")
    add_textbox(s, Inches(0.7), Inches(1.85), Inches(7.5), Inches(0.4), "Initial wedge", font=FONT_BODY, size=14, color=SAGE, bold=True)
    bullet_block(
        s,
        Inches(0.7),
        Inches(2.25),
        Inches(7.5),
        Inches(2.4),
        [
            "Android-first adults in India",
            "Privacy-conscious users and inconsistent-connectivity contexts",
            "Everyday self-reflection—not clinical treatment",
            "Regional-language and underserved communities",
        ],
        size=16,
    )
    # TAM SAM SOM
    add_round_rect(s, Inches(8.5), Inches(1.95), Inches(4.2), Inches(4.4), SURFACE)
    add_textbox(s, Inches(8.7), Inches(2.15), Inches(3.8), Inches(0.4), "Bottom-up sizing", font=FONT_BODY, size=14, color=SAGE, bold=True)
    market_lines = [
        ("TAM", "~900M+", "Android-leaning internet users in India (958M AIU × ~95% Android)"),
        ("SAM", "~45–90M", "Adults open to digital self-reflection / wellness tools (assumptive 5–10% of AIU)"),
        ("SOM", "1K → 50K", "Near-term validation beachhead of active users before scale"),
    ]
    y = 2.6
    for label, val, note in market_lines:
        add_textbox(s, Inches(8.7), Inches(y), Inches(3.8), Inches(0.3), f"{label}  {val}", font=FONT_DISPLAY, size=18, color=SAGE_DEEP, bold=True)
        add_textbox(s, Inches(8.7), Inches(y + 0.35), Inches(3.8), Inches(0.55), note, font=FONT_BODY, size=12, color=MUTED)
        y += 1.05
    add_textbox(
        s,
        Inches(0.7),
        Inches(5.0),
        Inches(7.5),
        Inches(1.5),
        "Separate clearly: clinical mental-health prevalence (NMHS) shows need and stigma; "
        "Oppuna’s commercial wedge is general wellness users who want private, offline support. "
        "SAM/SOM are planning ranges, not purchased market reports.",
        font=FONT_BODY,
        size=14,
        color=MUTED,
    )
    footer_meta(s, "08")
    add_notes(
        s,
        "SPEAKER (~55s)\n"
        "Tell a bottom-up India story. Do not use unsupported global mental-health market dollars.\n"
        "Clarify wellness vs clinical patients.\n\n"
        "SOURCES / ASSUMPTIONS\n"
        "- IAMAI–Kantar 2025: 958M active internet users in India.\n"
        "- Statcounter India mobile OS (Mar 2025): Android ~94.8% → TAM ≈ Android-addressable internet users (~900M+).\n"
        "- SAM: planning assumption that 5–10% of AIU may be addressable for digital self-reflection / wellness tools "
        "(not a published market size). Cite as hypothesis.\n"
        "- SOM: internal near-term beachhead 1,000 → 50,000 active users for validation.\n"
        "- NMHS for clinical context only (not Oppuna TAM): ~10.6% current mental morbidity; large treatment gap.\n"
        "- IDC India smartphone shipments 2024: 151M units (device market context): "
        "https://my.idc.com/getdoc.jsp?containerId=prAP53185725",
    )

    # ─── 9 Business model ───
    s = new_slide(prs)
    title_block(s, "Keep the core free; monetise expanded capability and distribution.")
    stages = [
        ("1", "Free consumer core", "Builds trust and daily usage"),
        ("2", "Optional Oppuna Plus", "Advanced AI, voice, insights"),
        ("3", "Institutional programs", "Employer, CSR, NGO, public wellness"),
        ("4", "SDK / platform", "License the privacy-first engine"),
    ]
    for i, (n, h, b) in enumerate(stages):
        left = Inches(0.7 + i * 3.15)
        add_round_rect(s, left, Inches(2.1), Inches(3.0), Inches(2.5), SURFACE)
        add_textbox(s, left + Inches(0.2), Inches(2.3), Inches(2.6), Inches(0.45), n, font=FONT_DISPLAY, size=28, color=SAGE, bold=True)
        add_textbox(s, left + Inches(0.2), Inches(2.9), Inches(2.6), Inches(0.7), h, font=FONT_BODY, size=16, color=SAGE_DEEP, bold=True)
        add_textbox(s, left + Inches(0.2), Inches(3.7), Inches(2.6), Inches(0.7), b, font=FONT_BODY, size=14, color=MUTED)
    add_round_rect(s, Inches(0.7), Inches(5.0), Inches(12), Inches(1.4), SAGE_SOFT)
    add_textbox(
        s,
        Inches(1.0),
        Inches(5.25),
        Inches(11.4),
        Inches(1.0),
        "Pricing hypothesis (not final): Oppuna Plus ₹99–₹199 / month.\n"
        "Principles: no ads in vulnerable moments · no selling personal/emotional information · no per-message charging · core support stays free.",
        font=FONT_BODY,
        size=16,
        color=SAGE_DEEP,
    )
    footer_meta(s, "09")
    add_notes(
        s,
        "SPEAKER (~45s)\n"
        "Emphasise principled monetisation: expand capability, never withdraw essential support.\n"
        "Institutional revenue sponsors access; does not buy user emotional data.\n\n"
        "SOURCES\n"
        "- Business principles and premium hypothesis: founder strategy brief, Aug 2026\n"
        "- Product free-core capabilities verified on https://oppuna.com",
    )

    # ─── 10 Premium roadmap ───
    s = new_slide(prs)
    title_block(s, "Premium adds depth without taking support away.")
    add_round_rect(s, Inches(0.7), Inches(1.95), Inches(5.8), Inches(4.5), SURFACE)
    add_textbox(s, Inches(0.95), Inches(2.15), Inches(5.3), Inches(0.45), "Free core (always)", font=FONT_DISPLAY, size=22, color=SAGE_DEEP, bold=True)
    bullet_block(
        s,
        Inches(0.95),
        Inches(2.7),
        Inches(5.3),
        Inches(3.5),
        [
            "Basic on-device supportive companion",
            "Mood check-ins, journaling, thought records",
            "Breathing, grounding, sleep wind-down",
            "Basic daily wellness plan",
            "Crisis resources + local export/delete",
        ],
        size=15,
    )
    add_round_rect(s, Inches(6.8), Inches(1.95), Inches(5.8), Inches(4.5), SAGE_DEEP)
    add_textbox(s, Inches(7.05), Inches(2.15), Inches(5.3), Inches(0.45), "Future Oppuna Plus", font=FONT_DISPLAY, size=22, color=WHITE, bold=True)
    box = s.shapes.add_textbox(Inches(7.05), Inches(2.7), Inches(5.3), Inches(3.5))
    tf = box.text_frame
    tf.word_wrap = True
    plus = [
        "More capable on-device AI models",
        "Low-latency natural voice conversations",
        "Deeper personalisation & guided journeys",
        "Advanced mood trends / progress summaries",
        "User-controlled encrypted backup & migration",
    ]
    for i, item in enumerate(plus):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.space_after = Pt(10)
        run = p.add_run()
        run.text = f"•  {item}"
        set_run_font(run, FONT_BODY, 15, SAGE_SOFT)
    footer_meta(s, "10")
    add_notes(
        s,
        "SPEAKER (~40s)\n"
        "Premium is optional and under validation. Never describe as AI therapy; no clinical-effectiveness claims.\n"
        "Repeat: no ads, no information selling, no per-message charging.\n\n"
        "SOURCES\n"
        "- Free vs Plus capability split: founder product roadmap brief, Aug 2026\n"
        "- Current shipped free capabilities: https://oppuna.com",
    )

    # ─── 11 GTM ───
    s = new_slide(prs)
    title_block(s, "Trust-led distribution can reach users conventional wellness apps miss.")
    sequence = [
        "Google Play + ASO",
        "Founder-led communities",
        "Regional-language & privacy content",
        "NGO / community partners",
        "CSR-sponsored access",
        "Employer & institutional pilots",
        "Public-wellness / innovation programs",
    ]
    for i, item in enumerate(sequence):
        top = Inches(1.95 + i * 0.6)
        add_round_rect(s, Inches(0.9), top, Inches(8.2), Inches(0.5), SURFACE if i % 2 == 0 else SAGE_SOFT)
        add_textbox(s, Inches(1.1), top + Inches(0.08), Inches(7.8), Inches(0.4), f"{i+1}.  {item}", font=FONT_BODY, size=16, color=TEXT)
    add_round_rect(s, Inches(9.5), Inches(2.3), Inches(3.2), Inches(3.2), SAGE)
    add_textbox(s, Inches(9.7), Inches(2.8), Inches(2.8), Inches(0.8), "Next milestone", font=FONT_BODY, size=14, color=SAGE_SOFT, align=PP_ALIGN.CENTER)
    add_textbox(s, Inches(9.7), Inches(3.5), Inches(2.8), Inches(0.8), "1,000", font=FONT_DISPLAY, size=40, color=WHITE, bold=True, align=PP_ALIGN.CENTER)
    add_textbox(s, Inches(9.7), Inches(4.4), Inches(2.8), Inches(0.7), "active users\nfor validation", font=FONT_BODY, size=15, color=WHITE, align=PP_ALIGN.CENTER)
    footer_meta(s, "11")
    add_notes(
        s,
        "SPEAKER (~40s)\n"
        "Sequence trust before scale. Do not invent signed partnerships.\n"
        "Next validation milestone: 1,000 active users.\n\n"
        "SOURCES\n"
        "- GTM sequence and 1,000-user milestone: founder strategy brief, Aug 2026\n"
        "- Current distribution channel: Google Play listing for com.oppuna.care",
    )

    # ─── 12 Competition ───
    s = new_slide(prs)
    title_block(s, "Oppuna competes on architecture, not another content library.")
    headers = ["Dimension", "Oppuna", "Wysa", "Calm / Headspace", "Cloud AI chatbots"]
    rows = [
        ["Fully offline core", "Yes", "Limited", "No", "No"],
        ["On-device intelligence", "Yes", "Cloud AI", "Content / cloud", "Cloud"],
        ["No account required", "Yes", "Anonymous options", "Account typical", "Account typical"],
        ["No advertisements", "Yes", "Consumer freemium", "Subscription", "Varies"],
        ["Local user control", "Yes", "Policy + servers", "Cloud sync", "Cloud"],
        ["India / multilingual", "EN·HI·ES", "Strong India focus", "Global content", "Varies"],
        ["SDK / platform path", "Planned", "Enterprise focus", "B2B wellness", "Platform APIs"],
    ]
    # table-like layout
    col_w = [2.6, 2.1, 2.3, 2.6, 2.4]
    x0 = 0.55
    y0 = 1.9
    # header
    x = x0
    for i, h in enumerate(headers):
        add_rect(s, Inches(x), Inches(y0), Inches(col_w[i]), Inches(0.45), SAGE_DEEP)
        add_textbox(s, Inches(x + 0.05), Inches(y0 + 0.08), Inches(col_w[i] - 0.1), Inches(0.35), h, font=FONT_BODY, size=12, color=WHITE, bold=True, align=PP_ALIGN.CENTER)
        x += col_w[i]
    for r, row in enumerate(rows):
        x = x0
        bg = SURFACE if r % 2 == 0 else SAGE_SOFT
        for i, cell in enumerate(row):
            add_rect(s, Inches(x), Inches(y0 + 0.45 + r * 0.55), Inches(col_w[i]), Inches(0.55), bg)
            color = SAGE_DEEP if i == 1 and cell == "Yes" else TEXT
            add_textbox(
                s,
                Inches(x + 0.05),
                Inches(y0 + 0.52 + r * 0.55),
                Inches(col_w[i] - 0.1),
                Inches(0.4),
                cell,
                font=FONT_BODY,
                size=12,
                color=color,
                bold=(i == 0 or (i == 1 and cell == "Yes")),
                align=PP_ALIGN.CENTER if i else PP_ALIGN.LEFT,
            )
            x += col_w[i]
    add_textbox(
        s,
        Inches(0.7),
        Inches(6.35),
        Inches(12),
        Inches(0.5),
        "Emerging moat: on-device architecture · local-model optimisation · safety-aware offline workflows · trust-led brand · multilingual UX · future SDK.",
        font=FONT_BODY,
        size=13,
        color=MUTED,
    )
    footer_meta(s, "12")
    add_notes(
        s,
        "SPEAKER (~50s)\n"
        "Do not claim Oppuna is the only product globally. Compete on architecture dimensions that are defensible.\n"
        "No patent/proprietary-dataset claims.\n\n"
        "SOURCES\n"
        "- Wysa Play listing / product positioning: https://play.google.com/store/apps/details?id=bot.touchkin\n"
        "- Calm / Headspace: public consumer products (account + cloud content libraries)\n"
        "- Cloud AI chatbot category: representative cloud-routed companions (e.g. Woebot-class products)\n"
        "- Oppuna capabilities: https://oppuna.com\n"
        "Comparison reflects publicly described architectures as of research date Aug 2026; verify before final distribution.",
    )

    # ─── 13 Team ───
    s = new_slide(prs)
    title_block(s, "The team combines enterprise experience with product execution.")
    add_round_rect(s, Inches(0.7), Inches(1.95), Inches(5.9), Inches(4.5), SURFACE)
    add_textbox(s, Inches(0.95), Inches(2.15), Inches(5.4), Inches(0.4), "Kaushik I B", font=FONT_DISPLAY, size=24, color=SAGE_DEEP, bold=True)
    add_textbox(s, Inches(0.95), Inches(2.6), Inches(5.4), Inches(0.35), "Technical Founder", font=FONT_BODY, size=15, color=SAGE, bold=True)
    bullet_block(
        s,
        Inches(0.95),
        Inches(3.1),
        Inches(5.4),
        Inches(3.1),
        [
            "10+ years in software architecture, cloud and AI",
            "Enterprise systems across banking, FinTech and AI",
            "TOGAF certified; Microsoft Teams ecosystem experience",
            "Built Oppuna from architecture through Play launch",
            "Currently building enterprise AI and agentic systems",
        ],
        size=14,
    )
    add_round_rect(s, Inches(6.9), Inches(1.95), Inches(5.7), Inches(4.5), SAGE_SOFT)
    add_textbox(s, Inches(7.15), Inches(2.15), Inches(5.2), Inches(0.4), "[CO-FOUNDER NAME]", font=FONT_DISPLAY, size=22, color=SAGE_DEEP, bold=True)
    add_textbox(s, Inches(7.15), Inches(2.6), Inches(5.2), Inches(0.35), "[ROLE]", font=FONT_BODY, size=15, color=SAGE, bold=True)
    bullet_block(
        s,
        Inches(7.15),
        Inches(3.1),
        Inches(5.2),
        Inches(3.0),
        [
            "[Relevant professional experience]",
            "[Product, business, clinical, operations or distribution strength]",
            "[Specific contribution to Oppuna]",
        ],
        size=14,
    )
    footer_meta(s, "13")
    add_notes(
        s,
        "SPEAKER (~45s)\n"
        "Founder narrative: after a decade building systems for banks and enterprises, Kaushik examined what happens when AI handles private thoughts. "
        "Most wellness products still require cloud, accounts, connectivity or subscriptions—creating a trust barrier. "
        "Oppuna demonstrates useful support that can remain privately on the phone.\n"
        "Do not invent personal hardship or mental-health conditions.\n"
        "Co-founder details remain placeholders until verified.\n\n"
        "SOURCES\n"
        "- Founder facts and narrative: founder brief, Aug 2026\n"
        "- Product execution evidence: live Android app on Google Play; website https://oppuna.com",
    )

    # ─── 14 Raise / close ───
    s = new_slide(prs, SAGE_DEEP)
    add_textbox(s, Inches(0.7), Inches(0.5), Inches(12), Inches(1.0), "Help us make private wellness support accessible at population scale.", font=FONT_DISPLAY, size=32, color=WHITE, bold=True)
    fields = [
        ("Raising", "[AMOUNT]"),
        ("Runway", "[NUMBER OF MONTHS]"),
        ("Next milestone", "[ACTIVE USERS / PREMIUM BETA / PILOTS]"),
    ]
    for i, (k, v) in enumerate(fields):
        left = Inches(0.7 + i * 4.1)
        add_round_rect(s, left, Inches(1.8), Inches(3.9), Inches(1.4), RGBColor(0x3A, 0x5F, 0x52))
        add_textbox(s, left + Inches(0.25), Inches(1.95), Inches(3.4), Inches(0.35), k, font=FONT_BODY, size=14, color=SAGE_SOFT)
        add_textbox(s, left + Inches(0.25), Inches(2.35), Inches(3.4), Inches(0.6), v, font=FONT_BODY, size=18, color=WHITE, bold=True)
    add_textbox(
        s,
        Inches(0.7),
        Inches(3.5),
        Inches(8.5),
        Inches(1.2),
        "Use of funds: product · local AI · safety · distribution · partnerships · operations",
        font=FONT_BODY,
        size=16,
        color=WHITE,
    )
    add_textbox(
        s,
        Inches(0.7),
        Inches(4.6),
        Inches(8.5),
        Inches(1.2),
        "Oppuna is building a future where receiving simple emotional-wellness support does not require surrendering privacy.",
        font=FONT_DISPLAY,
        size=18,
        color=SAGE_SOFT,
        bold=True,
    )
    add_textbox(s, Inches(0.7), Inches(6.1), Inches(8.5), Inches(0.7), "https://oppuna.com\nsupport@oppuna.com", font=FONT_BODY, size=16, color=WHITE)
    if qr.exists():
        s.shapes.add_picture(str(qr), Inches(10.7), Inches(4.9), Inches(1.8), Inches(1.8))
        add_textbox(s, Inches(10.5), Inches(6.75), Inches(2.2), Inches(0.35), "Google Play", font=FONT_BODY, size=12, color=SAGE_SOFT, align=PP_ALIGN.CENTER)
    add_notes(
        s,
        "SPEAKER (~45s)\n"
        "Close on the partnership ask. Leave placeholders visible until fundraising strategy is final—do not invent amount/valuation.\n"
        "CTA: schedule a fundraising or strategic-partnership conversation.\n"
        "End on the privacy line; no generic thank-you slide.\n\n"
        "SOURCES\n"
        "- Contact and product URLs: https://oppuna.com ; mailto:support@oppuna.com\n"
        "- Play QR target: https://play.google.com/store/apps/details?id=com.oppuna.care\n"
        "- Raise fields: placeholders pending final fundraising strategy.",
    )

    # ─── A1 Retention methodology ───
    s = new_slide(prs)
    title_block(s, "Appendix · Retention methodology", kicker="APPENDIX 01")
    bullet_block(
        s,
        Inches(0.7),
        Inches(2.0),
        Inches(12),
        Inches(4.5),
        [
            "Current claim: approximately 90% of early users returned during the current observation period.",
            "Population: founder-reported internal tracking across approximately 80–100 early users.",
            "Not yet defined as D7, D30, monthly retention, DAU/MAU, or paid retention.",
            "Before final investor distribution: publish cohort start date, observation window, return definition, and exclusion rules.",
            "Recommended upgrade: report D1/D7/D30 for a frozen install cohort with Play Console as source of truth.",
        ],
        size=17,
    )
    footer_meta(s, "A1")
    add_notes(
        s,
        "SPEAKER (optional)\n"
        "Use only if asked about retention quality.\n\n"
        "SOURCES\n"
        "- Founder-reported early-user tracking brief, Aug 2026\n"
        "- Future source of truth candidate: Google Play Console retention reports",
    )

    # ─── A2 Architecture ───
    s = new_slide(prs)
    title_block(s, "Appendix · Architecture and privacy controls", kicker="APPENDIX 02")
    bullet_block(
        s,
        Inches(0.7),
        Inches(2.0),
        Inches(12),
        Inches(4.5),
        [
            "Client: Android application with local storage for journals, moods, voice notes and conversations.",
            "Intelligence: on-device supportive companion with offline fallback guidance.",
            "Safety: deterministic crisis logic + local crisis-resource presentation (not an emergency service).",
            "Controls: local export and delete-all; optional biometric/device app lock where available.",
            "Non-claims: no asserted clinical validation, no claimed certifications, no selling of emotional data.",
        ],
        size=17,
    )
    footer_meta(s, "A2")
    add_notes(
        s,
        "SPEAKER (optional)\n"
        "Deep-dive for technical diligence.\n\n"
        "SOURCES\n"
        "- https://oppuna.com/privacy/\n"
        "- https://oppuna.com (architecture / offline claims)",
    )

    # ─── A3 Roadmap detail ───
    s = new_slide(prs)
    title_block(s, "Appendix · Free, Plus, enterprise and SDK roadmap", kicker="APPENDIX 03")
    cols = [
        ("Free", ["Companion basics", "Mood + journal", "Breath / ground / sleep", "Daily plan", "Crisis resources", "Export / delete"]),
        ("Oppuna Plus", ["Stronger on-device models", "Natural voice", "Deeper personalisation", "Longitudinal insights", "Guided journeys", "Encrypted backup*"]),
        ("Enterprise / CSR", ["Sponsored access", "Employer programs", "NGO / community rollout", "Public-wellness pilots", "No sale of user data", "Optional verified referrals**"]),
        ("SDK / platform", ["Privacy-first engine", "White-label path", "Partner integrations", "Local-model packaging", "Safety workflows", "Distribution leverage"]),
    ]
    for i, (h, items) in enumerate(cols):
        left = Inches(0.55 + i * 3.2)
        add_round_rect(s, left, Inches(1.9), Inches(3.05), Inches(4.5), SURFACE if i % 2 == 0 else SAGE_SOFT)
        add_textbox(s, left + Inches(0.15), Inches(2.05), Inches(2.75), Inches(0.45), h, font=FONT_BODY, size=16, color=SAGE_DEEP, bold=True)
        bullet_block(s, left + Inches(0.1), Inches(2.55), Inches(2.85), Inches(3.6), items, size=13)
    add_textbox(
        s,
        Inches(0.7),
        Inches(6.5),
        Inches(12),
        Inches(0.4),
        "* User-controlled  ** Future, consent-based — not currently claimed as shipped",
        font=FONT_BODY,
        size=12,
        color=MUTED,
    )
    footer_meta(s, "A3")
    add_notes(
        s,
        "SPEAKER (optional)\n"
        "Detail for product / partnership diligence. Keep premium and institutional paths clearly non-exploitative of user data.\n\n"
        "SOURCES\n"
        "- Roadmap items: founder strategy brief, Aug 2026\n"
        "- Shipped free capabilities: https://oppuna.com",
    )

    out = ROOT / "Oppuna-Investor-Pitch-Deck.pptx"
    prs.save(str(out))
    print(f"Wrote {out}")
    return out


if __name__ == "__main__":
    build()
