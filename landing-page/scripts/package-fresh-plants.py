"""Reproducible v6 packs. Only copies files; never edits artwork."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import json

project = Path(__file__).resolve().parents[1]
root = project / 'public' / 'plantas-vivas'
zombies = project / 'public' / 'zombis-vivos'
manifest = json.loads((root / 'manifest.json').read_text(encoding='utf-8'))
fresh_ids = {'cilantro', 'limon', 'jengibron'}
all_entries = manifest['characters'] + manifest['archivedCharacters']
assert len(manifest['characters']) == 11
assert len(all_entries) == 13

def adapted(text):
    return (text.replace('../../zombis-vivos/runtime/zombie-rig.mjs', '../practice/runtime/zombie-rig.mjs')
            .replace('../public/plantas-vivas/', '../')
            .replace('../public/zombis-vivos/', '../practice/'))

def add_file(archive, file, name=None):
    name = name or file.relative_to(root).as_posix()
    if file.suffix in {'.mjs', '.html'}:
        text = adapted(file.read_text(encoding='utf-8'))
        if name == 'index.html':
            text = text.replace('./cilantro-limon-jengibron-assets-v6.zip', './preview/movimientos-cilantro-limon-jengibron.gif')
            text = text.replace('Descargar las tres nuevas', 'Ver la vista animada')
        archive.writestr(name, text)
    else:
        archive.write(file, name)

def add_practice(archive):
    archive.write(zombies / 'runtime' / 'zombie-rig.mjs', 'practice/runtime/zombie-rig.mjs')
    for character in ['conero', 'despistado']:
        for file in sorted((zombies / 'characters' / character / 'parts').glob('*.png')):
            if file.stem != 'reference':
                archive.write(file, f'practice/characters/{character}/parts/{file.name}')

def add_tooling(archive):
    for name in ['build-plant-assets.mjs', 'render-plant-preview.mjs', 'inspect-plant-poses.mjs',
                 'render-fresh-review.mjs', 'verify-fresh-plants.mjs']:
        archive.writestr(f'tooling/{name}', adapted((project / 'scripts' / name).read_text(encoding='utf-8')))

def verify(destination, ids, clips):
    with ZipFile(destination) as archive:
        assert archive.testzip() is None
        entries = archive.namelist()
        assert sum(name.startswith('characters/') and name.endswith('/portrait.png') for name in entries) == len(ids)
        assert sum('/sprites/' in name and name.endswith('.png') for name in entries) == clips
        assert sum('/animated/' in name and name.endswith('.webp') for name in entries) == clips
        assert 'practice/runtime/zombie-rig.mjs' in entries
        assert 'runtime/fresh-mechanics.mjs' in entries
        print(f'ZIP verified: {len(entries)} files; {destination.stat().st_size / 1024 / 1024:.1f} MiB; {destination}')

individual = root / 'cilantro-limon-jengibron-assets-v6.zip'
with ZipFile(individual, 'w', ZIP_DEFLATED, compresslevel=6) as archive:
    for character in sorted(fresh_ids):
        for file in sorted((root / 'characters' / character).rglob('*')):
            if file.is_file():
                add_file(archive, file)
        add_file(archive, root / 'source' / f'{character}-parts.png')
        add_file(archive, root / 'prompts' / f'{character}.txt')
    for file in sorted((root / 'runtime').glob('*.mjs')):
        add_file(archive, file)
    for name in ['README.md', 'prompts.md', 'fresh-validation.json', 'favicon.svg', 'viewer.css', 'viewer.mjs']:
        add_file(archive, root / name)
    html = adapted((root / 'index.html').read_text(encoding='utf-8'))
    html = html.replace('./cilantro-limon-jengibron-assets-v6.zip', './preview/movimientos-cilantro-limon-jengibron.gif')
    html = html.replace('Descargar las tres nuevas', 'Ver la vista animada')
    html = html.replace('<a href="./index.html?archivo=1">Conceptos archivados</a>', '')
    archive.writestr('index.html', html)
    subset = {**manifest, 'characters': [entry for entry in manifest['characters'] if entry['id'] in fresh_ids], 'archivedCharacters': []}
    archive.writestr('manifest.json', json.dumps(subset, ensure_ascii=False, indent=2) + '\n')
    for file in sorted((root / 'preview').glob('*')):
        if file.is_file() and ('cilantro-limon-jengibron' in file.stem or file.name in {'combo-jengibron.png', 'combate-v6.png'}):
            add_file(archive, file)
    add_practice(archive)
    add_tooling(archive)
verify(individual, fresh_ids, 15)

complete = root / 'plantas-vivas-pack-v6.zip'
excluded = {'art-direction-reference.webp', 'lineup-reference.png', 'zarzina-parts.png',
            'lineup.png', 'movimientos.gif', 'movimientos.webp', 'action-poses.png', 'visor-desktop.png', 'visor-mobile.png'}
with ZipFile(complete, 'w', ZIP_DEFLATED, compresslevel=6) as archive:
    for file in sorted(root.rglob('*')):
        if not file.is_file() or file.suffix == '.zip' or file.name in excluded:
            continue
        if file.parent.name == 'preview' and any(version in file.stem for version in ['-v3', '-v4', '-v5']):
            continue
        add_file(archive, file)
    add_practice(archive)
    add_tooling(archive)
verify(complete, {entry['id'] for entry in all_entries}, 70)
