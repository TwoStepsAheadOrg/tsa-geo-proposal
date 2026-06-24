#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path("/Users/null/Documents/tsa-geo-proposal")
ASSET_DIR = ROOT / "assets/content/instatoon"
FONT_BOLD = Path("/Users/null/Library/Fonts/Pretendard-Bold.otf")
FONT_SEMIBOLD = Path("/Users/null/Library/Fonts/Pretendard-SemiBold.otf")


def font(size: int, *, semibold: bool = False) -> ImageFont.FreeTypeFont:
    path = FONT_SEMIBOLD if semibold else FONT_BOLD
    return ImageFont.truetype(str(path), size=size)


def text_box(draw: ImageDraw.ImageDraw, lines: list[str], max_width: int, max_height: int, start_size: int, *, min_size: int = 24) -> tuple[ImageFont.FreeTypeFont, int, int]:
    size = start_size
    while size >= min_size:
        fnt = font(size)
        line_gap = int(size * 0.18)
        bboxes = [draw.textbbox((0, 0), line, font=fnt, stroke_width=0) for line in lines]
        widths = [bbox[2] - bbox[0] for bbox in bboxes]
        heights = [bbox[3] - bbox[1] for bbox in bboxes]
        total_height = sum(heights) + line_gap * (len(lines) - 1)
        if max(widths) <= max_width and total_height <= max_height:
            return fnt, line_gap, total_height
        size -= 2
    fnt = font(min_size)
    return fnt, int(min_size * 0.18), max_height


def draw_label(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], lines: list[str], size: int, *, fill=(15, 21, 30), stroke_width: int = 0) -> None:
    x1, y1, x2, y2 = box
    pad_x = int((x2 - x1) * 0.13)
    pad_y = int((y2 - y1) * 0.18)
    fnt, line_gap, total_height = text_box(draw, lines, (x2 - x1) - pad_x * 2, (y2 - y1) - pad_y * 2, size)
    y = y1 + ((y2 - y1) - total_height) / 2 - int(size * 0.03)
    for line in lines:
        bbox = draw.textbbox((0, 0), line, font=fnt, stroke_width=stroke_width)
        width = bbox[2] - bbox[0]
        height = bbox[3] - bbox[1]
        x = x1 + ((x2 - x1) - width) / 2
        draw.text((x, y), line, font=fnt, fill=fill, stroke_width=stroke_width, stroke_fill="white")
        y += height + line_gap


def ellipse(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], lines: list[str], size: int) -> None:
    box = (box[0] - 14, box[1] - 14, box[2] + 14, box[3] + 14)
    draw.ellipse(box, fill=(255, 255, 255), outline=(28, 28, 28), width=4)
    draw_label(draw, box, lines, size)


def rounded(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], lines: list[str], size: int) -> None:
    box = (box[0] - 18, box[1] - 26, box[2] + 18, box[3] + 18)
    draw.rounded_rectangle(box, radius=28, fill=(255, 255, 255), outline=(28, 28, 28), width=4)
    inner = (box[0] + 10, box[1] + 10, box[2] - 10, box[3] - 10)
    draw.rounded_rectangle(inner, radius=22, outline=(218, 218, 218), width=2)
    draw_label(draw, box, lines, size)


def save(path: Path, bubbles: list[tuple[str, tuple[int, int, int, int], list[str], int]]) -> None:
    image = Image.open(path).convert("RGB")
    draw = ImageDraw.Draw(image)
    for kind, box, lines, size in bubbles:
        if kind == "ellipse":
            ellipse(draw, box, lines, size)
        elif kind == "rounded":
            rounded(draw, box, lines, size)
        else:
            raise ValueError(kind)
    image.save(path, optimize=True, quality=95)


def main() -> None:
    save(
        ASSET_DIR / "sample-clinic-care.png",
        [
            ("ellipse", (118, 68, 500, 292), ["검사 전", "괜찮을까?"], 42),
            ("ellipse", (560, 54, 930, 262), ["쉽게", "설명해요"], 42),
            ("ellipse", (365, 850, 742, 1054), ["저장하고", "다시 봐요"], 40),
            ("rounded", (205, 1088, 875, 1298), ["상담 전", "불안을 낮춥니다"], 38),
        ],
    )
    save(
        ASSET_DIR / "sample-vet-care.png",
        [
            ("ellipse", (82, 78, 508, 302), ["밥을", "안 먹어요"], 40),
            ("ellipse", (650, 100, 1050, 318), ["응급일까요?"], 40),
            ("ellipse", (480, 590, 680, 724), ["체크", "기준"], 24),
            ("rounded", (82, 1086, 998, 1290), ["보호자가 먼저 찾는", "기준을 보여줍니다"], 36),
        ],
    )
    save(
        ASSET_DIR / "sample-restaurant-story.png",
        [
            ("ellipse", (22, 38, 420, 280), ["오늘", "어디 갈까?"], 40),
            ("ellipse", (690, 42, 1070, 280), ["왜", "유명하지?"], 40),
            ("rounded", (58, 1068, 650, 1278), ["메뉴 사진을", "방문 이유로"], 40),
        ],
    )
    save(
        ASSET_DIR / "sample-professional-trust.png",
        [
            ("ellipse", (58, 104, 320, 295), ["계약서가", "불안해요"], 31),
            ("ellipse", (434, 48, 875, 318), ["핵심만", "정리해요"], 42),
            ("ellipse", (655, 770, 1070, 1045), ["상담 전에", "먼저 이해"], 36),
            ("rounded", (112, 1088, 970, 1298), ["어려운 상담을", "사례로 낮춥니다"], 36),
        ],
    )
    save(
        ASSET_DIR / "sample-education-parent.png",
        [
            ("ellipse", (82, 92, 500, 335), ["우리 아이", "괜찮을까요?"], 39),
            ("ellipse", (636, 88, 1025, 340), ["수준부터", "맞춰봐요"], 39),
            ("rounded", (120, 1088, 960, 1298), ["학부모 고민을", "장면으로 보여줍니다"], 36),
        ],
    )


if __name__ == "__main__":
    main()
