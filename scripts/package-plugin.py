"""Create reproducible, manifest-rooted plugin ZIPs for submission."""

from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

root = Path(__file__).resolve().parents[1]
out = root / "release"
out.mkdir(exist_ok=True)
for folder, label in [(root / "plugins" / "citeskill", "codex"), (root / "claude-plugin", "claude")]:
    target = out / f"citeskill-{label}-0.1.0.zip"
    with ZipFile(target, "w", ZIP_DEFLATED) as archive:
        for path in sorted(p for p in folder.rglob("*") if p.is_file()):
            archive.write(path, Path("citeskill") / path.relative_to(folder))
    print(target)
