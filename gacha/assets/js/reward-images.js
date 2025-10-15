/* ====================================
   CONFIGURACIÓN DE IMÁGENES DE RECOMPENSAS
   Einherjer Blitz 3.0 - Sistema de Recompensas
   ==================================== */

const REWARD_IMAGES = {
    
    // Terrenos Únicos
    'terrains': {
        // Terrenos de Franquicias
        'Hipódromo Valhalla (Uma Musume)': 'assets/images/rewards/terrains/hipodromo_valhalla.jpg',
        'Krypton (DC Comics)': 'assets/images/rewards/terrains/krypton.jpg',
        'Chaldea (Fate)': 'assets/images/rewards/terrains/chaldea.jpg',
        'Skypeia (One Piece)': 'assets/images/rewards/terrains/skypeia.jpg',
        'Academia de Héroes (Boku No Hero)': 'assets/images/rewards/terrains/academia_heroes.jpg',
        'Negocio Devil May Cry (DMC)': 'assets/images/rewards/terrains/negocio_dmc.jpg',
        'Atlantis (DC Comics)': 'assets/images/rewards/terrains/atlantis.jpg',
        'Torre de los Vengadores (Marvel)': 'assets/images/rewards/terrains/torre_vengadores.jpg',
        'Fundación SCP': 'assets/images/rewards/terrains/fundacion_scp.jpg',
        'Hallownest (Hollow Knight)': 'assets/images/rewards/terrains/hallownest.jpg',
        'Apokolips (DC Comics)': 'assets/images/rewards/terrains/apokolips.jpg',
        
        // Objetos Especiales
        'Extensión de Terreno': 'assets/images/rewards/terrains/extension_terreno.jpg',
        'Dad Key': 'assets/images/rewards/terrains/dad_key.jpg',
    
    },
    
    // Comics que Inspiran
    'comics': {
        // Recursos Comunes
        '250 Esencias Azules': 'assets/images/rewards/comics/250_esencias_azules.jpg',
        
        // Héroes Raros
        'Spider-Man': 'assets/images/rewards/comics/spider_man.jpg',
        'Joker': 'assets/images/rewards/comics/joker.jpg',
        'Moon Knight': 'assets/images/rewards/comics/moon_knight.jpg',
        'Black Panther': 'assets/images/rewards/comics/black_panther.jpg',
        
        // Héroes Épicos
        'Batman': 'assets/images/rewards/comics/batman.jpg',
        'Captain America': 'assets/images/rewards/comics/captain_america.jpg',
        'Iron Man': 'assets/images/rewards/comics/iron_man.jpg',
        'Wonder Woman': 'assets/images/rewards/comics/wonder_woman.jpg',
        'Superman New 52': 'assets/images/rewards/comics/superman_new_52.jpg',
        
        // Villanos Legendarios
        'Thanos': 'assets/images/rewards/comics/thanos.jpg',
        'Lex Luthor': 'assets/images/rewards/comics/lex_luthor.jpg',
        'Flash': 'assets/images/rewards/comics/flash.jpg',
        'Reverse Flash': 'assets/images/rewards/comics/reverse_flash.jpg',
        'Extensión de Terreno': 'assets/images/rewards/comics/extension_terreno.jpg',
        
        // Entidades Míticas
        'Galactus': 'assets/images/rewards/comics/galactus.jpg',
        'Darkseid': 'assets/images/rewards/comics/darkseid.jpg',
        'Thanos Regulador Astral': 'assets/images/rewards/comics/thanos_regulador_astral.jpg',
        
        // Ultra Míticos
        'Lucifer Morningstar': 'assets/images/rewards/comics/lucifer_morningstar.jpg',
        'EL Tribunal Viviente': 'assets/images/rewards/comics/el_tribunal_viviente.jpg',
        'El Beyonder': 'assets/images/rewards/comics/el_beyonder.jpg',
        'Hombre Molécula': 'assets/images/rewards/comics/hombre_molecula.jpg',
        'Wally West: Silla de Mobius': 'assets/images/rewards/comics/wally_west_silla_mobius.jpg'
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
        'resources': 'assets/images/rewards/special/resources.jpg',
        'crystal': 'assets/images/rewards/special/crystal.jpg',
        'gem': 'assets/images/rewards/special/gem.jpg',
        'diamond': 'assets/images/rewards/special/diamond.jpg',
        'terrain': 'assets/images/rewards/special/terrain.jpg',
        'invocation': 'assets/images/rewards/special/invocation.jpg',
        'artifact': 'assets/images/rewards/special/artifact.jpg',
        'accessory': 'assets/images/rewards/special/accessory.jpg'
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

// Normalización para evitar problemas por acentos, mayúsculas o puntuación
function normalizeKey(s) {
    if (!s) return '';
    // Convertir a minúsculas, quitar acentos y caracteres no alfanuméricos
    return s.toString().toLowerCase()
        .normalize('NFD').replace(/\p{Diacritic}/gu, '')
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

// Versión que intenta coincidencias normalizadas cuando la búsqueda exacta falla
function getRewardImageNormalized(rewardName, chestType, rewardType) {
    // Intento exacto primero
    const exact = getRewardImage(rewardName, chestType, rewardType);
    if (exact && exact !== 'assets/images/rewards/special/unknown.jpg') return exact;

    const normName = normalizeKey(rewardName);

    // Buscar en el chestType original
    if (REWARD_IMAGES[chestType]) {
        for (const key in REWARD_IMAGES[chestType]) {
            if (normalizeKey(key) === normName) return REWARD_IMAGES[chestType][key];
        }
    }

    // Buscar en todas las categorías
    for (const category in REWARD_IMAGES) {
        if (category === 'default') continue;
        for (const key in REWARD_IMAGES[category]) {
            if (normalizeKey(key) === normName) return REWARD_IMAGES[category][key];
        }
    }

    // Finalmente, usar default por tipo
    if (REWARD_IMAGES.default[rewardType]) return REWARD_IMAGES.default[rewardType];

    return 'assets/images/rewards/special/unknown.jpg';
}

window.getRewardImageNormalized = getRewardImageNormalized;
