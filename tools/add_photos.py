#!/usr/bin/env python3
"""새 사진 앨범을 사이트에 추가합니다.

사용법 (저장소 맨 위 폴더에서):
    python3 tools/add_photos.py <사진폴더> --date "2026. 09. 12" --title "앨범 제목" [--title-en "English title"]

하는 일
  1. 폴더 안의 사진(jpg/png/webp)을 이름순으로 읽어 1600px WebP와 560px 썸네일로 변환
     → assets/img/photos/<앨범id>/01.webp, 01-t.webp ...
  2. _data/photos.yml 맨 위에 앨범 항목을 추가 (사진 페이지 맨 위에 표시됨)

필요한 것: Python 3, Pillow  (pip install pillow)
아이폰 HEIC 사진은 먼저 JPG로 내보내거나 pillow-heif 를 설치해 주세요.
"""
import argparse
import json
import os
import re
import sys

try:
    from PIL import Image, ImageOps
except ImportError:
    sys.exit("Pillow가 필요합니다:  pip install pillow")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "_data", "photos.yml")
IMG_DIR = os.path.join(ROOT, "assets", "img", "photos")
EXTS = (".jpg", ".jpeg", ".png", ".webp", ".heic")


def next_id(year):
    text = open(DATA, encoding="utf-8").read()
    nums = [int(n) for n in re.findall(r"^- id: \d{4}-(\d+)\s*$", text, re.M)]
    return f"{year}-{(max(nums) + 1) if nums else 1}"


def convert(src, dst_full, dst_thumb):
    im = Image.open(src)
    im = ImageOps.exif_transpose(im).convert("RGB")
    full = im.copy()
    full.thumbnail((1600, 1600), Image.LANCZOS)
    full.save(dst_full, "WEBP", quality=82, method=6)
    w = 560
    thumb = im.resize((w, max(1, round(im.height * w / im.width))), Image.LANCZOS)
    thumb.save(dst_thumb, "WEBP", quality=78, method=6)


def main():
    ap = argparse.ArgumentParser(description="사진 앨범 추가")
    ap.add_argument("folder", help="사진이 들어 있는 폴더")
    ap.add_argument("--date", required=True, help='예: "2026. 09. 12" 또는 "2026. 09. 12–14"')
    ap.add_argument("--title", required=True, help="앨범 제목 (한국어)")
    ap.add_argument("--title-en", default="", help="영문 부제 (선택)")
    a = ap.parse_args()

    m = re.match(r"\s*(\d{4})", a.date)
    if not m:
        sys.exit('날짜는 "2026. 09. 12" 처럼 연도로 시작해야 합니다.')
    year = int(m.group(1))

    files = sorted(f for f in os.listdir(a.folder) if f.lower().endswith(EXTS))
    if not files:
        sys.exit("폴더에 사진이 없습니다.")

    album = next_id(year)
    out = os.path.join(IMG_DIR, album)
    os.makedirs(out, exist_ok=True)
    paths = []
    for i, f in enumerate(files, 1):
        name = f"{i:02d}"
        convert(os.path.join(a.folder, f), os.path.join(out, name + ".webp"), os.path.join(out, name + "-t.webp"))
        paths.append(f"/assets/img/photos/{album}/{name}.webp")
        print(f"  {f}  →  {name}.webp")

    entry = [f"- id: {album}", f"  year: {year}", f"  date: {json.dumps(a.date, ensure_ascii=False)}",
             f"  title: {json.dumps(a.title, ensure_ascii=False)}"]
    if a.title_en:
        entry.append(f"  title_en: {json.dumps(a.title_en, ensure_ascii=False)}")
    entry.append("  photos:")
    entry += [f"  - {p}" for p in paths]

    old = open(DATA, encoding="utf-8").read()
    with open(DATA, "w", encoding="utf-8") as fh:
        fh.write("\n".join(entry) + "\n" + old)
    print(f"\n앨범 '{a.title}' ({len(paths)}장)을 추가했습니다 → _data/photos.yml 맨 위, assets/img/photos/{album}/")


if __name__ == "__main__":
    main()
