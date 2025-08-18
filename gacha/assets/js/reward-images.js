/* ====================================
   CONFIGURACIÓN DE IMÁGENES DE RECOMPENSAS
   Einherjer Blitz 3.0 - Sistema de Recompensas
   ==================================== */

const REWARD_IMAGES = {
    // Uma Musume Characters
    'uma_musume': {
        // Comunes
        'Haru Urara': 'assets/images/rewards/uma_musume/haru_urara.jpg',
        'Mejiro Ryan': 'assets/images/rewards/uma_musume/mejiro_ryan.jpg',
        'Seiun Sky': 'assets/images/rewards/uma_musume/seiun_sky.jpg',
        'Hishi Amazon': 'assets/images/rewards/uma_musume/hishi_amazon.jpg',
        'Sweep Tosho': 'assets/images/rewards/uma_musume/sweep_tosho.jpg',
        
        // Raros
        'Rice Shower': 'assets/images/rewards/uma_musume/rice_shower.jpg',
        'Fine Motion': 'assets/images/rewards/uma_musume/fine_motion.jpg',
        'Mejiro Ardan': 'assets/images/rewards/uma_musume/mejiro_ardan.jpg',
        'Inari One': 'assets/images/rewards/uma_musume/inari_one.jpg',
        'Meisho Tebesa': 'assets/images/rewards/uma_musume/meisho_tebesa.jpg',
        
        // Épicos
        'Gold City': 'assets/images/rewards/uma_musume/gold_city.jpg',
        'Super Creek': 'assets/images/rewards/uma_musume/super_creek.jpg',
        'Agnes Tachyon': 'assets/images/rewards/uma_musume/agnes_tachyon.jpg',
        'Manhattan Cafe': 'assets/images/rewards/uma_musume/manhattan_cafe.jpg',
        'Air Groove': 'assets/images/rewards/uma_musume/air_groove.jpg',
        
        // Legendarios
        'Special Week': 'assets/images/rewards/uma_musume/special_week.jpg',
        'Silence Suzuka': 'assets/images/rewards/uma_musume/silence_suzuka.jpg',
        'Tokai Teio': 'assets/images/rewards/uma_musume/tokai_teio.jpg',
        'Vodka': 'assets/images/rewards/uma_musume/vodka.jpg',
        'Daiwa Scarlet': 'assets/images/rewards/uma_musume/daiwa_scarlet.jpg',
        
        // Súper Raros
        'Oguri Cap': 'assets/images/rewards/uma_musume/oguri_cap.jpg',
        'Symboli Rudolf': 'assets/images/rewards/uma_musume/symboli_rudolf.jpg',
        'Mejiro McQueen': 'assets/images/rewards/uma_musume/mejiro_mcqueen.jpg',
        'Grass Wonder': 'assets/images/rewards/uma_musume/grass_wonder.jpg',
        'Maruzensky': 'assets/images/rewards/uma_musume/maruzensky.jpg',
        
        // Ultra Raros
        'Narita Brian': 'assets/images/rewards/uma_musume/narita_brian.jpg',
        'Tamamo Cross': 'assets/images/rewards/uma_musume/tamamo_cross.jpg',
        'Eishin Flash': 'assets/images/rewards/uma_musume/eishin_flash.jpg',
        'Gold Ship': 'assets/images/rewards/uma_musume/gold_ship.jpg',

        // Míticos
        'Kitasan Black': 'assets/images/rewards/uma_musume/kitasan_black.jpg',
        'Satono Diamond': 'assets/images/rewards/uma_musume/satono_diamond.jpg',
        'Duramente': 'assets/images/rewards/uma_musume/duramente.jpg',
        'Sakura Chiyono O': 'assets/images/rewards/uma_musume/sakura_chiyono_o.jpg',
        
        // Especiales
        'Zanahoria Dorada': 'assets/images/rewards/special/zanahoria_dorada.jpg'
    },
    
    // Warhammer 40K
    'warhammer': {
        // Lugares
        '100 Esencias Azules': 'assets/images/rewards/warhammer/100_esencias_azules.jpg',
        'Espada de Khaine': 'assets/images/rewards/warhammer/espada_de_khaine.jpg',
        'Drachnyen': 'assets/images/rewards/warhammer/drachnyen.jpg',
        
        // Primarcas
        'Roboute Guilliman': 'assets/images/rewards/warhammer/roboute_guilliman.jpg',
        'Sanguinius': 'assets/images/rewards/warhammer/sanguinius.jpg',
        'Horus Lupercal': 'assets/images/rewards/warhammer/horus_lupercal.jpg',
        'Trono Dorado': 'assets/images/rewards/warhammer/trono_dorado.jpg',
        'Khorne': 'assets/images/rewards/warhammer/khorne.jpg',
        'Nurgle': 'assets/images/rewards/warhammer/nurgle.jpg',
        'Tzeentch': 'assets/images/rewards/warhammer/tzeentch.jpg',
        'Slaanesh': 'assets/images/rewards/warhammer/slaanesh.jpg',
        
        // El Emperador
        'El Emperador de la Humanidad': 'assets/images/rewards/warhammer/emperador.jpg'
    },
    
    // Imágenes por defecto según tipo
    'default': {
        'currency': 'assets/images/rewards/special/coins.jpg',
        'item': 'assets/images/rewards/special/item.jpg',
        'card': 'assets/images/rewards/special/card.jpg',
        'special': 'assets/images/rewards/special/special.jpg',
        'ammo': 'assets/images/rewards/special/ammo.jpg',
        'weapon': 'assets/images/rewards/special/weapon.jpg',
        'armor': 'assets/images/rewards/special/armor.jpg',
        'relic': 'assets/images/rewards/special/relic.jpg',
        'blessing': 'assets/images/rewards/special/blessing.jpg',
        'resource': 'assets/images/rewards/special/resource.jpg',
        'crystal': 'assets/images/rewards/special/crystal.jpg',
        'gem': 'assets/images/rewards/special/gem.jpg',
        'diamond': 'assets/images/rewards/special/diamond.jpg',
        'terrain': 'assets/images/rewards/special/terrain.jpg'
    }
};

