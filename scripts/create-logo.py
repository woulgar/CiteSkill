"""Render the CiteSkill mark as a PNG for plugin directories."""

from pathlib import Path
from PIL import Image, ImageDraw

SIZE = 1024
image = Image.new("RGB", (SIZE, SIZE), "#173B73")
draw = ImageDraw.Draw(image)
draw.rounded_rectangle((0, 0, SIZE - 1, SIZE - 1), radius=216, fill="#173B73")
draw.arc((184, 252, 820, 772), 78, 282, fill="#F4F8FF", width=108)
for y, end in [(404, 808), (512, 760), (620, 808)]:
    draw.line((576, y, end, y), fill="#61D6C2", width=46)
    draw.ellipse((553, y - 23, 599, y + 23), fill="#61D6C2")
    draw.ellipse((end - 23, y - 23, end + 23, y + 23), fill="#61D6C2")
image.resize((512, 512), Image.Resampling.LANCZOS).save(
    Path(__file__).resolve().parents[1] / "assets" / "logo.png"
)
