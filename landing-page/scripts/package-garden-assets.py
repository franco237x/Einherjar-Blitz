"""Package the opaque garden background and transparent mower animation assets."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import json

project = Path(__file__).resolve().parents[1]
asset_root = project / 'public' / 'jardin-yggdrasil'
destination = asset_root / 'jardin-yggdrasil-pack-v1.zip'
report = json.loads((asset_root / 'verification.json').read_text(encoding='utf-8'))
assert report['background']['size'] == [2320, 1390]
assert report['background']['actualPixelGeometry'] == 'verified'
assert report['mower']['mainFrames'] == 72

with ZipFile(destination, 'w', compression=ZIP_DEFLATED, compresslevel=6) as archive:
    for file in sorted(asset_root.rglob('*')):
        if file.is_file() and file.suffix != '.zip':
            archive.write(file, file.relative_to(asset_root).as_posix())
    for name in ['build-garden-assets.mjs', 'verify-garden-assets.mjs']:
        source = (project / 'scripts' / name).read_text(encoding='utf-8')
        source = source.replace("new URL('../public/jardin-yggdrasil/', import.meta.url)", "new URL('../', import.meta.url)")
        archive.writestr(f'tooling/{name}', source)

with ZipFile(destination) as archive:
    assert archive.testzip() is None
    names = archive.namelist()
    assert 'background/jardin-yggdrasil.webp' in names
    for clip in ['idle', 'start', 'run']:
        for extension in ['png', 'json']:
            assert f'podadora/sprites/{clip}.{extension}' in names
        for extension in ['webp', 'gif']:
            assert f'podadora/animated/{clip}.{extension}' in names
    print(f'ZIP verified: {len(names)} files, {destination.stat().st_size / 1024 / 1024:.1f} MiB.\n{destination}')
