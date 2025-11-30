<?php
/**
 * Character Stats Helper - Einherjar Blitz Online Mode
 * Provides character statistics and ability information
 */

class CharacterStats {
    /**
     * Get base stats for a character by ID
     */
    public static function getCharacterStats($characterId) {
        $characters = [
            1 => [ // Shuna Shieda
                'id' => 1,
                'name' => 'Shuna Shieda',
                'element' => 'Devastación',
                'rarity' => 'legendary',
                'attack_min' => 135,
                'attack_max' => 170,
                'health_max' => 1100,
                'armor' => 20,
                'defense_reduction' => 45,
                'elemental_resistance' => 60,
                'energy_max' => 100,
                'special_cost' => 40,
                'special_name' => 'Despertar Primordial',
                'passive' => null
            ],
            2 => [ // Ozen Kimura
                'id' => 2,
                'name' => 'Ozen Kimura',
                'element' => 'Chakra',
                'rarity' => 'epic',
                'attack_min' => 100,
                'attack_max' => 170,
                'health_max' => 1200,
                'armor' => 30,
                'defense_reduction' => 5,
                'elemental_resistance' => 65,
                'energy_max' => 100,
                'special_cost' => 55,
                'special_name' => 'Bijudama Definitivo',
                'passive' => null
            ],
            3 => [ // Xair Chikyu
                'id' => 3,
                'name' => 'Xair Chikyu',
                'element' => 'Hielo',
                'rarity' => 'rare',
                'attack_min' => 105,
                'attack_max' => 135,
                'health_max' => 975,
                'armor' => 18,
                'defense_reduction' => 15,
                'elemental_resistance' => 30,
                'energy_max' => 100,
                'special_cost' => 40,
                'special_name' => 'Activación Molecular',
                'passive' => null
            ],
            4 => [ // Nathan Doffens
                'id' => 4,
                'name' => 'Nathan Doffens',
                'element' => 'Rayo',
                'rarity' => 'epic',
                'attack_min' => 100,
                'attack_max' => 150,
                'health_max' => 1000,
                'armor' => 17,
                'defense_reduction' => 30,
                'elemental_resistance' => 50,
                'energy_max' => 100,
                'special_cost' => 30,
                'special_name' => 'Modo Kami',
                'passive' => 'dodge' // 30% chance to dodge
            ],
            5 => [ // Zack Hisoka
                'id' => 5,
                'name' => 'Zack Hisoka',
                'element' => 'Ninguno',
                'rarity' => 'legendary',
                'attack_min' => 50,
                'attack_max' => 250,
                'health_max' => 1000,
                'armor' => 20,
                'defense_reduction' => 85,
                'elemental_resistance' => 35,
                'energy_max' => 100,
                'special_cost' => 40,
                'special_name' => 'Omniscio',
                'passive' => 'damage_reduction_40' // 40% damage reduction (NERFEADO)
            ],
            6 => [ // Raiden
                'id' => 6,
                'name' => 'Raiden',
                'element' => 'Oscuridad',
                'rarity' => 'epic',
                'attack_min' => 130,
                'attack_max' => 160,
                'health_max' => 1050,
                'armor' => 20,
                'defense_reduction' => 25,
                'elemental_resistance' => 40,
                'energy_max' => 100,
                'special_cost' => 40,
                'special_name' => 'Resurrección de Sombra',
                'passive' => 'shadow_shield', // Can have shield
                'max_shield' => 300
            ],
            7 => [ // Yozora
                'id' => 7,
                'name' => 'Yozora',
                'element' => 'Originium',
                'rarity' => 'legendary',
                'attack_min' => 160,
                'attack_max' => 200,
                'health_max' => 1300,
                'armor' => 35,
                'defense_reduction' => 20,
                'elemental_resistance' => 70,
                'energy_max' => 100,
                'special_cost' => 35,
                'special_name' => 'Apocalipsis Elemental de Originium',
                'passive' => 'elemental_reduction_30' // Reduce daño elemental en 30
            ]
        ];
        
        return $characters[$characterId] ?? null;
    }
    
