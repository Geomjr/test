"""Turn the ASCII art in cz_art.py into PNG sprites."""
from PIL import Image

from cz_art import PALETTE


def mirror(left_rows, width):
    """Build full rows from left halves that end at the center line."""
    half = width // 2
    rows = []
    for r in left_rows:
        r = r.rjust(half, ".")
        rows.append(r + r[::-1])
    return rows


def patch(rows, patches):
    """Overlay (x, y, text) patches; '.' in text leaves the pixel alone."""
    rows = [list(r) for r in rows]
    for x, y, text in patches:
        for i, ch in enumerate(text):
            if ch != "." and 0 <= x + i < len(rows[y]):
                rows[y][x + i] = ch
    return ["".join(r) for r in rows]


def to_image(rows, width, height):
    img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    px = img.load()
    top = height - len(rows) if len(rows) < height else 0
    for y, row in enumerate(rows[:height]):
        for x, ch in enumerate(row[:width]):
            px[x, y + top] = PALETTE[ch]
    return img


SHADE = {"J": "k", "P": "p", "S": "s"}
LIGHT = {"J": "j"}
EDGE = set("K.")


def rim(rows, width=2):
    """Light from the left: rim-light left edges, shade the right edges."""
    out = [list(r) for r in rows]
    for y, row in enumerate(rows):
        for x, c in enumerate(row):
            right = row[x + 1:x + 1 + width]
            if c in SHADE and any(ch in EDGE for ch in right[:width if c != "S" else 1]) \
                    or c in SHADE and x + 1 >= len(row):
                out[y][x] = SHADE[c]
            elif c in LIGHT and x > 0 and row[x - 1] in EDGE:
                out[y][x] = LIGHT[c]
    return ["".join(r) for r in out]