// Función para obtener la imagen de una recompensa
function getRewardImage(rewardName, chestType, rewardType) {
    // Primero buscar por tipo de cofre específico
    if (REWARD_IMAGES[chestType] && REWARD_IMAGES[chestType][rewardName]) {
        return REWARD_IMAGES[chestType][rewardName];
    }
    
    // Si no se encuentra, usar imagen por defecto según tipo
    if (REWARD_IMAGES.default[rewardType]) {
        return REWARD_IMAGES.default[rewardType];
    }
    
    // Imagen de fallback
    return 'assets/images/rewards/special/unknown.jpg';
}

// Función para precargar una imagen
function preloadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => {
            console.warn(`Error loading image: ${src}`);
            // Crear imagen de fallback con canvas
            const fallbackImg = createFallbackImage();
            resolve(fallbackImg);
        };
        img.src = src;
    });
}

// Función para crear imagen de fallback con canvas
function createFallbackImage() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 512;
    canvas.height = 512;
    
    // Fondo degradado
    const gradient = ctx.createLinearGradient(0, 0, 512, 512);
    gradient.addColorStop(0, '#2a2a3e');
    gradient.addColorStop(1, '#1a1a2e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);
    
    // Borde
    ctx.strokeStyle = '#4a4a6e';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, 508, 508);
    
    // Icono de interrogación
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 200px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('?', 256, 256);
    
    // Convertir canvas a imagen
    const img = new Image();
    img.src = canvas.toDataURL('image/png');
    return img;
}

// Hacer disponible globalmente
window.REWARD_IMAGES = REWARD_IMAGES;
window.getRewardImage = getRewardImage;
window.preloadImage = preloadImage;
