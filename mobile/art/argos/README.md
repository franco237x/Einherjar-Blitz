# Argos — fuente de animación

Abrir `argos_idle_rig.sif` con Synfig Studio 1.5.3.

El lienzo está configurado a 1086 × 1448 px, 12 FPS y contiene seis marcas
de pose en los frames 0, 2, 4, 6, 8 y 10. Cada pieza está encapsulada en un
grupo propio para conservar su nombre, posición, escala y rotación.

## Flujo de edición

1. Mantener los pies sobre la misma línea base.
2. Editar las seis poses marcadas.
3. Guardar el archivo de Synfig.
4. Ejecutar desde la raíz de `mobile`:

   ```powershell
   .\art\argos\export_idle.ps1
   ```

   El script renderiza a 543 × 724 px, toma los frames 0, 2, 4, 6, 8 y 10,
   conserva un backup del idle anterior y actualiza automáticamente
   `assets/images/game/argos/frames/idle/`.

5. El juego reproduce automáticamente la vuelta:
   `1 → 2 → 3 → 4 → 5 → 6 → 5 → 4 → 3 → 2`.

`argos_robot.png` y `argos_rig.png` son referencias visuales. No deben
exportarse como sprites porque su fondo cuadriculado está incrustado.
