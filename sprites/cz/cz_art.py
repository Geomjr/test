"""Hand-drawn pixel art for the CZ player character.

Every sprite is an ASCII grid; each character is one pixel looked up in
PALETTE ('.' is transparent). Symmetric sprites are drawn as their left half
only (each row ends at the center line) and mirrored, then PATCHES add the
asymmetric details (hair part, smile, light and shade).
"""

# 15 colors + transparency, so every sprite fits a GBA 16-color palette.
PALETTE = {
    ".": (0, 0, 0, 0),
    "K": (16, 16, 22, 255),     # outline
    "H": (34, 34, 44, 255),     # hair
    "h": (78, 80, 100, 255),    # hair shine
    "S": (250, 214, 176, 255),  # skin
    "s": (222, 170, 128, 255),  # skin shade
    "t": (150, 92, 70, 255),    # skin dark (mouth, nostrils)
    "e": (40, 30, 34, 255),     # eyes / brows
    "J": (44, 46, 56, 255),     # hoodie
    "j": (84, 88, 104, 255),    # hoodie light
    "k": (26, 27, 34, 255),     # hoodie shade
    "G": (240, 185, 11, 255),   # Binance gold
    "g": (255, 226, 110, 255),  # gold light
    "P": (66, 70, 86, 255),     # trousers
    "p": (44, 47, 60, 255),     # trousers shade
    "W": (246, 246, 250, 255),  # white (tee, sneakers)
}

# --------------------------------------------------------------------------
# Battle front sprite, 64x64.
# --------------------------------------------------------------------------
# Hair: full-width rows (asymmetric side part), starting at column 18.
FRONT_HAIR = [
    ".........KKKKKKKKKK.........",
    "......KKKHHHHHHHHHHKKK......",
    ".....KHHHHhhHHHHHHHHHHK.....",
    "....KHHHhhhHHHHHHHHHHHHK....",
    "...KHHHhhhHHHHHHHHHhhHHHK...",
    "...KHHhhHHKHHHHHHHHHhhHHK...",
    "..KHHHHHHKSKHHHHHHHHHHHHHK..",
    "..KHHHHHKSSSKHHHHhhHHHHHHK..",
    "..KHHHHKSSSSSKKHHHHhhHHHHK..",
    "..KHHHKSSSSSSSSKKHHHHHHHHK..",
    "..KHHHSSSSSSSSSSSKKHHHHHHK..",
]
FRONT_HAIR_X = 18

# Everything else: left halves, right-aligned to the center line (col 31).
FRONT_LEFT = [""] * 11 + [
    "..KHSSSeeeeSSS",
    ".KsHSSSSSSSSSS",
    ".KssSSSeeeeSSS",
    ".KssSSSWKKsSSS",
    "..KsSSSSSSSSSS",
    "..KSSSSSSSSSSS",
    "...KSSSSSSStSS",
    "...KSSSSSSSStt",
    "....KsSSSSSSSS",
    ".....KKsSSSSSS",
    ".......KKKssss",
    "KKkkKsss",
    "KKKKKKKkjjkKss",
    "KJJJJJJJkjjkKs",
    "KjJJJJJJJJkjjkKW",
    "KjJJJJJJJJJJkkkkK",
    "KjJJKJJJJJJJJJGJJ",
    "KjJJKJJJJJJJJJGJJ",
    "KjJJKJJJJJJJJJgJJ",
    "KjJJKJJJJJJJJJJJG",
    "KjJJKJJJJJJJJJJGJ",
    "KjJJKJJJJJJJJJGJG",
    "KjJJKJJJJJJJJGJGg",
    "KjJJKJJJJJJJJGJGg",
    "KjJJKJJJJJJJJJGJG",
    "KjJJKJJJJJJJJJJGJ",
    "KjJJKJJJJJJJJJJJG",
    "KjJJKJJKKKKKKKKKK",
    "KjJJKJKJJJJJJJJJJ",
    "KjJJKJKJJJJJJJJJJ",
    "KkkkKJKJJJJJJJJJJ",
    "KGGGKJKJJJJJJJJJJ",
    "KSSSSKKKKKKKKKKKK",
    "KSSSSKJJJJJJJJJJJ",
    "KsSSsKkkkkkkkkkkk",
    ".KKKKKGGGGGGGGGGG",
    ".....KKKKKKKKKKKK",
    "......KPPPPPPPPPP",
    "......KPPPPPPPPPP",
    "......KPPPPPPPPKK",
    "......KPPPPPPPPK.",
    "......KPPPPPPPPK.",
    "......KPPPPPPPPK.",
    "......KPPPPPPPK..",
    "......KPPPPPPPK..",
    "......KPPPPPPPK..",
    "......KkkkkkkkK..",
    ".....KKKKKKKKKK..",
    "....KWWWWWWWWWK..",
    "...KWWWWWWWWWWK..",
    "...KGGGGGGGGGGK..",
    "...KKKKKKKKKKKK..",
]

