// UMBRA - Efectos Visuales Perturbadores
export class VisualEffects {
    constructor(game) {
        this.game = game;
        this.entities = [];
    }

    trigger(effect) {
        if (this[effect]) this[effect]();
    }

    microGlitch() {
        const layer = document.getElementById('glitch-layer');
        layer.classList.add('active');
        setTimeout(() => layer.classList.remove('active'), 100 + Math.random() * 200);
    }

    screenFlicker() {
        const flash = document.getElementById('flash-layer');
        flash.classList.add('black');
        setTimeout(() => flash.classList.remove('black'), 50);
        setTimeout(() => {
            flash.classList.add('black');
            setTimeout(() => flash.classList.remove('black'), 30);
        }, 100);
    }

    cornerEntity() {
        const layer = document.getElementById('entity-layer');
        const positions = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
        const pos = positions[Math.floor(Math.random() * positions.length)];

        const entity = document.createElement('div');
        entity.className = `corner-entity ${pos}`;
        layer.appendChild(entity);

        setTimeout(() => entity.classList.add('visible'), 50);
        setTimeout(() => {
            entity.classList.remove('visible');
            setTimeout(() => entity.remove(), 500);
        }, 1500 + Math.random() * 2000);
    }

    distortText() {
        const text = document.getElementById('narrative-text');
        const chars = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`ÄÖÜß';
        const original = text.innerHTML;

        let distorted = '';
        for (let char of original) {
            if (char !== '<' && char !== '>' && Math.random() < 0.1) {
                distorted += chars[Math.floor(Math.random() * chars.length)];
            } else {
                distorted += char;
            }
        }

        text.innerHTML = distorted;
        setTimeout(() => text.innerHTML = original, 100);
    }

    choiceFlash() {
        const flash = document.getElementById('flash-layer');
        flash.classList.add('red');
        setTimeout(() => flash.classList.remove('red'), 100);
    }

    sanityLoss() {
        const container = document.getElementById('game-container');
        container.style.filter = 'blur(3px) hue-rotate(180deg)';
        this.microGlitch();
        setTimeout(() => {
            this.microGlitch();
            setTimeout(() => {
                container.style.filter = '';
            }, 500);
        }, 200);
    }

    paranoiaSpike() {
        const vignette = document.getElementById('vignette');
        vignette.classList.add('blood');
        for (let i = 0; i < 3; i++) {
            setTimeout(() => this.microGlitch(), i * 100);
        }
        setTimeout(() => vignette.classList.remove('blood'), 2000);
    }

    returningPlayerEffect() {
        console.log('[EFFECT] Returning player detected...');
        setTimeout(() => this.game.showWhisper("Volviste... te estaba esperando..."), 3000);
    }

    endingEffect(type) {
        const flash = document.getElementById('flash-layer');
        const vignette = document.getElementById('vignette');

        switch (type) {
            case 'escape':
                flash.style.background = 'white';
                flash.classList.add('white');
                setTimeout(() => flash.classList.remove('white'), 3000);
                break;
            case 'consumed':
                vignette.classList.add('blood');
                for (let i = 0; i < 20; i++) {
                    setTimeout(() => this.microGlitch(), i * 50);
                }
                break;
            case 'cycle':
                this.distortText();
                setInterval(() => this.microGlitch(), 500);
                break;
            case 'truth':
                document.body.style.filter = 'invert(1)';
                setTimeout(() => document.body.style.filter = '', 100);
                setTimeout(() => {
                    document.body.style.filter = 'invert(1)';
                    setTimeout(() => document.body.style.filter = '', 50);
                }, 200);
                break;
            case 'rupture':
                document.body.innerHTML = '<div style="display:flex;height:100vh;align-items:center;justify-content:center;background:#000;color:#f00;font-size:48px;font-family:monospace;">ERROR: REALITY_NOT_FOUND</div>';
                break;
        }
    }

    subliminalFlash(imageUrl) {
        const layer = document.getElementById('subliminal-layer');
        layer.innerHTML = `<img src="${imageUrl}" alt="">`;
        layer.classList.add('flash');
        setTimeout(() => layer.classList.remove('flash'), 80);
    }
}
