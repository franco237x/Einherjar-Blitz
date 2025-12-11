document.addEventListener('DOMContentLoaded', () => {
    const chatForm = document.getElementById('chatForm');
    const userInput = document.getElementById('userInput');
    const chatMessages = document.getElementById('chatMessages');
    const modelButton = document.getElementById('modelButton');
    const modelDropdown = document.getElementById('modelDropdown');
    const usageInfo = document.getElementById('usageInfo');
    const contextCircle = document.getElementById('contextCircle');
    const contextPercent = document.getElementById('contextPercent');
    const contextChars = document.getElementById('contextChars');

    const DEFAULT_MAX_CONTEXT_TOKENS = 2048; // debe corresponder al backend
    const CHARS_PER_TOKEN = 4; // aproximación
    let maxContextTokens = DEFAULT_MAX_CONTEXT_TOKENS;
    let usedTokens = 0;

    let isProcessing = false;
    let currentModel = 'mini';

    // Configure marked.js for better rendering
    marked.setOptions({
        breaks: true,
        gfm: true,
        headerIds: false,
        mangle: false
    });

    // Model selector dropdown
    modelButton.addEventListener('click', (e) => {
        e.stopPropagation();
        modelButton.classList.toggle('active');
        modelDropdown.classList.toggle('show');
    });

    document.addEventListener('click', () => {
        modelButton.classList.remove('active');
        modelDropdown.classList.remove('show');
    });

    modelDropdown.addEventListener('click', (e) => {
        const option = e.target.closest('.model-option');
        if (option) {
            currentModel = option.dataset.value;
            
            // Update active state
            modelDropdown.querySelectorAll('.model-option').forEach(opt => {
                opt.classList.remove('active');
            });
            option.classList.add('active');
            
            // Update button text
            const modelName = option.querySelector('.model-name').textContent;
            modelButton.querySelector('span').textContent = modelName;
            
            // Close dropdown
            modelButton.classList.remove('active');
            modelDropdown.classList.remove('show');
        }
    });

    // Auto-scroll to bottom
    const scrollToBottom = () => {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    // Actualizar gauge de contexto
    const estimateTokens = (text) => Math.ceil(text.length / CHARS_PER_TOKEN);

    const updateContextGauge = (tokenCount) => {
        const percent = Math.min(100, Math.round((tokenCount / maxContextTokens) * 100));
        contextCircle.style.setProperty('--percent', (percent / 100));
        contextPercent.textContent = `${percent}%`;
        contextChars.textContent = `${tokenCount} / ${maxContextTokens} tokens`;
    };

    updateContextGauge(0);

    // Add message to UI with proper Markdown rendering
    const addMessage = (text, type) => {
        const div = document.createElement('div');
        div.className = `message ${type}`;
        
        // Avatar
        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'avatar';
        avatarDiv.innerHTML = type === 'user' ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>';
        div.appendChild(avatarDiv);

        // Content
        const contentDiv = document.createElement('div');
        contentDiv.className = 'content';
        
        if (type === 'ai') {
            // Use marked.js to render full Markdown
            contentDiv.innerHTML = marked.parse(text);
        } else {
            contentDiv.textContent = text;
        }
        
        div.appendChild(contentDiv);
        chatMessages.appendChild(div);
        scrollToBottom();
    };

    // Handle form submission
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const rawMessage = userInput.value.trim();

        if (!rawMessage || isProcessing) return;

        const tokenEstimate = estimateTokens(rawMessage);
        const available = maxContextTokens - usedTokens;

        if (available <= 0) {
            // Permite enviar pero responde con mensaje automático de límite
            addMessage(rawMessage, 'user');
            addMessage('Has llegado al límite de uso semanal.', 'ai');
            usageInfo.textContent = 'Has llegado al límite de uso semanal.';
            userInput.value = '';
            return;
        }

        let message = rawMessage;
        if (tokenEstimate > available) {
            const allowedChars = Math.max(0, available * CHARS_PER_TOKEN);
            message = rawMessage.slice(0, allowedChars);
            usageInfo.textContent = `Recortado a ~${available} tokens disponibles.`;
        }

        // Add user message
        addMessage(message, 'user');
        userInput.value = '';
        userInput.disabled = true;
        isProcessing = true;

        // Add loading indicator
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'message ai loading';
        loadingDiv.innerHTML = `
            <div class="avatar"><i class="fas fa-robot"></i></div>
            <div class="content">
                <div class="typing-indicator">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            </div>`;
        chatMessages.appendChild(loadingDiv);
        scrollToBottom();

        try {
            const response = await fetch('api/chat.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    model: currentModel
                })
            });

            const data = await response.json();
            
            // Remove loading indicator
            loadingDiv.remove();

            if (data.success) {
                addMessage(data.response, 'ai');
                if (data.usage) {
                    updateUsageInfo(data.usage);
                }
            } else {
                addMessage(data.message || 'Error desconocido', 'error');
            }

        } catch (error) {
            loadingDiv.remove();
            addMessage('Error de conexión: ' + error.message, 'error');
        } finally {
            userInput.disabled = false;
            userInput.focus();
            isProcessing = false;
        }
    });

    const updateUsageInfo = (usage) => {
        if (usage.contextTokenLimit) {
            maxContextTokens = usage.contextTokenLimit;
        }

        usedTokens = usage.promptTokensUsed ?? usage.promptTokens ?? usage.promptTokensApprox ?? usedTokens;
        const remaining = usage.remainingTokens ?? (maxContextTokens - usedTokens);

        usageInfo.textContent = usage.truncated ? `Recortado; quedan ~${remaining} tokens` : '';

        updateContextGauge(usedTokens);
    };

    // Fetch current usage on load so the gauge persists across reloads
    const loadInitialUsage = async () => {
        try {
            const resp = await fetch('api/chat.php', { method: 'GET' });
            const data = await resp.json();
            if (data.success && data.usage) {
                updateUsageInfo(data.usage);
            }
        } catch (err) {
            console.error('No se pudo cargar el uso inicial:', err);
        }
    };

    loadInitialUsage();

    // Escuchar cambios para el gauge de contexto
    userInput.addEventListener('input', () => {
        const tokens = estimateTokens(userInput.value);
        updateContextGauge(Math.min(maxContextTokens, usedTokens + tokens));
    });
});
