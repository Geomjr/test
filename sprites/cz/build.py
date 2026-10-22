"""Build the CZ sprite PNGs from the ASCII art in cz_art.py.

Usage: python3 build.py [output_dir]   (default: this folder)
"""
import os
import sys

from PIL import Image

import cz_art as art
from render import mirror, patch, rim, to_image

HERE = os.path.dirname(os.path.abspath(__file__))


def front_rows():
    rows = mirror(art.FRONT_LEFT, 64)
    rows = patch(rows, [(art.FRONT_HAIR_X, y, r) for y, r in enumerate(art.FRONT_HAIR)])
    return rim(rows)


def back_rows():
    left = list(art.BACK_LEFT)
    for i, logo in enumerate(art.BACK_LOGO_LEFT):
        y = art.BACK_LOGO_TOP + i
        row = left[y].rjust(32, ".")
        left[y] = row[:32 - len(logo)] + "".join(
            c if c != "." else row[32 - len(logo) + j] for j, c in enumerate(logo))
    rows = patch(mirror(left, 64), art.BACK_PATCHES)
    return rim(rows)


def overworld_frames():
    """Return {name: 16x32 image} for the walk cycle in all four directions."""
    frames = {}
    down = patch(mirror(art.OW_DOWN_LEFT, 16), art.OW_DOWN_PATCHES)
    up = patch(mirror(art.OW_UP_LEFT, 16), art.OW_UP_PATCHES)
    for facing, body in (("down", down), ("up", up)):
        for i, legs in enumerate(art.OW_LEGS_FRONT):
            frames[f"walk_{facing}_{i}"] = to_image(body + legs, 16, 32)
    for i, legs in enumerate(art.OW_LEGS_SIDE):
        img = to_image(art.OW_LEFT + legs, 16, 32)
        frames[f"walk_left_{i}"] = img
        frames[f"walk_right_{i}"] = img.transpose(Image.FLIP_LEFT_RIGHT)
    return frames


def main(out_dir=HERE):
    os.makedirs(out_dir, exist_ok=True)
    front = to_image(front_rows(), 64, 64)
    back = to_image(back_rows(), 64, 64)
    front.save(os.path.join(out_dir, "cz_battle_front.png"))
    back.save(os.path.join(out_dir, "cz_battle_back.png"))

    frames = overworld_frames()
    frame_dir = os.path.join(out_dir, "overworld")
    os.makedirs(frame_dir, exist_ok=True)
    for name, img in frames.items():
        img.save(os.path.join(frame_dir, f"cz_{name}.png"))

    # Overworld sheet: rows down / up / left / right, columns stand, step, step.
    sheet = Image.new("RGBA", (16 * 3, 32 * 4), (0, 0, 0, 0))
    for r, facing in enumerate(("down", "up", "left", "right")):
        for c in range(3):
            sheet.paste(frames[f"walk_{facing}_{c}"], (16 * c, 32 * r))
    sheet.save(os.path.join(out_dir, "cz_overworld_sheet.png"))

    # Preview: everything on one card, scaled 4x, plus an animated walk cycle.
    bg = (120, 200, 170, 255)
    card = Image.new("RGBA", (64 * 2 + 16 * 12 + 40, 72), bg)
    card.alpha_composite(front, (4, 4))
    card.alpha_composite(back, (72, 4))
    for i, facing in enumerate(("down", "up", "left", "right")):
        for c in range(3):
            card.alpha_composite(frames[f"walk_{facing}_{c}"],
                                 (144 + (i * 3 + c) * 16 + i * 6, 36))
    card.resize((card.width * 4, card.height * 4), Image.NEAREST).save(
        os.path.join(out_dir, "preview.png"))
    walk = []
    for facing in ("down", "left", "up", "right"):
        for c in (1, 0, 2, 0) * 2:
            f = Image.new("RGBA", (16, 32), bg)
            f.alpha_composite(frames[f"walk_{facing}_{c}"])
            walk.append(f.resize((96, 192), Image.NEAREST).convert("P"))
    walk[0].save(os.path.join(out_dir, "preview_walk.gif"), save_all=True,
                 append_images=walk[1:], duration=140, loop=0)
    print(f"wrote sprites to {out_dir}")


if __name__ == "__main__":
    main(*sys.argv[1:])
