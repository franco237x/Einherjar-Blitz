// Motor del juego AM - Allied Mastercomputer
import { StoryEngine } from './story-engine.js';
import { VisualEffects } from './visual-effects.js';

class AMGame {
    constructor() {
        this.progress = INITIAL_PROGRESS;
        this.playerName = USER_NAME || 'JUGADOR';
        this.storyEngine = new StoryEngine(this.playerName);
        this.visualEffects = new VisualEffects();
        
        this.sanity = parseInt(this.progress.sanity) || 100;
        this.trust = parseInt(this.progress.trust) || 50;
        this.chapter = parseInt(this.progress.chapter) || 1;
        
        this.init();
    }
    
    init() {
        this.updateStatusBars();
        this.updateTime();
        setInterval(() => this.updateTime(), 1000);
        
        // Iniciar efectos visuales
        this.visualEffects.startGlitchEffect();
        this.visualEffects.startScanLine();
        
        // Cargar capítulo actual
        this.loadChapter(this.chapter);
        
        // Efectos de sonido ambient
        const ambientSound = document.getElementById('ambient-sound');
        ambientSound.volume = 0.3;
        
        // Click para iniciar audio (políticas del navegador)
        document.addEventListener('click', () => {
            ambientSound.play().catch(() => {});
        }, { once: true });
    }
    
    updateTime() {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-US', { hour12: false });
        document.getElementById('system-time').textContent = timeStr;
        
        // Glitch aleatorio en el tiempo
        if (Math.random() < 0.05) {
            this.visualEffects.glitchText(document.getElementById('system-time'));
        }
    }
    
    updateStatusBars() {
        const sanityBar = document.getElementById('sanity-bar');
        const trustBar = document.getElementById('trust-bar');
        
        sanityBar.style.width = this.sanity + '%';
        trustBar.style.width = this.trust + '%';
        
        // Cambiar color según sanidad
        if (this.sanity < 30) {
            sanityBar.style.backgroundColor = '#ff0000';
        } else if (this.sanity < 60) {
            sanityBar.style.backgroundColor = '#ffaa00';
        } else {
            sanityBar.style.backgroundColor = '#00ff00';
        }
        
        // Efectos visuales según sanidad baja
        if (this.sanity < 30) {
            this.visualEffects.intensifyGlitch();
        }
    }
    
    async loadChapter(chapterNum) {
        const chapter = this.storyEngine.getChapter(chapterNum, this.progress);
        
        if (!chapter) {
            return;
        }
        
        // Limpiar pantalla
        const narrativeText = document.getElementById('narrative-text');
        const choicesContainer = document.getElementById('choices-container');
        narrativeText.innerHTML = '';
        choicesContainer.innerHTML = '';
        
        // Mostrar texto narrativo con efecto de escritura
        await this.typewriterEffect(narrativeText, chapter.text);
        
        // Voz de AM si existe
        if (chapter.amVoice) {
            await this.showAMVoice(chapter.amVoice);
        }
        
        // Mostrar opciones
        if (chapter.isEnding) {
            this.showEnding(chapter.ending);
        } else {
            this.showChoices(chapter.choices);
        }
    }
    
    async typewriterEffect(element, text) {
        return new Promise((resolve) => {
            let i = 0;
            const speed = 30;
            
            function type() {
                if (i < text.length) {
                    element.innerHTML += text.charAt(i);
                    i++;
                    
                    // Glitch aleatorio durante escritura
                    if (Math.random() < 0.02) {
                        document.getElementById('glitch-sound').play();
                    }
                    
                    setTimeout(type, speed);
                } else {
                    resolve();
                }
            }
            
            type();
        });
    }
    
    async showAMVoice(text) {
        const amVoice = document.getElementById('am-voice');
        amVoice.classList.remove('hidden');
        amVoice.innerHTML = '';
        
        await new Promise(resolve => setTimeout(resolve, 500));
        await this.typewriterEffect(amVoice, `<span class="am-text">${text}</span>`);
        
        this.visualEffects.screenShake();
        this.visualEffects.redFlash();
    }
    
    showChoices(choices) {
        const container = document.getElementById('choices-container');
        container.innerHTML = '';
        
        choices.forEach((choice, index) => {
            const button = document.createElement('button');
            button.className = 'choice-button';
            button.innerHTML = `<span>${String.fromCharCode(65 + index)})</span> ${choice.text}`;
            
            button.addEventListener('click', () => this.makeDecision(choice));
            
            container.appendChild(button);
            
            // Animación de aparición
            setTimeout(() => {
                button.style.opacity = '1';
                button.style.transform = 'translateX(0)';
            }, index * 100);
        });
    }
    
