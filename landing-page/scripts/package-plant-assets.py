"""Package the completed original assets; this script does not alter images."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import json

project = Path(__file__).resolve().parents[1]
asset_root = project / 'public' / 'plantas-vivas'
destination = asset_root / 'plantas-vivas-pack-v5.zip'
excluded = {'art-direction-reference.webp', 'lineup-reference.png', 'zarzina-parts.png',
            'lineup.png', 'movimientos.gif', 'movimientos.webp', 'action-poses.png', 'visor-desktop.png', 'visor-mobile.png'}

manifest = json.loads((asset_root / 'manifest.json').read_text(encoding='utf-8'))
character_count = len(manifest['characters'])
assert character_count == 10
clip_count = sum(len(character['animations']) for character in manifest['characters'])
with ZipFile(destination, 'w', compression=ZIP_DEFLATED, compresslevel=6) as archive:
    for file in sorted(asset_root.rglob('*')):
        if not file.is_file() or file.suffix == '.zip' or file.name in excluded:
            continue
        if file.parent.name == 'preview' and any(version in file.stem for version in ['-v3', '-v4']):
            continue
        archive.write(file, file.relative_to(asset_root).as_posix())
    for name in ['build-plant-assets.mjs', 'render-plant-preview.mjs', 'verify-plant-assets.mjs', 'inspect-plant-poses.mjs', 'render-shadow-demo.mjs', 'verify-shadow-mechanic.mjs', 'verify-shadow-clock.mjs']:
        source = (project / 'scripts' / name).read_text(encoding='utf-8')
        source = source.replace("../public/plantas-vivas/runtime/plant-rig.mjs", "../runtime/plant-rig.mjs")
        source = source.replace("../public/plantas-vivas/runtime/shadow-scene.mjs", "../runtime/shadow-scene.mjs")
        source = source.replace("new URL('../public/plantas-vivas/', import.meta.url)", "new URL('../', import.meta.url)")
        archive.writestr(f'tooling/{name}', source)

with ZipFile(destination) as archive:
    assert archive.testzip() is None
    entries = archive.namelist()
    assert sum(name.endswith('/portrait.png') for name in entries) == character_count
    assert sum('/sprites/' in name and name.endswith('.png') for name in entries) == clip_count
    assert sum('/animated/' in name and name.endswith('.webp') for name in entries) == clip_count
    assert not any(name.endswith('art-direction-reference.webp') for name in entries)
    print(f'ZIP verified: {len(entries)} files, {destination.stat().st_size / 1024 / 1024:.1f} MiB.\n{destination}')

individual = asset_root / 'velaria-assets-v5.zip'
individual_sources = [asset_root / 'characters' / 'velaria',
                      asset_root / 'source' / 'velaria-parts.png',
                      asset_root / 'prompts' / 'velaria.txt',
                      asset_root / 'runtime' / 'plant-rig.mjs',
                      asset_root / 'runtime' / 'shadow-scene.mjs']
individual_previews = ['lineup-velaria.png', 'movimientos-velaria.gif', 'movimientos-velaria.webp',
                       'action-poses-velaria.png', 'eco-umbrio.gif', 'eco-umbrio.webp', 'eco-umbrio-pasos.png']
individual_sources += [asset_root / 'preview' / name for name in individual_previews]
validation = json.loads((asset_root / 'validation.json').read_text(encoding='utf-8'))
browser = json.loads((asset_root / 'browser-validation.json').read_text(encoding='utf-8'))['checked']
individual_validation = {
    'date': '2026-10-01',
    'assets': next(character for character in validation['characters'] if character['id'] == 'velaria'),
    'logic': browser['shadowRecall'], 'browser': browser['shadowBrowser'], 'clock': browser['shadowClock'],
    'responsiveWidths': browser['responsiveWidths'], 'javascriptErrors': browser['javascriptErrors'],
    'assetFailures': browser['assetFailures'],
}
with ZipFile(individual, 'w', compression=ZIP_DEFLATED, compresslevel=6) as archive:
    for source in individual_sources:
        files = sorted(source.rglob('*')) if source.is_dir() else [source]
        for file in files:
            if file.is_file():
                archive.write(file, file.relative_to(asset_root).as_posix())
    archive.writestr('README.md', (asset_root / 'README-velaria.md').read_text(encoding='utf-8'))
    archive.writestr('verification.json', json.dumps(individual_validation, ensure_ascii=False, indent=2) + '\n')
    for name in ['build-plant-assets.mjs', 'render-plant-preview.mjs', 'inspect-plant-poses.mjs',
                 'render-shadow-demo.mjs', 'verify-shadow-mechanic.mjs']:
        source = (project / 'scripts' / name).read_text(encoding='utf-8')
        source = source.replace('../public/plantas-vivas/runtime/', '../runtime/')
        source = source.replace("new URL('../public/plantas-vivas/', import.meta.url)", "new URL('../', import.meta.url)")
        archive.writestr(f'tooling/{name}', source)
with ZipFile(individual) as archive:
    assert archive.testzip() is None
    entries = archive.namelist()
    assert sum('/sprites/' in name and name.endswith('.png') for name in entries) == 8
    assert sum('/animated/' in name and name.endswith('.webp') for name in entries) == 8
    assert sum('/animated/' in name and name.endswith('.gif') for name in entries) == 8
    assert 'runtime/plant-rig.mjs' in entries
    print(f'Individual ZIP verified: {len(entries)} files, {individual.stat().st_size / 1024 / 1024:.1f} MiB.\n{individual}')
