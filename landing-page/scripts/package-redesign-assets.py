"""Package the independent v7 redesign, with portable practice dependencies."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import json

project = Path(__file__).resolve().parents[1]
root = project / 'public' / 'plantas-vivas' / 'estetica-v7'
zombies = project / 'public' / 'zombis-vivos'
destination = root.parent / 'plantas-redisenadas-v7.zip'
manifest = json.loads((root / 'manifest.json').read_text(encoding='utf-8'))
assert manifest['version'] == '7.0.0'
assert len(manifest['characters']) == 3
assert sum(len(character['animations']) for character in manifest['characters']) == 15

with ZipFile(destination, 'w', ZIP_DEFLATED, compresslevel=6) as archive:
    for file in sorted(root.rglob('*')):
        if not file.is_file():
            continue
        name = file.relative_to(root).as_posix()
        if name == 'runtime/fresh-scene.mjs':
            text = file.read_text(encoding='utf-8').replace(
                '../../../zombis-vivos/runtime/zombie-rig.mjs', '../practice/runtime/zombie-rig.mjs')
            archive.writestr(name, text)
        elif name == 'index.html':
            text = file.read_text(encoding='utf-8').replace(
                '../plantas-redisenadas-v7.zip', './preview/movimientos-cilantro-limon-jengibron.gif')
            archive.writestr(name, text.replace('Descargar el pack', 'Ver vista animada'))
        else:
            archive.write(file, name)
    archive.write(zombies / 'runtime' / 'zombie-rig.mjs', 'practice/runtime/zombie-rig.mjs')
    for character in ['conero', 'despistado']:
        for file in sorted((zombies / 'characters' / character / 'parts').glob('*.png')):
            if file.stem != 'reference':
                archive.write(file, f'practice/characters/{character}/parts/{file.name}')

with ZipFile(destination) as archive:
    assert archive.testzip() is None
    names = archive.namelist()
    assert sum(name.startswith('characters/') and name.endswith('/portrait.png') for name in names) == 3
    assert sum('/sprites/' in name and name.endswith('.png') for name in names) == 15
    assert sum('/animated/' in name and name.endswith('.webp') for name in names) == 15
    assert sum('/animated/' in name and name.endswith('.gif') for name in names) == 15
    assert len([name for name in names if name.startswith('source/') and name.endswith('.png')]) == 3
    assert 'runtime/base-rig.mjs' in names and 'practice/runtime/zombie-rig.mjs' in names
    print(f'ZIP verified: {len(names)} files; {destination.stat().st_size / 1024 / 1024:.1f} MiB; {destination}')