    /**
     * Calculate attack damage for a character
     */
    public static function calculateAttackDamage($characterStats, $statusEffects = []) {
        $damage = rand($characterStats['attack_min'], $characterStats['attack_max']);
        $isCritical = false;
        
        // Nathan: Critical chance
        if ($characterStats['id'] == 4 && rand(1, 100) <= 25) {
            $damage = floor($damage * 1.8);
            $isCritical = true;
        }
        
        // Zack: 50/50 between min and max (Phase Induction)
        if ($characterStats['id'] == 5) {
            $damage = (rand(0, 1) == 0) ? $characterStats['attack_min'] : $characterStats['attack_max'];
        }
        
        // Apply status effect multipliers
        foreach ($statusEffects as $effect) {
            if (isset($effect['type'])) {
                switch ($effect['type']) {
                    case 'shuna_ultimate':
                        $damage *= 2; // Shuna doubles stats
                        break;
                    case 'nathan_ultimate':
                        $damage *= 2; // Nathan doubles attack
                        break;
                    case 'xair_molecular_cut':
                        $damage *= 3; // Xair triples damage
                        break;
                    case 'raiden_shadow_resurrection':
                        $damage *= 2; // Raiden doubles damage
                        break;
                }
            }
        }
        
        return [
            'damage' => floor($damage),
            'critical' => $isCritical
        ];
    }
    
    /**
     * Calculate damage taken considering armor, passives, and shield
     */
    public static function calculateDamageTaken($damage, $characterStats, $statusEffects = [], &$playerState = null) {
        // Nathan: Dodge chance
        if ($characterStats['id'] == 4) {
            $dodgeChance = min(30, ($characterStats['speed'] ?? 95) / 100 * 30);
            if (rand(1, 100) <= $dodgeChance) {
                return 0; // Dodged
            }
        }
        
        // Zack: 40% passive damage reduction (NERFEADO)
        if ($characterStats['id'] == 5) {
            $damage *= 0.6;
        }
        
        // Apply armor reduction
        $armorReduction = $characterStats['armor'] / 100;
        $damage = $damage * (1 - $armorReduction);
        
        // Apply status effect modifiers
        foreach ($statusEffects as $effect) {
            if (isset($effect['type'])) {
                switch ($effect['type']) {
                    case 'nathan_ultimate':
                        $damage *= 0.5; // Nathan reduces damage by 50%
                        break;
                    case 'defending':
                        $damage *= 0.5; // Defense reduces damage by 50%
                        break;
                }
            }
        }
        
        $finalDamage = max(1, floor($damage));
        
        // Raiden: Shield absorption (if playerState is provided)
        if ($playerState !== null && isset($playerState['shield']) && $playerState['shield'] > 0) {
            if ($finalDamage >= $playerState['shield']) {
                // Damage breaks shield and affects health
                $finalDamage -= $playerState['shield'];
                $playerState['shield'] = 0;
            } else {
                // Shield absorbs all damage
                $playerState['shield'] -= $finalDamage;
                $finalDamage = 0; // No health damage
            }
        }
        
        return $finalDamage;
    }
    
    /**
     * Execute special ability for a character
     */
    public static function executeSpecialAbility($characterId, &$playerState, &$opponentState) {
        switch ($characterId) {
            case 1: // Shuna Shieda - Despertar Primordial
                return self::shunaSpecial($playerState, $opponentState);
            
            case 2: // Ozen Kimura - Bijudama Definitivo
                return self::ozenSpecial($playerState, $opponentState);
            
            case 3: // Xair Chikyu - Activación Molecular
                return self::xairSpecial($playerState, $opponentState);
            
            case 4: // Nathan Doffens - Modo Kami
                return self::nathanSpecial($playerState, $opponentState);
            
            case 5: // Zack Hisoka - Omniscio
                return self::zackSpecial($playerState, $opponentState);
            
            case 6: // Raiden - Resurrección de Sombra
                return self::raidenSpecial($playerState, $opponentState);
            
            case 7: // Yozora - Apocalipsis Elemental de Originium
                return self::yozoraSpecial($playerState, $opponentState);
            
            default:
                return [
                    'success' => false,
                    'message' => 'Habilidad especial no encontrada'
                ];
        }
    }
    
