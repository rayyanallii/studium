"""Turn the uploaded Studium logo into web-ready brand assets.

The artwork is flat, opaque and sits on a white canvas, and its "paper" areas
are the same white as that canvas — keying the white out would punch holes in
the book pages. So the mark is cropped to its artwork and kept on a white tile,
which `BrandMark` renders as a rounded app-icon square for both themes.

    python scripts/make-brand-assets.py

Outputs into public/brand/: studium-mark.png (512), studium-mark-192.png and
studium-mark-64.png for the favicon and touch icon.
"""

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "Studium Logo.png"
OUT = ROOT / "public" / "brand"


def main() -> None:
    image = Image.open(SOURCE).convert("RGB")

    # The source has wide white margins and a soft shadow. A threshold well below
    # white finds the actual artwork, so the mark fills its icon tile instead of
    # shrinking inside the original canvas.
    mask = image.convert("L").point(lambda value: 255 if value < 200 else 0)
    box = mask.getbbox()
    if not box:
        raise SystemExit("No artwork found in the source image.")
    image = image.crop(box)

    longest = max(image.size)
    pad = round(longest * 0.015)
    canvas = Image.new("RGB", (longest + pad * 2, longest + pad * 2), "white")
    canvas.paste(image, ((canvas.width - image.width) // 2, (canvas.height - image.height) // 2))

    OUT.mkdir(parents=True, exist_ok=True)
    for name, size in (("studium-mark.png", 512), ("studium-mark-192.png", 192), ("studium-mark-64.png", 64)):
        canvas.resize((size, size), Image.LANCZOS).save(OUT / name, optimize=True)
        print(f"wrote public/brand/{name} ({size}x{size})")


if __name__ == "__main__":
    main()
