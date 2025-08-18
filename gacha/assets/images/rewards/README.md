# Imágenes de Recompensas - Einherjar Blitz

## Estructura de carpetas:

### Uma Musume (`uma_musume/`)
Imágenes de personajes de Uma Musume Pretty Derby

### Warhammer 40K (`warhammer/`)
Imágenes de personajes y lugares del universo Warhammer 40K

### Especiales (`special/`)
Imágenes para tipos genéricos de recompensas

## Formatos recomendados:
- **Formato:** JPG, PNG o WebP
- **Resolución:** 512x512px o superior (cuadrada preferida)
- **Peso:** Máximo 500KB por imagen
- **Calidad:** Alta definición para el efecto de revelación

## Imágenes requeridas:

### Especiales (obligatorias):
- `unknown.jpg` - Imagen de fallback cuando no se encuentra la imagen específica
- `coins.jpg` - Para recompensas de monedas
- `item.jpg` - Para objetos genéricos
- `special.jpg` - Para recompensas especiales
- etc.

### Uma Musume:
- Agregar imágenes de cada personaje según la lista en `reward-images.js`

### Warhammer 40K:
- Agregar imágenes de primarcas y lugares según la lista en `reward-images.js`

## Notas:
- Las imágenes se mostrarán con efecto de revelación estilo Genshin Impact
- Se recomienda usar imágenes con fondo transparente o oscuro
- El sistema tiene fallback automático si no encuentra una imagen específica
