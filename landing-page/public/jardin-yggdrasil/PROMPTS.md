# Prompts exactos · Jardín de Yggdrasil

Modo: **ImageGen integrado**. El jardín y las texturas se generaron opacos; el kit de podadora usa `transparent_background: true`. La guía de geometría está en `source/layout-guide.png`. La referencia de estilo fue `plantas-vivas/preview/lineup-v5.png`, el elenco original del proyecto.

## garden

```text
Use case: stylized-concept.
Asset type: original opaque 2D tower-defense garden battlefield background, landscape 2320 by 1390 pixels, aspect ratio 1.669:1.
Input image 1 is a GEOMETRY GUIDE ONLY. Preserve its exact flat rectangular zone layout and nine columns by five rows, not its plain rendering. Image 2 is STYLE REFERENCE ONLY: our original cartoon plant cast. Match broad clean painted shadows, lively warm colored outlines and lush simplified colors; do not reproduce any characters from it.
Primary request: a welcoming Nordic clearing beside the immense trunk of Yggdrasil, for a Plants vs Zombies inspired lane-defense game. A beautiful game-quality painted background with clear, unobstructed playable grass.
Mandatory layout in the final 2320x1390 coordinate system:
LEFT HOME / MOWER STRIP x=0..180, y=190..1340: narrow straight vertical wooden porch/deck alongside the edge of a huge tree-house trunk. Carved decorative Nordic rune motifs near the outer left edge, a little warm brass detail. All five lane mower parking areas should stay unobstructed. The porch is straight, not diagonal.
PLAYABLE LAWN x=180..1980, y=190..1340: EXACTLY nine equal columns of 200 pixels by five equal rows of 230 pixels, 45 soft green checkerboard lawn rectangles. No perspective convergence or diagonal rows. Every lawn cell is empty short mown grass with quiet painterly texture; two alternating soft greens, gentle contrast, no thick outlines. Nothing sits on this lawn. NO trees, trunk, roots, rocks, paths, stumps, mushrooms, bushes, flowers, characters, props, runes, fireflies, shadows from objects, or decorative borders intruding into any playable cell.
RIGHT ZOMBIE ENTRY x=1980..2320, y=190..1340: a straight earthy path with a broken rustic fence and distant forest along the far right edge. It spans all five rows, no narrowing perspective. Fence/forest details confined to this side zone.
TOP SKY / DISTANT BACKDROP y=0..190 across the full width: soft pale teal and warm cream sky glimpsed through a leafy Nordic forest canopy. A hint of immense Yggdrasil branches at the outer edges, pretty soft shapes. All distant scenery remains above y=190. No mountains or branches down across the lawn.
BOTTOM STRIP y=1340..1390: only a very narrow warm soil and short grass border, parallel to the bottom of the image.
Camera: frontal with a little overhead view, orthographic-looking game board. Horizontal and vertical tile edges remain perfectly straight, and each row has the same height. No strong perspective. The artwork fills the whole frame.
Style: polished colorful 2D cartoon strategy-game environment, hand-painted but clean, broad shapes and cel-like shading, inviting sunlight, friendly slightly whimsical Nordic wood and weathered bronze, readable behind our saturated character sprites. Keep ground texture restrained.
Constraints: one fully opaque image, no UI, no tile labels, no numbers, no text except decorative nonverbal rune motifs confined to the home edge, no watermark, no characters anywhere, no mower yet. Preserve the geometry of the reference guide.
```

## grass

```text
Use case: stylized-concept.
Asset type: original opaque painterly grass texture swatches for a cartoon tower-defense board.
Primary request: one landscape image consisting of EXACTLY TWO solid rectangular grass texture panels side by side, left and right equal width, each filling its half completely with no margin or white gutter. This is texture art, not a scene.
LEFT HALF: short mown grass in a soft light yellow-green, target base color approximately #9ABD6C.
RIGHT HALF: the same short mown grass style in a slightly darker soft moss-green, target base color approximately #8DAF60. Keep the two green colors visibly distinguishable with gentle contrast.
Texture: broad subtle painted tonal patches, a few very tiny low-contrast grass strokes and softly mottled paint grain, calm flat overhead surface. Very restrained variation so each panel stays essentially one green tone. Seamless-looking edges, no lighting gradient, no vignette, no highlights or shadows from objects.
Style: clean simplified hand-painted 2D cartoon game ground like the quiet lawn in Plants vs Zombies 2, colorful but gentle, supporting expressive character sprites placed above it.
No grid within either panel, no checkerboard within either panel, no bevels, no outlines around the panels, no paths, soil, plants, flowers, mushrooms, rocks, roots, leaves, text, decorative symbols, scattered objects, faces or characters. No perspective. Full bleed and fully opaque. Only the two softly textured greens.
```

