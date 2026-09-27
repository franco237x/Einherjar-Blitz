// UMBRA - Motor principal del juego
import { StoryEngine } from './story.js';
import { ParanoiaSystem } from './paranoia.js';
import { VisualEffects } from './visuals.js';
import { ProceduralAudio } from './audio.js';

class UmbraGame {
    constructor() {
        this.state = { ...GAME_DATA.progress };
        this.story = new StoryEngine(USER_NAME);
        this.paranoia = new ParanoiaSystem(this);
        this.visuals = new VisualEffects(this);
        this.audio = new ProceduralAudio();
        this.isTyping = false;
        this.playTime = 0;
        this.images = {
            shadow: 'assets/images/shadow_figure.png',
            face: 'assets/images/distorted_face.png',
            room: 'assets/images/dark_room.png',
            mirror: 'assets/images/mirror_reflection.png',
            chair: 'assets/images/empty_chair.png',
            hallway: 'assets/images/hallway_darkness.png',
            eyes: 'assets/images/eyes_in_dark.png'
        };
        this.init();
    }

    init() {
        document.getElementById('accept-warning').addEventListener('click', () => this.startGame());
        this.updateStatBars();
        setInterval(() => { this.playTime++; this.paranoia.tick(); }, 1000);
        if (IS_RETURNING) this.visuals.returningPlayerEffect();
    }

    async startGame() {
        // Inicializar audio (requiere interacción del usuario)
        await this.audio.init();
        await this.audio.resume();
        this.audio.startAmbient();
        this.audio.startHeartbeat(60);

        document.getElementById('warning-screen').classList.remove('active');
        document.getElementById('game-screen').classList.add('active');
        setTimeout(() => this.loadChapter(this.state.chapter), 1000);
    }

    async loadChapter(num) {
        const chapter = this.story.getChapter(num);
        if (!chapter) return;

        this.clearScreen();
        this.state.chapter = num;

        if (chapter.showStats) document.getElementById('stats-bar').classList.remove('hidden');

        // Mostrar imagen según el capítulo
        this.updateRoomVisual(num);

        await this.typeText(chapter.text);
        if (chapter.whisper) {
            this.showWhisper(chapter.whisper);
            this.audio.playWhisper();
        }
        if (chapter.effect) {
            this.visuals.trigger(chapter.effect);
            this.triggerAudioEffect(chapter.effect);
        }

        this.showChoices(chapter.choices);
        this.saveProgress();
    }

    updateRoomVisual(chapterNum) {
        const roomVisual = document.getElementById('room-visual');
        let imageSrc = null;

        // Asignar imágenes según el capítulo
        if ([1, 2, 3, 4, 5].includes(chapterNum)) {
            imageSrc = this.images.eyes; // Oscuridad con ojos
        } else if ([6, 15, 16, 17, 23, 24].includes(chapterNum)) {
            imageSrc = this.images.mirror; // Capítulos del espejo
        } else if ([18, 25, 26, 27].includes(chapterNum)) {
            imageSrc = this.images.chair; // La silla
        } else if ([9, 13, 14].includes(chapterNum)) {
            imageSrc = this.images.hallway; // Corredor
        } else if ([28, 29, 30, 31, 32, 33].includes(chapterNum)) {
            imageSrc = this.images.face; // Confrontación
        } else if ([34, 35, 36].includes(chapterNum)) {
            imageSrc = this.images.room; // La habitación final
        } else {
            imageSrc = this.images.shadow; // Default
        }

        if (imageSrc) {
            roomVisual.style.backgroundImage = `url('${imageSrc}')`;
            roomVisual.classList.add('visible');
        }
    }

    triggerAudioEffect(effect) {
        switch (effect) {
            case 'microGlitch':
                this.audio.playGlitch();
                break;
            case 'screenFlicker':
                this.audio.playDistortion();
                break;
            case 'cornerEntity':
                this.audio.playBreathing(2);
                break;
            case 'paranoiaSpike':
                this.audio.playJumpScare();
                this.audio.accelerateHeartbeat();
                break;
            case 'sanityLoss':
                this.audio.playTension(3);
                this.audio.playDistortion();
                break;
            case 'distortText':
                this.audio.playWhisper();
                break;
        }
    }

