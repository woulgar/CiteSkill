"""Render an English-only, silent CiteSkill preview with Pillow and FFmpeg."""

from pathlib import Path
import subprocess

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "release" / "citeskill-preview.mp4"
SIZE = (1280, 720)
FPS = 24
BG = "#0b1020"
WHITE = "#f7fafc"
MUTED = "#a9b4c9"
CYAN = "#59e1d4"
BLUE = "#3979f6"

FONT = Path("C:/Windows/Fonts/segoeui.ttf")
BOLD = Path("C:/Windows/Fonts/segoeuib.ttf")


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(BOLD if bold else FONT), size)


def text(draw: ImageDraw.ImageDraw, xy: tuple[int, int], value: str, size: int,
         color: str = WHITE, bold: bool = False) -> None:
    draw.text(xy, value, font=font(size, bold), fill=color)


def frame(scene: int, progress: float) -> Image.Image:
    image = Image.new("RGB", SIZE, BG)
    draw = ImageDraw.Draw(image)
    draw.rounded_rectangle((48, 36, 1232, 684), radius=28, fill="#121a30", outline="#293657", width=2)
    text(draw, (84, 62), "CiteSkill", 29, CYAN, True)
    text(draw, (1035, 69), "PREVIEW", 16, MUTED, True)
    draw.rectangle((84, 115, 1196, 117), fill="#293657")
    draw.rectangle((84, 115, 84 + int(1112 * ((scene + progress) / 5)), 117), fill=CYAN)

    if scene == 0:
        text(draw, (96, 214), "Who helped build this?", 66, WHITE, True)
        text(draw, (100, 318), "Give agent-assisted work a traceable citation.", 34, MUTED)
        draw.rounded_rectangle((98, 425, 610, 505), radius=18, fill=BLUE)
        text(draw, (132, 439), "Agents  /  Models  /  Skills", 28, WHITE, True)
    elif scene == 1:
        text(draw, (96, 170), "Record direct sources", 58, WHITE, True)
        rows = [("AGENT", "Codex"), ("MODEL", "GPT Sol"), ("MODEL", "Claude Opus 5.5"),
                ("SKILL", "plugin-creator")]
        for i, (kind, name) in enumerate(rows):
            y = 280 + i * 78
            draw.rounded_rectangle((100, y, 1176, y + 62), radius=12, fill="#1c2844")
            text(draw, (126, y + 13), kind, 21, CYAN, True)
            text(draw, (340, y + 9), name, 28, WHITE)
    elif scene == 2:
        text(draw, (96, 166), "Connect citations to work", 56, WHITE, True)
        draw.rounded_rectangle((96, 275, 1184, 465), radius=16, fill="#090e1a", outline="#304160")
        text(draw, (127, 304), "git commit -m \"Add feature\"", 29, WHITE)
        text(draw, (127, 371), "CiteSkill-Refs: codex-build-1", 29, CYAN, True)
        text(draw, (100, 511), "Commit and PR references keep the record reviewable.", 28, MUTED)
    elif scene == 3:
        text(draw, (96, 166), "Show attribution in README", 54, WHITE, True)
        draw.rounded_rectangle((96, 264, 1184, 530), radius=16, fill="#f7fafc")
        text(draw, (132, 294), "Agentic citations", 40, "#15243a", True)
        text(draw, (132, 374), "Codex  |  GPT Sol  |  Claude Opus 5.5", 27, "#263b55")
        text(draw, (132, 432), "Linked to the commits they helped create", 25, "#52657d")
        text(draw, (100, 562), "Contribution shares appear only when declared.", 26, MUTED)
    else:
        text(draw, (96, 202), "Credit the work behind the work.", 53, WHITE, True)
        text(draw, (100, 305), "CiteSkill", 82, CYAN, True)
        text(draw, (100, 434), "Open source  /  MIT  /  Codex + Claude plugins", 29, MUTED)
        text(draw, (100, 548), "Created by Volkan Kirdar", 25, WHITE)
    return image


def main() -> None:
    OUT.parent.mkdir(exist_ok=True)
    command = ["ffmpeg", "-y", "-f", "rawvideo", "-vcodec", "rawvideo", "-pix_fmt", "rgb24",
               "-s", "1280x720", "-r", str(FPS), "-i", "-", "-an", "-c:v", "libx264",
               "-pix_fmt", "yuv420p", "-crf", "20", "-movflags", "+faststart", str(OUT)]
    with subprocess.Popen(command, stdin=subprocess.PIPE, stderr=subprocess.DEVNULL) as process:
        assert process.stdin is not None
        for index in range(5 * 4 * FPS):
            scene = index // (4 * FPS)
            progress = (index % (4 * FPS)) / (4 * FPS)
            process.stdin.write(frame(scene, progress).tobytes())
        process.stdin.close()
        if process.wait() != 0:
            raise RuntimeError("FFmpeg failed to render the video")
    print(OUT)


if __name__ == "__main__":
    main()
