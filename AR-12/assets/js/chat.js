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
    const sendBtn = document.getElementById('sendBtn');

    const DEFAULT_MAX_CONTEXT_TOKENS = 2048;
    const CHARS_PER_TOKEN = 4;
    let maxContextTokens = DEFAULT_MAX_CONTEXT_TOKENS;
    let usedTokens = 0;

    let isProcessing = false;
    let currentModel = 'mini';

    // Configure marked.js for better rendering
    if (typeof marked !== 'undefined') {
        marked.setOptions({
            breaks: true,
            gfm: true,
            headerIds: false,
            mangle: false
        });
    }

    // ===== TEXTAREA AUTO-RESIZE =====
    const autoResizeTextarea = () => {
        userInput.style.height = 'auto';
        const maxHeight = 200;
        const newHeight = Math.min(userInput.scrollHeight, maxHeight);
        userInput.style.height = newHeight + 'px';
    };

    userInput.addEventListener('input', autoResizeTextarea);

    // Handle Enter to send, Shift+Enter for new line
    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!isProcessing && userInput.value.trim()) {
                chatForm.dispatchEvent(new Event('submit'));
            }
        }
    });

    // ===== MODEL SELECTOR DROPDOWN =====
    modelButton.addEventListener('click', (e) => {
        e.stopPropagation();
        modelButton.classList.toggle('active');
        modelDropdown.classList.toggle('show');
    });

    document.addEventListener('click', (e) => {
        if (!modelDropdown.contains(e.target) && !modelButton.contains(e.target)) {
            modelButton.classList.remove('active');
            modelDropdown.classList.remove('show');
        }
    });

    modelDropdown.addEventListener('click', (e) => {
        const option = e.target.closest('.model-option');
        if (option && !option.classList.contains('disabled')) {
            const newModel = option.dataset.value;

            // Only update if changed
            if (currentModel !== newModel) {
                currentModel = newModel;

                modelDropdown.querySelectorAll('.model-option').forEach(opt => {
                    opt.classList.remove('active');
                });
                option.classList.add('active');

                const modelName = option.querySelector('.model-name').textContent;
                modelButton.querySelector('span').textContent = modelName;

                // Fetch usage for the new model
                loadInitialUsage(currentModel);
            }

            modelButton.classList.remove('active');
            modelDropdown.classList.remove('show');
        }
    });

    // ===== SCROLL FUNCTIONS =====
    const scrollToBottom = () => {
        requestAnimationFrame(() => {
            chatMessages.scrollTo({
                top: chatMessages.scrollHeight,
                behavior: 'smooth'
            });
        });
    };

    // ===== CONTEXT GAUGE =====
    const estimateTokens = (text) => Math.ceil(text.length / CHARS_PER_TOKEN);

    const updateContextGauge = (tokenCount) => {
        const percent = Math.min(100, Math.round((tokenCount / maxContextTokens) * 100));
        contextCircle.style.setProperty('--percent', (percent / 100));
        contextPercent.textContent = `${percent}%`;
        contextChars.textContent = `${tokenCount} / ${maxContextTokens} tokens`;

        // Change color based on usage
        if (percent >= 90) {
            contextCircle.style.setProperty('--accent-color', '#ef4444');
        } else if (percent >= 70) {
            contextCircle.style.setProperty('--accent-color', '#f59e0b');
        } else {
            contextCircle.style.setProperty('--accent-color', '#10b981');
        }
    };

    updateContextGauge(0);

    // ===== ADD MESSAGE TO UI =====
    const addMessage = (text, type) => {
        const div = document.createElement('div');
        div.className = `message ${type}`;

        // Avatar
        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'avatar';
        avatarDiv.innerHTML = type === 'user'
            ? '<i class="fas fa-user"></i>'
            : '<i class="fas fa-robot"></i>';
        div.appendChild(avatarDiv);

        // Content
        const contentDiv = document.createElement('div');
        contentDiv.className = 'content';

        if (type === 'ai' && typeof marked !== 'undefined') {
            contentDiv.innerHTML = marked.parse(text);
        } else if (type === 'error') {
            contentDiv.innerHTML = `<p style="color: #ef4444;"><i class="fas fa-exclamation-circle"></i> ${text}</p>`;
        } else {
            // For user messages, preserve line breaks
            const escaped = text
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/\n/g, '<br>');
            contentDiv.innerHTML = `<p>${escaped}</p>`;
        }

        div.appendChild(contentDiv);
        chatMessages.appendChild(div);
        scrollToBottom();

        return div;
    };

    // ===== CREATE LOADING INDICATOR =====
    const createLoadingIndicator = () => {
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
        return loadingDiv;
    };

    // ===== HANDLE FORM SUBMISSION =====
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const rawMessage = userInput.value.trim();

        if (!rawMessage || isProcessing) return;

        const tokenEstimate = estimateTokens(rawMessage);
        const available = maxContextTokens - usedTokens;

        if (available <= 0) {
            addMessage(rawMessage, 'user');
            addMessage('Has llegado al límite de uso semanal.', 'ai');
            usageInfo.textContent = 'Límite alcanzado';
            userInput.value = '';
            autoResizeTextarea();
            return;
        }

        let message = rawMessage;
        if (tokenEstimate > available) {
            const allowedChars = Math.max(0, available * CHARS_PER_TOKEN);
            message = rawMessage.slice(0, allowedChars);
            usageInfo.textContent = `Recortado a ~${available} tokens`;
        }

        // Add user message
        addMessage(message, 'user');
        userInput.value = '';
        autoResizeTextarea();

        // Disable input during processing
        userInput.disabled = true;
        sendBtn.disabled = true;
        isProcessing = true;

        // Add loading indicator
        const loadingDiv = createLoadingIndicator();

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

            // Streaming Handling
            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            // Remove loading indicator immediately as we start streaming
            loadingDiv.remove();

            // Create a message bubble for the AI response
            const aiMessageDiv = addMessage('', 'ai');
            const aiContentDiv = aiMessageDiv.querySelector('.content');
            let fullText = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const jsonStr = line.slice(6);
                            if (!jsonStr) continue;
                            const data = JSON.parse(jsonStr);

                            if (data.text) {
                                fullText += data.text;
                                // Simple incremental rendering
                                if (typeof marked !== 'undefined') {
                                    aiContentDiv.innerHTML = marked.parse(fullText);
                                } else {
                                    aiContentDiv.textContent = fullText;
                                }
                                scrollToBottom();
                            } else if (data.done) {
                                // Final update with usage stats
                                if (data.usage) {
                                    updateUsageInfo(data.usage);
                                }
                            } else if (data.error) {
                                addMessage('Error del sistema: ' + data.error, 'error');
                            }
                        } catch (e) {
                            console.error('Error parsing SSE:', e);
                        }
                    }
                }
            }

        } catch (error) {
            loadingDiv.remove();
            addMessage('Error de conexión: ' + error.message, 'error');
        } finally {
            userInput.disabled = false;
            sendBtn.disabled = false;
            userInput.focus();
            isProcessing = false;
        }
    });

    // ===== UPDATE USAGE INFO =====
    const updateUsageInfo = (usage) => {
        if (usage.contextTokenLimit) {
            maxContextTokens = usage.contextTokenLimit;
        }

        usedTokens = usage.promptTokensUsed ?? usage.promptTokens ?? usage.promptTokensApprox ?? usedTokens;
        const remaining = usage.remainingTokens ?? (maxContextTokens - usedTokens);

        usageInfo.textContent = usage.truncated ? `~${remaining} tokens restantes` : '';

        updateContextGauge(usedTokens);
    };

    // ===== LOAD INITIAL USAGE =====
    const loadInitialUsage = async (model = 'mini') => {
        try {
            const resp = await fetch(`api/chat.php?model=${model}`, { method: 'GET' });
            const data = await resp.json();
            if (data.success && data.usage) {
                updateUsageInfo(data.usage);
            }
        } catch (err) {
            console.error('No se pudo cargar el uso inicial:', err);
        }
    };

    loadInitialUsage(currentModel);

    // ===== CONTEXT GAUGE LIVE UPDATE =====
    userInput.addEventListener('input', () => {
        const tokens = estimateTokens(userInput.value);
        updateContextGauge(Math.min(maxContextTokens, usedTokens + tokens));

        // Update send button state
        sendBtn.disabled = isProcessing || !userInput.value.trim();
    });

    // Initial focus
    userInput.focus();

    // ===== HANDLE VISIBILITY CHANGE (mobile) =====
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            scrollToBottom();
        }
    });

    // ===== PREVENT ZOOM ON INPUT (iOS) =====
    userInput.addEventListener('focus', () => {
        document.body.classList.add('input-focused');
    });

    userInput.addEventListener('blur', () => {
        document.body.classList.remove('input-focused');
    });
});