    async typeText(text) {
        this.isTyping = true;
        const el = document.getElementById('narrative-text');
        el.innerHTML = '';

        const processed = text.replace(/{name}/g, USER_NAME)
            .replace(/{sessions}/g, SESSION_COUNT)
            .replace(/{time}/g, new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }));

        for (let i = 0; i < processed.length; i++) {
            if (processed[i] === '<') {
                const end = processed.indexOf('>', i);
                el.innerHTML += processed.substring(i, end + 1);
                i = end;
            } else {
                el.innerHTML += processed[i];
                if (Math.random() < 0.01 * (this.state.paranoia_level / 20)) {
                    this.visuals.microGlitch();
                    if (Math.random() < 0.3) this.audio.playGlitch();
                }
                await this.delay(30);
            }
        }
        this.isTyping = false;
    }

    showWhisper(text) {
        const el = document.getElementById('whisper-text');
        el.textContent = text.replace(/{name}/g, USER_NAME);
        el.classList.remove('hidden');
        this.audio.playWhisper();
        setTimeout(() => el.classList.add('hidden'), 5000);
    }

    showChoices(choices) {
        const container = document.getElementById('choices-area');
        container.innerHTML = '';

        choices.forEach((choice, i) => {
            const btn = document.createElement('button');
            btn.className = 'choice-button' + (choice.dangerous ? ' dangerous' : '');
            btn.textContent = choice.text.replace(/{name}/g, USER_NAME);
            btn.addEventListener('click', () => this.makeChoice(choice));
            container.appendChild(btn);
            setTimeout(() => btn.classList.add('visible'), i * 150);
        });
    }

    async makeChoice(choice) {
        document.querySelectorAll('.choice-button').forEach(b => b.disabled = true);
        this.visuals.choiceFlash();
        this.audio.playGlitch();

        if (choice.impact) {
            if (choice.impact.sanity) this.state.sanity = Math.max(0, Math.min(100, this.state.sanity + choice.impact.sanity));
            if (choice.impact.perception) this.state.perception = Math.max(0, Math.min(100, this.state.perception + choice.impact.perception));
            if (choice.impact.paranoia) this.state.paranoia_level = Math.max(0, Math.min(100, this.state.paranoia_level + choice.impact.paranoia));
            if (choice.impact.trust) this.state.trust = Math.max(0, Math.min(100, this.state.trust + choice.impact.trust));

            this.updateStatBars();
            this.updateBodyStates();

            if (choice.impact.sanity < -15) {
                this.visuals.sanityLoss();
                this.audio.playTension(2);
            }
            if (choice.impact.paranoia > 10) {
                this.visuals.paranoiaSpike();
                this.audio.accelerateHeartbeat();
            }
        }

        if (choice.flag) this.state[choice.flag] = true;

        await this.delay(800);

        if (choice.ending) {
            this.triggerEnding(choice.ending);
        } else if (choice.next) {
            this.loadChapter(choice.next);
        }
    }

    updateStatBars() {
        document.getElementById('sanity-bar').style.width = this.state.sanity + '%';
        document.getElementById('perception-bar').style.width = this.state.perception + '%';
        document.getElementById('paranoia-bar').style.width = this.state.paranoia_level + '%';
    }

    updateBodyStates() {
        document.body.classList.toggle('low-sanity', this.state.sanity < 30);
        document.body.classList.toggle('high-paranoia', this.state.paranoia_level > 60);
        document.body.classList.toggle('low-perception', this.state.perception < 40);

        // Ajustar audio según estado
        if (this.state.paranoia_level > 70) {
            this.audio.setVolume(0.4);
        }
        if (this.state.sanity < 30) {
            this.audio.playBreathing(1);
        }
    }

    async triggerEnding(type) {
        const ending = this.story.getEnding(type);
        this.clearScreen();

        // Audio de final
        this.audio.stopHeartbeat();
        this.audio.stopAmbient();

        if (type === 'consumed' || type === 'cycle') {
            this.audio.playJumpScare();
        } else if (type === 'truth' || type === 'rupture') {
            this.audio.playTension(5);
        }

        this.visuals.endingEffect(type);

        document.getElementById('game-screen').classList.remove('active');
        document.getElementById('ending-screen').classList.add('active');

        document.getElementById('ending-content').innerHTML = `
            <h1>${ending.title}</h1>
            <p>${ending.text.replace(/{name}/g, USER_NAME).replace(/{sessions}/g, SESSION_COUNT)}</p>
        `;

        document.getElementById('ending-actions').innerHTML = `
            <button id="restart-btn">VOLVER A INTENTAR</button>
            <button onclick="location.href='../dashboard.php'">ESCAPAR</button>
        `;

        // Agregar evento de reinicio
        document.getElementById('restart-btn').addEventListener('click', async () => {
            await this.restartGame();
        });

        this.saveEnding(type);
    }

    clearScreen() {
        document.getElementById('narrative-text').innerHTML = '';
        document.getElementById('choices-area').innerHTML = '';
    }

    async saveProgress() {
        try {
            await fetch('api/save_state.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.state)
            });
        } catch (e) { }
    }

    async saveEnding(type) {
        try {
            await fetch('api/trigger_ending.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ending: type, ...this.state })
            });
        } catch (e) { }
    }

    async restartGame() {
        try {
            await fetch('api/reset_progress.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (e) { }
        location.reload();
    }

    delay(ms) { return new Promise(r => setTimeout(r, ms)); }
}

document.addEventListener('DOMContentLoaded', () => new UmbraGame());