# --------------------------------------------------------------------------
# Battle back sprite, 64x64 (seen from behind, cropped at the waist).
# --------------------------------------------------------------------------
BACK_LEFT = [""] * 6 + [
    "KKKKKK",
    "KKKHHHHHH",
    "KKHHHHHHHHHH",
    "KHHHHHHHHHHHH",
    "KHHHHHHHHHHHHH",
    "KHHHHHHHHHHHHH",
    "KHHHHHHHHHHHHHH",
    "KHHHHHHHHHHHHHH",
    "KHHHHHHHHHHHHHH",
    "KHHHHHHHHHHHHHH",
    "KHHHHHHHHHHHHHH",
    "KHHHHHHHHHHHHHH",
    "KsKHHHHHHHHHHHHH",
    "KssKHHHHHHHHHHHH",
    "KssKHHHHHHHHHHHH",
    "KssKHHHHHHHHHHHH",
    ".KsKHHHHHHHHHHHH",
    "..KKHHHHHHHHHHHH",
    "...KHHHHHHHHHHH",
    "....KHHHHHHHHHH",
    ".....KsHHHHHHHH",
    "......KssSSSSSS",
    "..KKKKKKKKKKKKKKK",
    "KKKJJJJJKGGGGGGGG",
    "KKKJJJJJJJKGkkkkkkkk",
    "KKJJJJJJJJJJJKGkkkkkkkk",
    "KjJJJJJJJJJJJJKGkkkkkkk",
    "KjJJJJJJJJJJJJJJKGkkkkkk",
    "KjJJJJJJJJJJJJJJJKGGkkkk",
    "KjJJJJKJJJJJJJJJJJKGGGGG",
    "KjJJJJKJJJJJJJJJJJJKKKKK",
    "KjJJJJKJJJJJJJJJJJJJJJJJ",
    "KjJJJJKJJJJJJJJJJJJJJJJJ",
    "KjJJJJKJJJJJJJJJJJJJJJJJ",
    "KjJJJJKJJJJJJJJJJJJJJJJJ",
    "KjJJJJKJJJJJJJJJJJJJJJJJ",
    "KjJJJJKJJJJJJJJJJJJJJJJJ",
    "KjJJJJKJJJJJJJJJJJJJJJJJ",
    "KjJJJJKJJJJJJJJJJJJJJJJJ",
    "KjJJJJKJJJJJJJJJJJJJJJJJ",
    "KjJJJJKJJJJJJJJJJJJJJJJJ",
    "KjJJJJKJJJJJJJJJJJJJJJJJ",
    "KjJJJJKJJJJJJJJJJJJJJJJJ",
    "KkkkkkKJJJJJJJJJJJJJJJJJ",
    "KGGGGGKJJJJJJJJJJJJJJJJJ",
    "KSSSSSKJJJJJJJJJJJJJJJJJ",
    "KSSSSSSKJJJJJJJJJJJJJJJJ",
]
# Shine streaks in the hair (full-width coordinates).
BACK_PATCHES = [
    (22, 9, "hhh"), (20, 10, "hhhh"), (19, 11, "hhh"), (19, 12, "hh"),
    (35, 9, "hh"), (37, 10, "hh"), (39, 11, "h"),
    (30, 13, "h"), (29, 14, "h"), (31, 15, "hh"),
]
# Binance-style logo on the back of the hoodie (left half, '.' keeps hoodie).
BACK_LOGO_LEFT = ["....G", "...G.", "..G.G", ".G.G.", "G.G.g",
                  "G.G.g", ".G.G.", "..G.G", "...G.", "....G"]
