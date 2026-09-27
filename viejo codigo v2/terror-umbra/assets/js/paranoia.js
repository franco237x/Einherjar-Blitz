// UMBRA - Sistema de Paranoia y Eventos Aleatorios
export class ParanoiaSystem {
    constructor(game) {
        this.game = game;
        this.tickCount = 0;
        this.lastEvent = 0;
    }

    tick() {
        this.tickCount++;
        const paranoia = this.game.state.paranoia_level;
        const chance = paranoia / 500;

        if (Math.random() < chance && this.tickCount - this.lastEvent > 30) {
            this.triggerRandomEvent();
            this.lastEvent = this.tickCount;
        }

        // Incremento pasivo de paranoia
        if (this.tickCount % 60 === 0 && paranoia < 100) {
            this.game.state.paranoia_level = Math.min(100, paranoia + 1);
            this.game.updateStatBars();
        }
    }

    triggerRandomEvent() {
        const events = [
            () => this.game.visuals.cornerEntity(),
            () => this.game.visuals.screenFlicker(),
            () => this.showRandomWhisper(),
            () => this.game.visuals.microGlitch(),
            () => this.game.visuals.distortText(),
            () => this.breathingSound()
        ];

        const paranoia = this.game.state.paranoia_level;
        const available = events.slice(0, Math.ceil(events.length * (paranoia / 100)));

        if (available.length > 0) {
            available[Math.floor(Math.random() * available.length)]();
        }
    }

    showRandomWhisper() {
        const whispers = [
            "...{name}...",
            "Puedo verte...",
            "No estás solo...",
            "Detrás de ti...",
            "¿Por qué sigues aquí?",
            "Ya es tarde...",
            "Siempre estuvo aquí...",
            "No confíes en nadie...",
            SESSION_COUNT > 1 ? "Volviste... sabía que lo harías..." : "Primera vez... disfrútalo...",
            IS_NIGHT ? "Es tarde para estar despierto..." : "El sol no te salvará..."
        ];

        const whisper = whispers[Math.floor(Math.random() * whispers.length)];
        this.game.showWhisper(whisper);
    }

    breathingSound() {
        if (this.game.audio && this.game.audio.isInitialized) {
            this.game.audio.playBreathing(2);
        }
    }
}
