from pathlib import Path
from math import sin, cos, pi

from PIL import Image, ImageDraw, ImageFont, ImageFilter
from reportlab.lib.colors import HexColor, white
from reportlab.lib.pagesizes import landscape
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas


OUT_DIR = Path.cwd() / "tmp" / "blingkitchen-card-native-build"
OUT_DIR.mkdir(parents=True, exist_ok=True)

PDF_PATH = OUT_DIR / "BlingKitchen-business-card-native-print-build.pdf"
FRONT_PREVIEW = OUT_DIR / "front-preview.png"
BACK_PREVIEW = OUT_DIR / "back-preview.png"

W_IN, H_IN = 3.5, 2.0
W_PT, H_PT = W_IN * inch, H_IN * inch
SAFE = 0.20 * inch

PURPLE = "#3E2B56"
PURPLE_DARK = "#23142F"
PURPLE_MID = "#4D3470"
SILVER = "#C0C0C0"
SOFT_WHITE = "#F7F2F7"
CHARCOAL = "#333333"


def register_fonts():
    fonts = {
        "Georgia": r"C:\Windows\Fonts\georgia.ttf",
        "Georgia-Bold": r"C:\Windows\Fonts\georgiab.ttf",
        "Arial": r"C:\Windows\Fonts\arial.ttf",
        "Arial-Bold": r"C:\Windows\Fonts\arialbd.ttf",
    }
    for name, path in fonts.items():
        if Path(path).exists():
            pdfmetrics.registerFont(TTFont(name, path))


def interp(a, b, t):
    return int(a + (b - a) * t)


def hex_to_rgb(hex_value):
    hex_value = hex_value.lstrip("#")
    return tuple(int(hex_value[i : i + 2], 16) for i in (0, 2, 4))


def make_background(width, height):
    dark = hex_to_rgb(PURPLE_DARK)
    mid = hex_to_rgb(PURPLE_MID)
    base = hex_to_rgb(PURPLE)
    img = Image.new("RGB", (width, height), base)
    px = img.load()
    cx, cy = int(width * 0.52), int(height * 0.44)
    max_d = (width * width + height * height) ** 0.5
    for y in range(height):
        for x in range(width):
            d = ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5 / max_d
            sweep = (x / width) * 0.25 + (y / height) * 0.15
            t = min(1, max(0, d * 1.75 + sweep))
            r = interp(mid[0], dark[0], t)
            g = interp(mid[1], dark[1], t)
            b = interp(mid[2], dark[2], t)
            px[x, y] = (r, g, b)

    glow = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse(
        (int(width * 0.08), int(height * 0.02), int(width * 0.48), int(height * 0.75)),
        fill=(192, 192, 192, 22),
    )
    gd.ellipse(
        (int(width * 0.60), int(height * 0.20), int(width * 1.08), int(height * 1.10)),
        fill=(255, 255, 255, 14),
    )
    glow = glow.filter(ImageFilter.GaussianBlur(radius=50))
    return Image.alpha_composite(img.convert("RGBA"), glow)


def add_star(draw, x, y, r, color):
    for angle in (0, pi / 2):
        x1 = x + cos(angle) * r
        y1 = y + sin(angle) * r
        x2 = x - cos(angle) * r
        y2 = y - sin(angle) * r
        draw.line((x1, y1, x2, y2), fill=color, width=max(1, int(r / 5)))
    draw.ellipse((x - r * 0.13, y - r * 0.13, x + r * 0.13, y + r * 0.13), fill=color)


def font(name, size):
    candidates = {
        "serif": [r"C:\Windows\Fonts\georgiab.ttf", r"C:\Windows\Fonts\georgia.ttf"],
        "sans": [r"C:\Windows\Fonts\arial.ttf"],
        "sans-bold": [r"C:\Windows\Fonts\arialbd.ttf", r"C:\Windows\Fonts\arial.ttf"],
    }[name]
    for candidate in candidates:
        if Path(candidate).exists():
            return ImageFont.truetype(candidate, size)
    return ImageFont.load_default()


