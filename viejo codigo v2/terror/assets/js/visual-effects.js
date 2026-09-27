// Efectos visuales para el juego AM
export class VisualEffects {
    constructor() {
        this.glitchInterval = null;
        this.glitchIntensity = 1;
    }
    
    startGlitchEffect() {
        const overlay = document.getElementById('glitch-overlay');
        
        this.glitchInterval = setInterval(() => {
            if (Math.random() < 0.1 * this.glitchIntensity) {
                this.glitchScreen();
            }
        }, 2000);
    }
    
    glitchScreen() {
        const overlay = document.getElementById('glitch-overlay');
        overlay.style.display = 'block';
        
        // Efecto de glitch aleatorio
        const glitchTypes = ['glitch-1', 'glitch-2', 'glitch-3'];
        const randomGlitch = glitchTypes[Math.floor(Math.random() * glitchTypes.length)];
        
        overlay.className = randomGlitch;
        
        setTimeout(() => {
            overlay.style.display = 'none';
            overlay.className = '';
        }, 100 + Math.random() * 200);
        
        // Sonido de glitch
        const glitchSound = document.getElementById('glitch-sound');
        if (glitchSound) {
            glitchSound.currentTime = 0;
            glitchSound.volume = 0.2;
            glitchSound.play().catch(() => {});
        }
    }
    
    startScanLine() {
        const scanLine = document.getElementById('scan-line');
        scanLine.style.display = 'block';
    }
    
    intensifyGlitch() {
        this.glitchIntensity = 2.5;
    }
    
    glitchText(element) {
        const originalText = element.textContent;
        const glitchChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
        
        let glitchedText = '';
        for (let char of originalText) {
            if (Math.random() < 0.3) {
                glitchedText += glitchChars[Math.floor(Math.random() * glitchChars.length)];
            } else {
                glitchedText += char;
            }
        }
        
        element.textContent = glitchedText;
        
        setTimeout(() => {
            element.textContent = originalText;
        }, 50);
    }
    
    screenShake() {
        const container = document.getElementById('game-container');
        container.classList.add('shake');
        
        setTimeout(() => {
            container.classList.remove('shake');
        }, 500);
    }
    
    redFlash() {
        const overlay = document.getElementById('glitch-overlay');
        overlay.style.backgroundColor = 'rgba(255, 0, 0, 0.5)';
        overlay.style.display = 'block';
        
        setTimeout(() => {
            overlay.style.display = 'none';
            overlay.style.backgroundColor = '';
        }, 200);
    }
    
    sanityLossEffect() {
        const container = document.getElementById('game-container');
        
        // Distorsión visual
        container.style.filter = 'blur(5px) hue-rotate(180deg)';
        this.screenShake();
        
        // Múltiples glitches rápidos
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                this.glitchScreen();
            }, i * 100);
        }
        
        setTimeout(() => {
            container.style.filter = '';
        }, 1000);
    }
    
    goodEndingEffect() {
        const container = document.getElementById('game-container');
        
        // Fade to white
        const overlay = document.getElementById('glitch-overlay');
        overlay.style.backgroundColor = 'rgba(255, 255, 255, 1)';
        overlay.style.display = 'block';
        overlay.style.transition = 'opacity 3s';
        overlay.style.opacity = '1';
        
        setTimeout(() => {
            overlay.style.opacity = '0';
            setTimeout(() => {
                overlay.style.display = 'none';
                overlay.style.transition = '';
                overlay.style.backgroundColor = '';
            }, 3000);
        }, 100);
        
        // Detener efectos de glitch
        clearInterval(this.glitchInterval);
        
        // Cambiar a colores más cálidos
        container.style.transition = 'filter 5s';
        container.style.filter = 'sepia(0.3) brightness(1.2)';
    }
    
    badEndingEffect() {
        const container = document.getElementById('game-container');
        
        // Intensificar glitches
        this.glitchIntensity = 5;
        
        // Efecto de pesadilla
        let distortionLevel = 0;
        const distortionInterval = setInterval(() => {
            distortionLevel += 0.1;
            container.style.filter = `
                hue-rotate(${distortionLevel * 360}deg) 
                saturate(${1 + distortionLevel}) 
                contrast(${1 + distortionLevel * 0.5})
            `;
            
            this.glitchScreen();
            
            if (distortionLevel >= 1) {
                clearInterval(distortionInterval);
                
                // Fade to red
                const overlay = document.getElementById('glitch-overlay');
                overlay.style.backgroundColor = 'rgba(139, 0, 0, 0.9)';
                overlay.style.display = 'block';
            }
        }, 200);
    }
    
    secretEndingEffect() {
        const container = document.getElementById('game-container');
        
        // Efecto de fusión - colores alternantes
        let hue = 0;
        const fusionInterval = setInterval(() => {
            hue += 5;
            container.style.filter = `hue-rotate(${hue}deg) brightness(1.2)`;
        }, 50);
        
        setTimeout(() => {
            clearInterval(fusionInterval);
            
            // Estabilizar en colores púrpura/azul
            container.style.transition = 'filter 2s';
            container.style.filter = 'hue-rotate(270deg) saturate(1.5) brightness(1.1)';
        }, 3000);
        
        // Glitches espaciados
        for (let i = 0; i < 10; i++) {
            setTimeout(() => {
                this.glitchScreen();
            }, i * 300);
        }
    }
    
    trueEndingEffect() {
        const container = document.getElementById('game-container');
        const overlay = document.getElementById('glitch-overlay');
        
        // Serie de revelaciones visuales
        
        // 1. Glitch masivo
        for (let i = 0; i < 20; i++) {
            setTimeout(() => {
                this.glitchScreen();
            }, i * 50);
        }
        
        setTimeout(() => {
            // 2. Inversión de colores
            container.style.filter = 'invert(1)';
            
            setTimeout(() => {
                // 3. Matrix effect
                overlay.style.background = 'repeating-linear-gradient(0deg, #000 0px, #0f0 2px, #000 4px)';
                overlay.style.display = 'block';
                overlay.style.opacity = '0.3';
                
                setTimeout(() => {
                    // 4. Estático final
                    overlay.style.background = `
                        repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,0,0,0.1) 2px, rgba(255,0,0,0.1) 4px),
                        repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,255,0,0.1) 2px, rgba(0,255,0,0.1) 4px)
                    `;
                    container.style.filter = 'contrast(1.5) saturate(0)';
                }, 2000);
            }, 1000);
        }, 1000);
        
        // Texto glitcheado constante
        setInterval(() => {
            const narrativeText = document.getElementById('narrative-text');
            if (narrativeText) {
                this.glitchText(narrativeText);
            }
        }, 500);
    }
    
    typewriterGlitch() {
        // Glitch ocasional durante el efecto typewriter
        if (Math.random() < 0.05) {
            this.glitchScreen();
        }
    }
}