    private static function shunaSpecial(&$playerState, &$opponentState) {
        // Duplicar estadísticas por 3 turnos y aplicar quemadura (NERFEADO)
        $playerState['statusEffects'][] = [
            'type' => 'shuna_ultimate',
            'duration' => 3,
            'statsMultiplier' => 2
        ];
        
        $opponentState['statusEffects'][] = [
            'type' => 'burn',
            'duration' => 3,
            'damagePerTurn' => 50
        ];
        
        return [
            'success' => true,
            'message' => 'Shuna despierta su poder primordial: duplica todas sus estadísticas por 3 turnos y aplica quemadura al enemigo (50 daño/turno)',
            'damage' => 0
        ];
    }
    
    private static function ozenSpecial(&$playerState, &$opponentState) {
        // Ataque masivo 250-300 + restaurar energía (NERFEADO)
        $damage = rand(250, 300);
        
        // Mark that energy should be restored (will be done in battle_session after consumption)
        return [
            'success' => true,
            'message' => "Ozen lanza un ataque devastador y restaura toda su energía",
            'damage' => $damage,
            'restoreEnergy' => true  // Flag to restore energy after consumption
        ];
    }
    
    private static function xairSpecial(&$playerState, &$opponentState) {
        // Activar Corte Molecular (3 turnos, recargable)
        $playerState['statusEffects'][] = [
            'type' => 'xair_molecular_cut',
            'duration' => 3,
            'damageMultiplier' => 3
        ];
        
        return [
            'success' => true,
            'message' => 'Xair activa su técnica molecular: triplicará el daño de sus ataques por 3 turnos',
            'damage' => 0
        ];
    }
    
    private static function nathanSpecial(&$playerState, &$opponentState) {
        // Modo Kami: 50% reducción daño + doble ataque por 3 turnos
        $playerState['statusEffects'][] = [
            'type' => 'nathan_ultimate',
            'duration' => 3,
            'damageReduction' => 50,
            'attackMultiplier' => 2
        ];
        
        return [
            'success' => true,
            'message' => 'Nathan entra en Modo Kami: recibe 50% menos daño y duplica su ataque por 3 turnos',
            'damage' => 0
        ];
    }
    
    private static function zackSpecial(&$playerState, &$opponentState) {
        // Omniscio: Efecto aleatorio
        $effects = [
            [
                'name' => 'Reducción de Defensa',
                'type' => 'debuff',
                'target' => 'enemy',
                'effect' => ['type' => 'defense_reduction', 'duration' => 3, 'value' => 30],
                'message' => 'La materia creada debilita las defensas del enemigo'
            ],
            [
                'name' => 'Regeneración de Energía',
                'type' => 'buff',
                'target' => 'self',
                'effect' => ['type' => 'energy_gain', 'value' => 35],
                'message' => 'La materia energética restaura la energía de Zack'
            ],
            [
                'name' => 'Aumento de Defensa',
                'type' => 'buff',
                'target' => 'self',
                'effect' => ['type' => 'defense_boost', 'duration' => 3, 'value' => 40],
                'message' => 'La materia protectora aumenta las defensas de Zack'
            ],
            [
                'name' => 'Quemadura Atómica',
                'type' => 'debuff',
                'target' => 'enemy',
                'effect' => ['type' => 'burn', 'duration' => 3, 'damagePerTurn' => 75],
                'message' => 'La materia inestable quema al enemigo a nivel atómico'
            ],
            [
                'name' => 'Reparación Molecular',
                'type' => 'heal',
                'target' => 'self',
                'effect' => ['type' => 'healing', 'value' => 250],
                'message' => 'La materia reparadora restaura la estructura molecular de Zack'
            ],
            [
                'name' => 'Desintegración Parcial',
                'type' => 'damage',
                'target' => 'enemy',
                'effect' => ['type' => 'pure_damage', 'value' => rand(200, 300)],
                'message' => 'La materia desintegradora causa daño directo al enemigo'
            ]
        ];
        
        $selectedEffect = $effects[array_rand($effects)];
        $result = [
            'success' => true,
            'message' => "Zack activa Omniscio: {$selectedEffect['message']}",
            'damage' => 0
        ];
        
        // Apply effect
        if ($selectedEffect['target'] == 'enemy') {
            if ($selectedEffect['type'] == 'damage') {
                $result['damage'] = $selectedEffect['effect']['value'];
            } else {
                $opponentState['statusEffects'][] = $selectedEffect['effect'];
            }
        } else {
            if ($selectedEffect['type'] == 'heal') {
                $playerState['health'] = min($playerState['maxHealth'], $playerState['health'] + $selectedEffect['effect']['value']);
                $result['healing'] = $selectedEffect['effect']['value'];
            } elseif ($selectedEffect['effect']['type'] == 'energy_gain') {
                $playerState['energy'] = min($playerState['maxEnergy'], $playerState['energy'] + $selectedEffect['effect']['value']);
                $result['energyGained'] = $selectedEffect['effect']['value'];
            } else {
                $playerState['statusEffects'][] = $selectedEffect['effect'];
            }
        }
        
        return $result;
    }
    
