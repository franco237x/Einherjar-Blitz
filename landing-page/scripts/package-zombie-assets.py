"""Package original artwork, animation exports and viewer. Does not alter images."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import json

project = Path(__file__).resolve().parents[1]
asset_root = project / 'public' / 'zombis-vivos'
destination = asset_root / 'zombis-vivos-pack-v1.zip'
manifest = json.loads((asset_root / 'manifest.json').read_text(encoding='utf-8'))
assert len(manifest['characters']) == 3
primary = sum(len(character['animations']) for character in manifest['characters'])
variants = sum(len(character.get('variants', {}).get('unarmored', {}).get('animations', {})) for character in manifest['characters'])
assert primary == 20 and variants == 10

with ZipFile(destination, 'w', compression=ZIP_DEFLATED, compresslevel=6) as archive:
    for file in sorted(asset_root.rglob('*')):
        if file.is_file() and file.suffix != '.zip':
            archive.write(file, file.relative_to(asset_root).as_posix())
    for name in ['build-zombie-assets.mjs', 'render-zombie-preview.mjs', 'verify-zombie-assets.mjs']:
        source = (project / 'scripts' / name).read_text(encoding='utf-8')
        source = source.replace('../public/zombis-vivos/runtime/', '../runtime/')
        source = source.replace("new URL('../public/zombis-vivos/', import.meta.url)", "new URL('../', import.meta.url)")
        archive.writestr(f'tooling/{name}', source)

with ZipFile(destination) as archive:
    assert archive.testzip() is None
    entries = archive.namelist()
    assert sum(name.endswith('/portrait.png') for name in entries) == 3
    assert sum('/sprites/' in name and name.endswith('.png') for name in entries) == primary + variants
    assert sum('/animated/' in name and name.endswith('.webp') for name in entries) == primary + variants
    assert sum('/animated/' in name and name.endswith('.gif') for name in entries) == primary + variants
    for character in manifest['characters']:
        groups = [character['animations'], character.get('variants', {}).get('unarmored', {}).get('animations', {})]
        for animations in groups:
            for animation in animations.values():
                for key in ['atlas', 'data', 'webp', 'gif']:
                    assert animation[key] in entries, animation[key]
    print(f'ZIP verified: {len(entries)} files, {destination.stat().st_size / 1024 / 1024:.1f} MiB.\n{destination}')
