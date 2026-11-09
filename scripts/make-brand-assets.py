"""Turn the uploaded Studium logo into web-ready brand assets.

The artwork already ships with a transparent canvas, but its hidden pixels store
black RGB values. Flattening or re-keying by colour resurrects that canvas as a
dark tile and can eat the white book pages that touch it, so the alpha channel is
the only source of truth here: trim to it, soften stray edge pixels, and resize.
The mark then sits directly on the app surface in both themes.

    python scripts/make-brand-assets.py

Outputs into public/brand/:
    studium-mark.png      512px transparent mark
    studium-mark-64.png    64px transparent mark (manifest)
    studium-touch.png     180px mark on white (iOS icons need an opaque canvas)
"""

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "Studium Logo.png"
OUT = ROOT / "public" / "brand"
EDGE_CUTOFF = 8


def remove_background(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    rgba.putalpha(rgba.getchannel("A").point(lambda value: 0 if value < EDGE_CUTOFF else value))
    return rgba


def main() -> None:
    image = remove_background(Image.open(SOURCE))

    box = image.getbbox()
    if not box:
        raise SystemExit("No artwork found in the source image.")
    image = image.crop(box)

    longest = max(image.size)
    pad = round(longest * 0.04)
    canvas = Image.new("RGBA", (longest + pad * 2, longest + pad * 2), (0, 0, 0, 0))
    canvas.paste(image, ((canvas.width - image.width) // 2, (canvas.height - image.height) // 2), image)

    OUT.mkdir(parents=True, exist_ok=True)
    for name, size in (("studium-mark.png", 512), ("studium-mark-64.png", 64)):
        canvas.resize((size, size), Image.LANCZOS).save(OUT / name, optimize=True)
        print(f"wrote public/brand/{name} ({size}x{size}, transparent)")

    touch = Image.new("RGB", (180, 180), "white")
    mark = canvas.resize((150, 150), Image.LANCZOS)
    touch.paste(mark, (15, 15), mark)
    touch.save(OUT / "studium-touch.png", optimize=True)
    print("wrote public/brand/studium-touch.png (180x180, white)")


if __name__ == "__main__":
    main()