BACK_LOGO_TOP = 40

# --------------------------------------------------------------------------
# Overworld sprites, 16x32 frames (art is bottom-aligned in the frame).
# Down / up are drawn as 8-column left halves and mirrored.
# --------------------------------------------------------------------------
OW_DOWN_LEFT = [
    ".....KKK",
    "...KKHHH",
    "..KHHHHH",
    ".KHHHHHH",
    ".KHHHHHH",
    ".KHHHHHH",
    ".KHHSSSS",
    ".KHSSeSS",
    ".KsSSeSS",
    "..KSSSSS",
    "...KsSSS",
    "...KKKss",
    "..KKkkKW",
    "..KjJJJJ",
    ".KjKJJJG",
    ".KjKJJGg",
    ".KSKJJJG",
    "..KKGGGG",
]
OW_DOWN_PATCHES = [
    (9, 6, "HHHH"), (4, 3, "hh"), (3, 4, "hh"), (10, 2, "hh"),
    (6, 13, "G"), (9, 13, "G"),
]

OW_UP_LEFT = [
    ".....KKK",
    "...KKHHH",
    "..KHHHHH",
    ".KHHHHHH",
    ".KHHHHHH",
    ".KHHHHHH",
    ".KHHHHHH",
    ".KHHHHHH",
    ".KsHHHHH",
    "..KHHHHH",
    "...KHHHH",
    "...KKKss",
    "..KKGGGG",
    "..KjKGkk",
    ".KjKJKKK",
    ".KjKJJJJ",
    ".KSKJJJJ",
    "..KKGGGG",
]
OW_UP_PATCHES = [(4, 3, "hh"), (3, 4, "hh"), (10, 2, "hh"), (11, 3, "h")]

# Legs for down / up (full 16 columns): stand, step with left foot, step right.
OW_LEGS_FRONT = [
    ["...KPPPPPPPPK...",
     "...KPPPKKPPPK...",
     "...KWWWKKWWWK...",
     "....KKK..KKK...."],
    ["...KPPPPPPPPK...",
     "...KPPPKKWWWK...",
     "...KWWWK.KKK....",
     "....KKK........."],
    ["...KPPPPPPPPK...",
     "...KWWWKKPPPK...",
     "....KKK.KWWWK...",
     ".........KKK...."],
]

# Facing left (right is the mirror image), full 16 columns.
OW_LEFT = [
    "......KKKK......",
    "....KKHHHHKK....",
    "...KHHhhHHHHK...",
    "..KHHhhHHHHHHK..",
    "..KHHHHHHHHHHK..",
    ".KHHHHHHHHHHHK..",
    ".KSSHHHHHHHHHK..",
    ".KSSSSHHHHHHHK..",
    "KSeSSSSsHHHHK...",
    "KSeSSSsssHHHK...",
    ".KSSSSSsHHK.....",
    "..KtSSSKK.......",
    "...KKssK........",
    "...KJJJkkK......",
    "..KJJJJJJJK.....",
    "..KJJKjjKJK.....",
    "..KJJKSSKJK.....",
    "..KGGKKKKGK.....",
]
OW_LEGS_SIDE = [
    ["...KPPPPPPK.....",
     "...KPPPPPK......",
     "..KWWWWWWK......",
     "...KKKKKK......."],
    ["...KPPPPPPK.....",
     "..KPPPKKppK.....",
     ".KWWWK..KWWK....",
     "..KKK....KK....."],
    ["...KPPPPPPK.....",
     "..KppKKPPPPK....",
     "..KWWK.KWWWWK...",
     "...KK...KKKK...."],
]