## mower

```text
Use case: stylized-concept.
Asset type: professional transparent 2D game prop animation cutout kit, original Nordic lawn mower.
Input image 1 is STYLE REFERENCE ONLY: our original cartoon plant characters. Match their warm dark colored outlines, clean broad hand-painted/cel shadows, polished playful shapes and readable silhouette. No plants from the reference in the output.
Primary request: create a small sturdy push lawn mower for an Yggdrasil clearing in a Plants vs Zombies inspired lane-defense game. It faces RIGHT and has no operator or face. Charming round toy-like proportions, broad red-copper/bronze motor casing, honey-colored wood inset with one small carved Nordic decorative rune, dark iron edging and metal front cutter guard. A tall but compact curved handle rises toward the BACK LEFT, wheel tread dark slate, warm wooden wheel hubs and FOUR strongly visible asymmetrical brass spokes in each round wheel. Nose and cutter clearly point RIGHT. Not a chariot, vehicle with occupant, plant or creature.
Composition: ONE square transparent master containing EXACTLY EIGHT separate assets in an invisible FOUR COLUMN by TWO ROW grid. One asset in each cell. Plenty of truly transparent margins, at least 12%, on every side, and broad transparent gutters between cells. No asset crosses cells.
View: consistent TRUE SIDE PROFILE facing RIGHT, slightly stylized, not strongly foreshortened; wheels must be genuinely circular and side-on so they can rotate about their centers without changing shape. No ground shadow, backdrop, lettering, labels or numbers.
ROW ONE, left to right:
1. Complete assembled Nordic mower reference. Compact right-facing chassis, left/rear handle and two clearly visible round wheels. Include every detail from detached pieces.
2. ONLY the chassis/motor casing and front cutter guard, profile facing right, from top of engine to bottom of deck. NO wheels, NO handle, NO ground shadow. Motor housing with honey wood inset and a tiny brass rune fitting. Broad body should be wider than tall.
3. ONLY the rear/back wheel, round dark rubber tread, wooden center and four distinct bronze spokes, isolated front-on circle, no chassis. Center perfectly aligned with the geometric center.
4. ONLY the front/near wheel, matching round dark tread and bronze spokes, slightly larger than the rear wheel, isolated front-on circle. Center perfectly aligned.
ROW TWO, left to right:
5. ONLY the curved compact handle and its wooden grip, as seen in the reference: upper grip toward upper LEFT and chassis attachment toward lower RIGHT. No attached wheel, body or person. Warm wood and iron.
6. ONLY one small soft warm-white cartoon metal glint/star with four points, subtle gold rim, isolated, no hard broad glow and no object.
7. ONLY one compact soft gray-beige cartoon exhaust smoke puff, short curling rounded shapes, dark warm outline, isolated. NO large cloud, fire, face or vehicle.
8. ONLY a tiny isolated beige earth dust puff with three tiny clipped green grass flecks, a clear readable sweep effect, no characters.
Constraints: true alpha transparency everywhere outside the eight cutouts; NO painted checkerboard, no white or color backdrop, no ground shadow. Exact same costume/materials across assembled reference and detached parts. The chassis and wheel/handle assets must genuinely be separate for continuous animation. Do not duplicate wheels or handle inside the chassis cell. All mower assets RIGHT-facing; no gore or harm depiction.
```

## Corrección del fondo

```text
Use case: precise-object-edit.
Input image is the EDIT TARGET, our original Nordic garden battlefield.
Change ONLY this: remove the entire hanging lantern in the upper-left that hangs over the playable grass, including its chain and projecting support beam. Restore the sky/forest and bare short grass behind it. Do not replace it with any other object.
Keep the massive tree trunk on the extreme left, its inset round window, the vertical wooden porch with carved decorative motifs, right path and broken fence, sky, colors, style, overall composition and nine-column/five-row grass board exactly the same. No other changes.
There must be no foreground decoration extending over the playable lawn; all foreground house decoration is confined to the extreme left porch strip. Output an opaque landscape game background, no characters, no labels or UI.
```
