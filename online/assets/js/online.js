// Online Mode JavaScript - Simplified Version

class OnlineMode {
    constructor() {
        this.init();
    }
    
    init() {
        // Only basic initialization - no complex functionality
        console.log('Online Mode initialized - Coming Soon features disabled');
        
        // Initialize real ping and server detection
        this.measurePing();
        this.detectServerLocation();
        
        // Update ping every 30 seconds
        setInterval(() => {
            this.measurePing();
        }, 30000);
    }
    
    async measurePing() {
        const pingElement = document.getElementById('pingValue');
        if (!pingElement) return;
        
        try {
            const startTime = performance.now();
            
            // Use a small image request to measure latency to the server
            const response = await fetch(window.location.origin + '/favicon.ico?' + Date.now(), {
                method: 'HEAD',
                cache: 'no-cache'
            });
            
            const endTime = performance.now();
            const ping = Math.round(endTime - startTime);
            
            // Update ping display with color coding
            pingElement.textContent = `${ping}ms`;
            
            if (ping < 50) {
                pingElement.className = 'text-success';
            } else if (ping < 100) {
                pingElement.className = 'text-warning';
            } else {
                pingElement.className = 'text-danger';
            }
            
        } catch (error) {
            pingElement.textContent = 'Error';
            pingElement.className = 'text-danger';
        }
    }
    
    async detectServerLocation() {
        const serverElement = document.getElementById('serverLocation');
        if (!serverElement) return;
        
        try {
            // Use a free IP geolocation service
            const response = await fetch('https://ipapi.co/json/');
            const data = await response.json();
            
            // Map country codes to server regions
            const serverRegions = {
                'US': 'América del Norte',
                'CA': 'América del Norte',
                'MX': 'América del Norte',
                'BR': 'América del Sur',
                'AR': 'América del Sur',
                'CL': 'América del Sur',
                'CO': 'América del Sur',
                'PE': 'América del Sur',
                'ES': 'Europa',
                'FR': 'Europa',
                'DE': 'Europa',
                'IT': 'Europa',
                'GB': 'Europa',
                'JP': 'Asia',
                'KR': 'Asia',
                'CN': 'Asia',
                'AU': 'Oceanía'
            };
            
            const region = serverRegions[data.country_code] || 'Global';
            serverElement.textContent = region;
            serverElement.className = 'text-info';
            
        } catch (error) {
            // Fallback to browser language detection
            const language = navigator.language || navigator.userLanguage;
            let region = 'Global';
            
            if (language.startsWith('es')) {
                if (language.includes('AR') || language.includes('CL') || language.includes('CO')) {
                    region = 'América del Sur';
                } else {
                    region = 'América';
                }
            } else if (language.startsWith('en')) {
                region = 'América del Norte';
            } else if (language.startsWith('pt')) {
                region = 'América del Sur';
            }
            
            serverElement.textContent = region;
            serverElement.className = 'text-info';
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.onlineMode = new OnlineMode();
});

// Utility functions for global access
function logout() {
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
        window.location.href = '../logout.php';
    }
}

// Add basic CSS for coming soon elements
const style = document.createElement('style');
style.textContent = `
    .coming-soon-content {
        text-align: center;
        padding: 3rem 2rem;
    }
    
    .coming-soon-banner {
        margin-top: 2rem;
    }
    
    .disabled {
        opacity: 0.6;
        pointer-events: none;
    }
    
    .text-gold {
        color: #d4af37 !important;
    }
`;
document.head.appendChild(style);
