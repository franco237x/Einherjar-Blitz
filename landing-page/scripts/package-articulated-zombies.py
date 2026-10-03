"""Package v4 articulated pieces, clips and portable viewer; preserve original RGBA."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import json

project = Path(__file__).resolve().parents[1]
root = project / 'public' / 'zombis-vivos' / 'especiales-v4'
destination = root.parent / 'zombis-especiales-v4.zip'
manifest = json.loads((root / 'manifest.json').read_text(encoding='utf-8'))
assert [c['id'] for c in manifest['characters']] == ['bruton', 'rafago']
assert sum(len(c['animations']) for c in manifest['characters']) == 13
assert sum(len(c.get('variants', {}).get('helmetless', {}).get('animations', {})) for c in manifest['characters']) == 6
with ZipFile(destination, 'w', compression=ZIP_DEFLATED, compresslevel=6) as archive:
    for file in sorted(root.rglob('*')):
        if not file.is_file():
            continue
        relative = file.relative_to(root).as_posix()
        if relative == 'index.html':
            source = file.read_text(encoding='utf-8')
            source = source.replace('href="../../plantas-vivas/estetica-v7/index.html">Ver plantas', 'href="./README.md">Guía del pack')
            source = source.replace('href="../zombis-especiales-v4.zip" download>Descargar pack <span aria-hidden="true">↓</span>', 'href="./preview/movimientos.gif" download>Descargar muestra <span aria-hidden="true">↓</span>')
            archive.writestr(relative, source)
        else:
            archive.write(file, relative)
    for name in ['build-articulated-zombies.mjs', 'render-articulated-zombie-review.mjs']:
        source = (project / 'scripts' / name).read_text(encoding='utf-8')
        source = source.replace('../public/zombis-vivos/especiales-v4/runtime/', '../runtime/')
        source = source.replace("new URL('../public/zombis-vivos/especiales-v4/', import.meta.url)", "new URL('../', import.meta.url)")
        archive.writestr(f'tooling/{name}', source)
with ZipFile(destination) as archive:
    assert archive.testzip() is None
    entries = archive.namelist()
    assert sum('/parts/' in name and name.endswith('.png') for name in entries) == 36
    assert sum('/sprites/' in name and name.endswith('.png') for name in entries) == 38
    assert sum('/animated/' in name and name.endswith('.webp') for name in entries) == 19
    assert sum('/animated/' in name and name.endswith('.gif') for name in entries) == 19
    assert sum(name.startswith('source/') and name.endswith('.png') for name in entries) == 6
    for c in manifest['characters']:
        assert c['rig'] in entries
        for group in [c['animations'], c.get('variants', {}).get('helmetless', {}).get('animations', {})]:
            for clip in group.values():
                for key in ['atlas', 'data', 'hdAtlas', 'hdData', 'webp', 'gif']:
                    assert clip[key] in entries
    print(f'ZIP verified: {len(entries)} files, {destination.stat().st_size / 1024 / 1024:.1f} MiB.\n{destination}')
