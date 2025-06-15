// Test básico del sistema modular
// Este archivo puede ser usado para verificar que todo funciona correctamente

async function testModularSystem() {
    console.log('🧪 Iniciando tests del sistema modular...');
    
    try {
        // Test 1: Importar módulos
        const { CharacterLoader, CHARACTER_CONFIG } = await import('./characters/index.js');
        console.log('✅ Módulos importados correctamente');
        
        // Test 2: Datos de prueba
        const testData = {
            id: 1,
            name: 'Shuna Shieda',
            title: 'La Furia de los Shiedas',
            description: 'Test character',
            image: 'shuna.jpg',
            rarity: 'legendary',
            attack_min: 120,
            attack_max: 180,
            max_health: 950,
            armor: 85,
            defense_reduction: 75,
            elemental_resistance: 180
        };
        
        // Test 3: Crear personaje
        const character = await CharacterLoader.loadCharacter(testData);
        console.log('✅ Personaje creado:', character.name);
        
        // Test 4: Verificar ataques
        const attacks = Object.keys(character.attacks);
        console.log('✅ Ataques disponibles:', attacks);
        
        // Test 5: Verificar pasivas
        console.log('✅ Pasivas:', character.passives.map(p => p.name));
        
        // Test 6: Verificar UI data
        const displayData = character.getDisplayData();
        console.log('✅ Display data generado');
        
        // Test 7: Simulación de ataque
        const mockTarget = {
            health: 100,
            maxHealth: 100,
            armor: 50,
            activeEffects: [],
            takeDamage(dmg) { this.health -= dmg; return this.health <= 0; },
            addEffect(effect) { this.activeEffects.push(effect); },
            removeEffect(name) { this.activeEffects = this.activeEffects.filter(e => e.name !== name); },
            hasEffect(name) { return this.activeEffects.some(e => e.name === name); },
            applyDefensivePassives(dmg) { return dmg; },
            isAlive() { return this.health > 0; }
        };
        
        const attackResult = character.attacks.basic.execute(mockTarget);
        console.log('✅ Ataque simulado:', attackResult);
        
        console.log('🎉 Todos los tests pasaron correctamente!');
        return true;
        
    } catch (error) {
        console.error('❌ Error en tests:', error);
        return false;
    }
}

// Test de todos los personajes
async function testAllCharacters() {
    console.log('🧪 Testeando todos los personajes...');
    
    const charactersData = [
        {
            id: 1,
            name: 'Shuna Shieda',
            title: 'La Furia de los Shiedas',
            description: 'Test character',
            image: 'shuna.jpg',
            rarity: 'legendary',
            attack_min: 120,
            attack_max: 180,
            max_health: 950,
            armor: 85,
            defense_reduction: 75,
            elemental_resistance: 180
        },
        {
            id: 2,
            name: 'Ozen Kimura',
            title: 'La Muralla Inamovible',
            description: 'Test character',
            image: 'ozen.jpg',
            rarity: 'epic',
            attack_min: 200,
            attack_max: 280,
            max_health: 1200,
            armor: 150,
            defense_reduction: 120,
            elemental_resistance: 90
        },
        {
            id: 3,
            name: 'Xair Chikyu',
            title: 'El Maestro del Bijon',
            description: 'Test character',
            image: 'xair.png',
            rarity: 'rare',
            attack_min: 160,
            attack_max: 240,
            max_health: 800,
            armor: 60,
            defense_reduction: 45,
            elemental_resistance: 250
        }
    ];
    
    try {
        const { CharacterLoader } = await import('./characters/index.js');
        
        for (const data of charactersData) {
            const character = await CharacterLoader.loadCharacter(data);
            console.log(`✅ ${character.name} (${character.constructor.name})`);
            console.log(`   Ataques: ${Object.keys(character.attacks).join(', ')}`);
            console.log(`   Pasivas: ${character.passives.length}`);
        }
        
        console.log('🎉 Todos los personajes funcionan correctamente!');
        return true;
        
    } catch (error) {
        console.error('❌ Error testando personajes:', error);
        return false;
    }
}

// Hacer disponibles las funciones para testing manual
if (typeof window !== 'undefined') {
    window.testModularSystem = testModularSystem;
    window.testAllCharacters = testAllCharacters;
    console.log('🔧 Funciones de test disponibles: testModularSystem(), testAllCharacters()');
}

export { testModularSystem, testAllCharacters };