    private static function raidenSpecial(&$playerState, &$opponentState) {
        // Resurrección de Sombra: x2 daño + escudo de 300 por 5 turnos
        $playerState['statusEffects'][] = [
            'type' => 'raiden_shadow_resurrection',
            'duration' => 5,
            'damageMultiplier' => 2
        ];
        
        // Otorgar escudo de 300
        if (!isset($playerState['shield'])) {
            $playerState['shield'] = 0;
        }
        $playerState['shield'] = 300;
        
        return [
            'success' => true,
            'message' => 'Raiden invoca el poder de las sombras: duplica su daño y gana un escudo de 300 puntos por 5 turnos',
            'damage' => 0,
            'shieldGained' => 300
        ];
    }
    
    private static function yozoraSpecial(&$playerState, &$opponentState) {
        // Apocalipsis Elemental: 150 daño fijo + efecto elemental aleatorio
        $damage = 150;
        
        // Efectos elementales posibles
        $elementalEffects = [
            [
                'name' => 'Quemadura de Originium',
                'effect' => ['type' => 'burn', 'duration' => 3, 'damagePerTurn' => 25]
            ],
            [
                'name' => 'Congelación de Originium',
                'effect' => ['type' => 'freeze', 'duration' => 2, 'missChance' => 40]
            ],
            [
                'name' => 'Descarga de Originium',
                'effect' => ['type' => 'shock', 'duration' => 2, 'damagePerTurn' => 30]
            ],
            [
                'name' => 'Envenenamiento de Originium',
                'effect' => ['type' => 'poison', 'duration' => 4, 'damagePerTurn' => 20]
            ],
            [
                'name' => 'Debilidad de Originium',
                'effect' => ['type' => 'weakness', 'duration' => 3, 'damageReduction' => 30]
            ]
        ];
        
        $selectedEffect = $elementalEffects[array_rand($elementalEffects)];
        $opponentState['statusEffects'][] = $selectedEffect['effect'];
        
        return [
            'success' => true,
            'message' => "Yozora desata el Apocalipsis Elemental de Originium: {$selectedEffect['name']}!",
            'damage' => $damage
        ];
    }
    
    /**
     * Process status effects at end of turn
     */
    public static function processStatusEffects(&$state) {
        foreach (['player1', 'player2'] as $playerKey) {
            $newEffects = [];
            
            foreach ($state[$playerKey]['statusEffects'] as $effect) {
                // Apply damage over time effects
                if (isset($effect['type']) && $effect['type'] == 'burn' && isset($effect['damagePerTurn'])) {
                    $state[$playerKey]['health'] = max(0, $state[$playerKey]['health'] - $effect['damagePerTurn']);
                }
                
                // Decrease duration
                if (isset($effect['duration'])) {
                    $effect['duration']--;
                    if ($effect['duration'] > 0) {
                        $newEffects[] = $effect;
                    }
                }
            }
            
            $state[$playerKey]['statusEffects'] = $newEffects;
        }
    }
}
