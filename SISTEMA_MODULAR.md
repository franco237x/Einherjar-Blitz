# Sistema Modular de Personajes - Einherjar Blitz

## Descripción General

El nuevo sistema modular permite que cada personaje tenga sus propias mecánicas únicas, ataques personalizados y pasivas específicas. Cada personaje se carga dinámicamente como un módulo ES6 independiente.

## Estructura del Sistema

### Jerarquía de Clases

```
Character (Clase Base)
├── ShunaShieda
├── OzenKimura
└── XairChikyu
```

### Archivos del Sistema

- `characters/Character.js` - Clase base con funcionalidades comunes
- `characters/ShunaShieda.js` - Módulo específico de Shuna
- `characters/OzenKimura.js` - Módulo específico de Ozen
- `characters/XairChikyu.js` - Módulo específico de Xair
- `characters/CharacterFactory.js` - Factory para crear personajes
- `characters/index.js` - Archivo de exportaciones y utilidades
- `juego_new.js` - Sistema de juego actualizado para módulos ES6

## Características de cada Personaje

### 🔥 Shuna Shieda - "La Furia de los Shiedas"
**Mecánica Principal: Sistema de Furia**

**Ataques:**
- **Corte Letal** (Básico): Chance de aplicar sangrado
- **Danza de las Mil Heridas** (Elemental): 3 ataques consecutivos crecientes
- **Furia Shieda Definitiva** (Ultimate): Consume furia para daño devastador

**Pasivas:**
- **Furia de los Shiedas**: Cada crítico otorga stacks de furia (+8% daño cada una)
- **Sed de Sangre**: Al eliminar enemigos, recupera 25% vida y toda la energía

### 🛡️ Ozen Kimura - "La Muralla Inamovible"
**Mecánica Principal: Sistema de Escudo**

**Ataques:**
- **Golpe de Acero** (Básico): Genera escudo basado en daño
- **Muro de Hielo** (Elemental): Entra en postura defensiva, chance de congelar
- **Tormenta Glacial Kimura** (Ultimate): Consume escudo para multiplicar daño

**Pasivas:**
- **Muralla Inamovible**: Genera escudo del 15% del daño recibido
- **Contraataque Gélido**: Al romperse el escudo, próximo ataque es crítico garantizado

### ⚡ Xair Chikyu - "El Maestro del Bijon"
**Mecánica Principal: Energía Bijon**

**Ataques:**
- **Ráfaga Bijon** (Básico): Genera energía Bijon
- **Tormenta de Viento Helado** (Elemental): Drena energía enemiga
- **Cataclismo Bijon** (Ultimate): Efectos escalables según energía acumulada

**Pasivas:**
- **Maestro del Bijon**: Acumula energía especial, sobrecarga a los 100 puntos
- **Viento Gélido**: 35% chance de drenar energía enemiga

## Implementación Técnica

### Carga Dinámica de Personajes

```javascript
// El sistema carga automáticamente el módulo correcto
const character = await CharacterLoader.loadCharacter(characterData);
```

### Ejecución de Ataques

```javascript
// Cada ataque se ejecuta usando el módulo específico del personaje
const result = character.attacks.basic.execute(target);
```

### Sistema de Efectos

Los personajes pueden aplicar efectos especiales:
- Sangrado (DoT)
- Congelamiento (disable)
- Marcas elementales (debuffs)
- Buffs de clan específicos

## Balance y Modificaciones

### Fácil Balanceado
Cada personaje tiene sus multiplicadores y valores independientes:

```javascript
// Ejemplo de modificación de balance
attacks: {
    ultimate: {
        energyCost: 70,    // Fácil de ajustar
        multiplier: 3.5,   // Modificar daño
        critChance: 50     // Ajustar probabilidades
    }
}
```

### Agregar Nuevos Personajes

1. Crear nuevo archivo en `characters/`
2. Extender la clase `Character`
3. Implementar `initializeAttacks()` y `initializePassives()`
4. Agregar al `CharacterFactory.characterMap`

```javascript
// Ejemplo de nuevo personaje
export class NuevoPersonaje extends Character {
    initializeAttacks() {
        return {
            // Definir ataques únicos
        };
    }
    
    initializePassives() {
        return [
            // Definir pasivas únicas
        ];
    }
}
```

## Beneficios del Sistema

1. **Modularidad**: Cada personaje es independiente
2. **Escalabilidad**: Fácil agregar nuevos personajes
3. **Mantenibilidad**: Cambios aislados por personaje
4. **Balance**: Ajustes individuales sin afectar otros
5. **Funcionalidades Únicas**: Cada personaje tiene mecánicas distintivas

## UI Dinámica

El sistema actualiza automáticamente la interfaz según el personaje:
- Indicadores específicos (Furia, Escudo, Bijon)
- Nombres de ataques personalizados
- Efectos visuales únicos
- Información de clan y rareza

## Debug y Testing

Funciones de debug disponibles en `window.EinherjjDebug`:

```javascript
// Acceder al personaje actual
EinherjjDebug.champion()

// Recargar el personaje
EinherjjDebug.reloadCharacter()

// Ver estado del enemigo
EinherjjDebug.enemy()
```

## Próximas Mejoras

- [ ] Sistema de combos entre ataques
- [ ] Mecánicas de equipo/armas
- [ ] Evoluciones de personajes
- [ ] Torneos PvP
- [ ] Sistema de elementos/resistencias avanzado