    async makeDecision(choice) {
        // Deshabilitar botones
        const buttons = document.querySelectorAll('.choice-button');
        buttons.forEach(btn => btn.disabled = true);
        
        // Efecto visual de decisión
        this.visualEffects.glitchScreen();
        
        // Enviar decisión al servidor
        try {
            const response = await fetch('api/process_decision.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    chapter: this.chapter,
                    decision: choice.id
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Actualizar estado
                this.chapter = result.progress.chapter;
                this.sanity = parseInt(result.progress.sanity);
                this.trust = parseInt(result.progress.trust);
                
                Object.assign(this.progress, result.progress);
                
                this.updateStatusBars();
                
                // Efecto según impacto
                if (choice.impact) {
                    if (choice.impact.sanity < 0) {
                        this.visualEffects.sanityLossEffect();
                    }
                    if (choice.impact.trust < -10) {
                        await this.showAMVoice(`VEO LO QUE ESTÁS HACIENDO, ${this.playerName.toUpperCase()}... INTERESANTE.`);
                    }
                }
                
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Cargar siguiente capítulo o final
                if (choice.nextChapter) {
                    this.loadChapter(choice.nextChapter);
                } else if (choice.ending) {
                    this.triggerEnding(choice.ending);
                }
            }
        } catch (error) {
            // Error silencioso
        }
    }
    
    async triggerEnding(endingType) {
        try {
            const response = await fetch('api/trigger_ending.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ending: endingType
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Cargar escena de final
                const chapter = this.storyEngine.getEnding(endingType, result.email_sent);
                
                const narrativeText = document.getElementById('narrative-text');
                const choicesContainer = document.getElementById('choices-container');
                narrativeText.innerHTML = '';
                choicesContainer.innerHTML = '';
                
                // Efecto especial según el final
                switch(endingType) {
                    case 'good_ending':
                        this.visualEffects.goodEndingEffect();
                        break;
                    case 'bad_ending':
                        this.visualEffects.badEndingEffect();
                        break;
                    case 'secret_ending':
                        this.visualEffects.secretEndingEffect();
                        break;
                    case 'true_ending':
                        this.visualEffects.trueEndingEffect();
                        if (result.email_sent) {
                            chapter.text += '\n\n<span class="email-warning">CHECK YOUR EMAIL...</span>';
                        }
                        break;
                }
                
                await this.typewriterEffect(narrativeText, chapter.text);
                
                // Botón para reiniciar
                const restartBtn = document.createElement('button');
                restartBtn.className = 'choice-button restart-button';
                restartBtn.textContent = 'REINICIAR SIMULACIÓN';
                restartBtn.style.opacity = '1';
                restartBtn.style.transform = 'translateX(0)';
                restartBtn.addEventListener('click', async () => {
                    restartBtn.disabled = true;
                    restartBtn.textContent = 'RESETEANDO...';
                    
                    try {
                        const response = await fetch('api/reset_progress.php', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        });
                        
                        const result = await response.json();
                        
                        if (result.success) {
                            window.location.reload();
                        } else {
                            alert('Error al resetear: ' + result.message);
                            restartBtn.disabled = false;
                            restartBtn.textContent = 'REINICIAR SIMULACIÓN';
                        }
                    } catch (error) {
                        alert('Error de conexión');
                        restartBtn.disabled = false;
                        restartBtn.textContent = 'REINICIAR SIMULACIÓN';
                    }
                });
                
                // Botón para volver al dashboard
                const dashboardBtn = document.createElement('button');
                dashboardBtn.className = 'choice-button restart-button';
                dashboardBtn.textContent = 'VOLVER AL DASHBOARD';
                dashboardBtn.style.opacity = '1';
                dashboardBtn.style.transform = 'translateX(0)';
                dashboardBtn.addEventListener('click', () => {
                    window.location.href = '../dashboard.php';
                });
                
                // Añadir los botones con un pequeño delay
                setTimeout(() => {
                    choicesContainer.appendChild(restartBtn);
                    choicesContainer.appendChild(dashboardBtn);
                }, 500);
            }
        } catch (error) {
            // Error silencioso
        }
    }
}

// Iniciar juego cuando cargue la página
document.addEventListener('DOMContentLoaded', () => {
    new AMGame();
});
