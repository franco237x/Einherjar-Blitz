// Script para el menú principal de Einherjar Cards

document.addEventListener('DOMContentLoaded', () => {
    // Agregar efecto de sonido al hacer hover (opcional)
    const menuOptions = document.querySelectorAll('.menu-option:not(.option-locked)');
    
    menuOptions.forEach((option, index) => {
        // Efecto de hover con pequeña vibración
        option.addEventListener('mouseenter', () => {
            option.style.animation = 'none';
            setTimeout(() => {
                option.style.animation = '';
            }, 10);
        });
        
        // Efecto de click
        option.addEventListener('click', (e) => {
            // Agregar efecto de ripple
            const ripple = document.createElement('div');
            ripple.className = 'ripple-effect';
            
            const rect = option.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            
            option.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
    
    // Efecto de intento de click en opción bloqueada
    const lockedOption = document.querySelector('.option-locked');
    if (lockedOption) {
        lockedOption.addEventListener('click', () => {
            // Shake animation
            lockedOption.style.animation = 'shake 0.5s';
            
            // Mostrar mensaje temporal
            const badge = lockedOption.querySelector('.locked-badge');
            const originalHTML = badge.innerHTML;
            badge.innerHTML = '<i class="fas fa-lock"></i> Disponible pronto';
            badge.style.background = '#ff5722';
            
            setTimeout(() => {
                badge.innerHTML = originalHTML;
                badge.style.background = '';
                lockedOption.style.animation = '';
            }, 1500);
        });
    }
    
    // Agregar estadísticas (simuladas por ahora)
    addGameStats();
});

// Función para agregar estadísticas del juego (para futuro)
function addGameStats() {
    // Aquí podrías hacer una llamada AJAX para obtener estadísticas reales
    // Por ahora solo preparamos la estructura
    console.log('Einherjar Cards - Menu cargado');
}

// CSS adicional para efectos
const style = document.createElement('style');
style.textContent = `
    .ripple-effect {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.3);
        transform: scale(0);
        animation: ripple 0.6s ease-out;
        pointer-events: none;
    }
    
    @keyframes ripple {
        to {
            transform: scale(2);
            opacity: 0;
        }
    }
    
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
        20%, 40%, 60%, 80% { transform: translateX(10px); }
    }
`;
document.head.appendChild(style);