def centered_text(draw, xy, text, fnt, fill, spacing=0):
    x, y, w = xy
    if spacing:
        total = sum(draw.textlength(ch, font=fnt) for ch in text) + spacing * (len(text) - 1)
        cx = x + (w - total) / 2
        for ch in text:
            draw.text((cx, y), ch, font=fnt, fill=fill)
            cx += draw.textlength(ch, font=fnt) + spacing
    else:
        tw = draw.textlength(text, font=fnt)
        draw.text((x + (w - tw) / 2, y), text, font=fnt, fill=fill)


def draw_front_png(path):
    scale = 300
    w, h = int(W_IN * scale), int(H_IN * scale)
    img = make_background(w, h)
    d = ImageDraw.Draw(img)
    sw = scale / 72
    add_star(d, int(w * 0.16), int(h * 0.23), int(5 * sw), (245, 240, 245, 130))
    add_star(d, int(w * 0.81), int(h * 0.78), int(4 * sw), (220, 215, 225, 90))

    logo = font("serif", int(23 * sw))
    sub = font("sans-bold", int(7.5 * sw))
    tag = font("sans", int(6.7 * sw))
    centered_text(d, (0, int(h * 0.39), w), "BlingKitchen", logo, SOFT_WHITE)
    centered_text(d, (0, int(h * 0.56), w), "WITH HEATHER", sub, SOFT_WHITE, spacing=int(2.1 * sw))
    line_w = int(w * 0.16)
    y = int(h * 0.68)
    d.line((w // 2 - line_w // 2, y, w // 2 + line_w // 2, y), fill=(192, 192, 192, 175), width=1)
    centered_text(d, (0, int(h * 0.75), w), "SERVING SPARKLE FROM THE", tag, SOFT_WHITE, spacing=int(1.5 * sw))
    centered_text(d, (0, int(h * 0.85), w), "HEART OF THE HOME", tag, SOFT_WHITE, spacing=int(1.5 * sw))
    img.save(path)


def draw_back_png(path):
    scale = 300
    w, h = int(W_IN * scale), int(H_IN * scale)
    img = make_background(w, h)
    d = ImageDraw.Draw(img)
    sw = scale / 72
    name = font("serif", int(12.5 * sw))
    body = font("sans-bold", int(7.4 * sw))
    small = font("sans", int(6.6 * sw))
    left = int(0.30 * scale)
    d.text((left, int(0.23 * scale)), "Heather Daugherty", font=name, fill=SOFT_WHITE)
    d.line((left, int(0.50 * scale), int(1.86 * scale), int(0.50 * scale)), fill=(192, 192, 192, 160), width=1)
    rows = [
        "theblingkitchen.com",
        "blingkitchen19@gmail.com",
        "@blingkitchen",
    ]
    y = int(0.72 * scale)
    for text in rows:
        d.text((left, y), text, font=body, fill=SOFT_WHITE)
        y += int(0.28 * scale)

    qr_x, qr_y, qr_s = int(2.35 * scale), int(0.31 * scale), int(0.72 * scale)
    d.rounded_rectangle((qr_x, qr_y, qr_x + qr_s, qr_y + qr_s), radius=int(0.025 * scale), fill="white")
    d.rectangle((qr_x + int(0.09 * scale), qr_y + int(0.09 * scale), qr_x + qr_s - int(0.09 * scale), qr_y + qr_s - int(0.09 * scale)), outline=CHARCOAL, width=2)
    centered_text(d, (qr_x, qr_y + int(0.31 * scale), qr_s), "PLACE", font("sans-bold", int(6.4 * sw)), CHARCOAL)
    centered_text(d, (qr_x, qr_y + int(0.42 * scale), qr_s), "QR HERE", font("sans-bold", int(6.4 * sw)), CHARCOAL)

    box = (int(0.30 * scale), int(1.57 * scale), int(3.20 * scale), int(1.86 * scale))
    d.rounded_rectangle(box, radius=int(0.035 * scale), fill=(247, 242, 247, 255))
    d.text((box[0] + int(0.09 * scale), box[1] + int(0.08 * scale)), "DISCOUNT CODE:", font=small, fill=CHARCOAL)
    d.line((box[0] + int(1.05 * scale), box[1] + int(0.17 * scale), box[2] - int(0.10 * scale), box[1] + int(0.17 * scale)), fill=(90, 90, 90), width=1)
    img.save(path)


def draw_pdf():
    register_fonts()
    c = canvas.Canvas(str(PDF_PATH), pagesize=(W_PT, H_PT))

    def bg():
        c.setFillColor(HexColor(PURPLE_DARK))
        c.rect(0, 0, W_PT, H_PT, stroke=0, fill=1)
        c.setFillColor(HexColor(PURPLE))
        c.circle(W_PT * 0.42, H_PT * 0.56, W_PT * 0.60, stroke=0, fill=1)
        c.setFillColor(HexColor(PURPLE_MID))
        c.circle(W_PT * 0.18, H_PT * 0.82, W_PT * 0.25, stroke=0, fill=1)

    # Front
    bg()
    c.setFillColor(white)
    c.setFont("Georgia-Bold", 23)
    c.drawCentredString(W_PT / 2, H_PT * 0.49, "BlingKitchen")
    c.setFont("Arial-Bold", 7.5)
    c.drawCentredString(W_PT / 2, H_PT * 0.34, "W I T H   H E A T H E R")
    c.setStrokeColor(HexColor(SILVER))
    c.setLineWidth(0.7)
    c.line(W_PT * 0.42, H_PT * 0.25, W_PT * 0.58, H_PT * 0.25)
    c.setFont("Arial", 6.7)
    c.drawCentredString(W_PT / 2, H_PT * 0.16, "S E R V I N G   S P A R K L E   F R O M   T H E")
    c.drawCentredString(W_PT / 2, H_PT * 0.08, "H E A R T   O F   T H E   H O M E")
    c.showPage()

    # Back
    bg()
    c.setFillColor(white)
    c.setFont("Georgia-Bold", 12.5)
    c.drawString(SAFE, H_PT - SAFE - 9, "Heather Daugherty")
    c.setStrokeColor(HexColor(SILVER))
    c.setLineWidth(0.6)
    c.line(SAFE, H_PT - SAFE - 19, W_PT * 0.56, H_PT - SAFE - 19)
    c.setFont("Arial-Bold", 7.4)
    rows = [
        ("theblingkitchen.com", H_PT - SAFE - 45),
        ("blingkitchen19@gmail.com", H_PT - SAFE - 67),
        ("@blingkitchen", H_PT - SAFE - 89),
    ]
    for text, y in rows:
        c.drawString(SAFE, y, text)

    qr_x, qr_y, qr_s = W_PT - SAFE - 0.72 * inch, H_PT - SAFE - 0.72 * inch, 0.72 * inch
    c.setFillColor(white)
    c.roundRect(qr_x, qr_y, qr_s, qr_s, 2, stroke=0, fill=1)
    c.setFillColor(HexColor(CHARCOAL))
    c.setFont("Arial-Bold", 6.4)
    c.drawCentredString(qr_x + qr_s / 2, qr_y + qr_s * 0.53, "PLACE")
    c.drawCentredString(qr_x + qr_s / 2, qr_y + qr_s * 0.39, "QR HERE")

    box_x, box_y, box_w, box_h = SAFE, SAFE - 2, W_PT - SAFE * 2, 0.28 * inch
    c.setFillColor(HexColor(SOFT_WHITE))
    c.roundRect(box_x, box_y, box_w, box_h, 2.5, stroke=0, fill=1)
    c.setFillColor(HexColor(CHARCOAL))
    c.setFont("Arial", 7.4)
    c.drawString(box_x + 7, box_y + 7, "DISCOUNT CODE:")
    c.setStrokeColor(HexColor("#555555"))
    c.line(box_x + 75, box_y + 9.5, box_x + box_w - 8, box_y + 9.5)
    c.save()


if __name__ == "__main__":
    draw_front_png(FRONT_PREVIEW)
    draw_back_png(BACK_PREVIEW)
    draw_pdf()
    print(PDF_PATH)
    print(FRONT_PREVIEW)
    print(BACK_PREVIEW)
