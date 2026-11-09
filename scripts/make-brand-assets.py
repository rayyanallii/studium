"""Turn the uploaded Studium logo into web-ready brand assets.

The artwork is flat and opaque on a white canvas. Keying *all* white pixels out
would punch holes in the book pages, so only the white region connected to the
image border is made transparent (a flood fill). The interior page white and the
soft shadow stay intact, which lets the mark sit directly on the dark app surface
without a white sticker behind it.

    python scripts/make-brand-assets.py

Outputs into public/brand/:
    studium-mark.png      512px transparent mark
    studium-mark-64.png    64px transparent mark (manifest)
    studium-touch.png     180px mark on white (iOS icons need an opaque canvas)
"""

from collections import deque
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "Studium Logo.png"
OUT = ROOT / "public" / "brand"
WHITE_CUTOFF = 232


def remove_background(image: Image.Image) -> Image.Image:
    rgb = image.convert("RGB")
    width, height = rgb.size
    pixels = rgb.load()
    outside = bytearray(width * height)
    queue: deque[tuple[int, int]] = deque()

    def is_background(x: int, y: int) -> bool:
        red, green, blue = pixels[x, y]
        return red >= WHITE_CUTOFF and green >= WHITE_CUTOFF and blue >= WHITE_CUTOFF

    def push(x: int, y: int) -> None:
        if 0 <= x < width and 0 <= y < height and not outside[y * width + x] and is_background(x, y):
            outside[y * width + x] = 1
            queue.append((x, y))

    for x in range(width):
        push(x, 0)
        push(x, height - 1)
    for y in range(height):
        push(0, y)
        push(width - 1, y)

    while queue:
        x, y = queue.popleft()
        push(x + 1, y)
        push(x - 1, y)
        push(x, y + 1)
        push(x, y - 1)

    result = rgb.convert("RGBA")
    alpha = result.load()
    for index, flag in enumerate(outside):
        if flag:
            alpha[index % width, index // width] = (0, 0, 0, 0)
    return result


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
