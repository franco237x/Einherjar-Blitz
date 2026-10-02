"""Package v3 complete-body painted poses, standard/HD atlases and standalone viewer."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import json

project = Path(__file__).resolve().parents[1]
root = project / 'public' / 'zombis-vivos' / 'especiales-v3'
destination = root.parent / 'zombis-especiales-v3.zip'
manifest = json.loads((root / 'manifest.json').read_text(encoding='utf-8'))
assert [item['id'] for item in manifest['characters']] == ['bruton', 'rafago']
assert sum(len(item['animations']) for item in manifest['characters']) == 13
assert sum(len(item.get('variants', {}).get('unarmored', {}).get('animations', {})) for item in manifest['characters']) == 5
with ZipFile(destination, 'w', compression=ZIP_DEFLATED, compresslevel=6) as archive:
    for file in sorted(root.rglob('*')):
        if not file.is_file():
            continue
        relative = file.relative_to(root).as_posix()
        if relative == 'index.html':
            source = file.read_text(encoding='utf-8')
            source = source.replace('href="../../plantas-vivas/estetica-v7/index.html">Ver plantas', 'href="./README.md">Guía del pack')
            source = source.replace('href="../zombis-especiales-v3.zip" download>Descargar pack <span aria-hidden="true">↓</span>', 'href="./preview/movimientos.gif" download>Descargar muestra <span aria-hidden="true">↓</span>')
            archive.writestr(relative, source)
        else:
            archive.write(file, relative)
with ZipFile(destination) as archive:
    assert archive.testzip() is None
    entries = archive.namelist()
    assert sum(name.endswith('/portrait.png') for name in entries) == 2
    assert sum('/sprites/' in name and name.endswith('.png') for name in entries) == 36
    assert sum('/animated/' in name and name.endswith('.webp') for name in entries) == 18
    assert sum('/animated/' in name and name.endswith('.gif') for name in entries) == 18
    for character in manifest['characters']:
        for animations in [character['animations'], character.get('variants', {}).get('unarmored', {}).get('animations', {})]:
            for animation in animations.values():
                for key in ['atlas', 'data', 'hdAtlas', 'hdData', 'webp', 'gif']:
                    assert animation[key] in entries, animation[key]
        for sheet in character['poseSheets'].values():
            assert sheet['image'] in entries
    print(f'ZIP verified: {len(entries)} files, {destination.stat().st_size / 1024 / 1024:.1f} MiB.\n{destination}')
