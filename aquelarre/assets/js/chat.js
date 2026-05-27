document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const chatForm = document.getElementById('chatForm');
    const userInput = document.getElementById('userInput');
    const chatMessages = document.getElementById('chatMessages');
    const sendBtn = document.getElementById('sendBtn');
    const chatInputFooter = document.getElementById('chatInputFooter');
    const headerPdfBtn = document.getElementById('headerPdfBtn');
    const hotModeToggle = document.getElementById('hotModeToggle');

    // Lobby
    const witchLobby = document.getElementById('witchLobby');
    const chatContainer = document.getElementById('chatContainer');
    const witchCards = document.querySelectorAll('.witch-card');
    const startChatBtn = document.getElementById('startChatBtn');
    const activeWitchName = document.getElementById('activeWitchName');

    // State
    let isProcessing = false;
    let selectedWitch = null;
    let witchTitle = 'Aquelarre';
    let hotMode = false;
    let chatHistory = [];
    const MAX_HISTORY = 20;

    // Configure marked
    if (typeof marked !== 'undefined') {
        marked.setOptions({ breaks: true, gfm: true, headerIds: false, mangle: false });
    }

    // Hot mode setup
    if (window.HOT_UNLOCKED) {
        hotModeToggle.classList.add('active');
        hotModeToggle.style.display = 'flex';
        // Restore from sessionStorage
        if (sessionStorage.getItem('aquelarre_hot_mode') === '1') {
            hotMode = true;
            hotModeToggle.classList.add('on');
        }
        hotModeToggle.addEventListener('click', () => {
            hotMode = !hotMode;
            hotModeToggle.classList.toggle('on', hotMode);
            sessionStorage.setItem('aquelarre_hot_mode', hotMode ? '1' : '0');
        });
    }

    // ===== LOBBY =====
    witchCards.forEach(card => {
        card.addEventListener('click', () => {
            witchCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedWitch = card.dataset.witch;
            startChatBtn.disabled = false;
            startChatBtn.classList.remove('btn-start-disabled');
            startChatBtn.classList.add('btn-start-active');
        });
    });

    startChatBtn.addEventListener('click', () => {
        if (!selectedWitch) return;
        witchLobby.style.opacity = '0';
        setTimeout(() => {
            witchLobby.style.display = 'none';
            chatContainer.style.display = 'flex';
            initializeWitchEncounter(selectedWitch);
        }, 450);
    });

    const initializeWitchEncounter = (witch) => {
        let title = 'Aquelarre';
        let initialMsg = '';

        if (witch === 'herta') {
            title = 'The Herta';
            document.documentElement.style.setProperty('--accent-color', '#bc70c7');
            initialMsg = 'Vaya, otro humano aburrido. Empieza cuando quieras, tengo tiempo... pero no mucha paciencia.';
        } else if (witch === 'featherine') {
            title = 'Featherine Augustus Aurora';
            document.documentElement.style.setProperty('--accent-color', '#e5b300');
            initialMsg = 'Hmph, un Child of Man ha entrado en la ciudad de los libros. Veamos si tu insignificante fragmento de historia logra entretenerme.';
        } else if (witch === 'wanda') {
            title = 'Bruja Escarlata';
            document.documentElement.style.setProperty('--accent-color', '#dc2626');
            initialMsg = 'El caos es impredecible, pero yo soy su duena. No tienes idea de donde te has metido. Demuestrame que tu mente puede soportar mi realidad.';
        }

        witchTitle = title;
        const imgSrc = witch === 'wanda' ? 'escarlata.jpg' : `${witch}.jpg`;
        activeWitchName.innerHTML = `<img src="assets/images/${imgSrc}" style="width:26px;height:26px;border-radius:50%;margin-right:8px;object-fit:cover;border:1px solid rgba(255,255,255,0.2);vertical-align:middle;display:inline-block;"> ${title}`;

        addMessage(initialMsg, 'ai');
        chatHistory.push({ role: 'model', text: initialMsg });
        userInput.focus();
    };

    // ===== TEXTAREA AUTO-RESIZE =====
    const autoResize = () => {
        userInput.style.height = 'auto';
        userInput.style.height = Math.min(userInput.scrollHeight, 150) + 'px';
    };
    userInput.addEventListener('input', autoResize);
    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!isProcessing && userInput.value.trim()) {
                chatForm.dispatchEvent(new Event('submit'));
            }
        }
    });

    // ===== SCROLL =====
    const scrollToBottom = () => {
        requestAnimationFrame(() => {
            chatMessages.scrollTo({ top: chatMessages.scrollHeight, behavior: 'smooth' });
        });
    };

    // ===== ADD MESSAGE =====
    const addMessage = (text, type) => {
        const div = document.createElement('div');
        div.className = `message ${type}`;
        if (hotMode && type === 'ai') div.classList.add('hot');

        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'avatar';
        if (type === 'user') {
            avatarDiv.innerHTML = '<i class="fas fa-user-circle"></i>';
        } else if (type === 'ai' && selectedWitch) {
            const imgSrc = selectedWitch === 'wanda' ? 'escarlata.jpg' : `${selectedWitch}.jpg`;
            avatarDiv.innerHTML = `<img src="assets/images/${imgSrc}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
        } else {
            avatarDiv.innerHTML = '<i class="fas fa-moon"></i>';
        }
        div.appendChild(avatarDiv);

        const contentDiv = document.createElement('div');
        contentDiv.className = 'content';
        if (type === 'ai' && typeof marked !== 'undefined') {
            contentDiv.innerHTML = marked.parse(text);
        } else if (type === 'error') {
            contentDiv.innerHTML = `<p style="color:#ef4444;"><i class="fas fa-exclamation-circle"></i> ${text}</p>`;
        } else {
            contentDiv.innerHTML = `<p>${escapeHtml(text)}</p>`;
        }
        div.appendChild(contentDiv);
        chatMessages.appendChild(div);
        scrollToBottom();
        return div;
    };

    const escapeHtml = (str) => {
        return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');
    };

    const createLoading = () => {
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'message ai loading';
        const imgSrc = selectedWitch === 'wanda' ? 'escarlata.jpg' : `${selectedWitch}.jpg`;
        const avatarHtml = selectedWitch
            ? `<img src="assets/images/${imgSrc}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`
            : '<i class="fas fa-moon"></i>';
        loadingDiv.innerHTML = `
            <div class="avatar">${avatarHtml}</div>
            <div class="content">
                <div class="loading-status"><i class="fas fa-circle-notch fa-spin" style="font-size:0.75rem;margin-right:6px;opacity:0.6;"></i><span class="loading-text">Pensando...</span></div>
                <div class="typing-indicator" style="margin-top:6px;"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>
            </div>`;
        chatMessages.appendChild(loadingDiv);
        scrollToBottom();

        const thinkingMessages = [
            `${witchTitle || 'La bruja'} está preparando su respuesta...`,
            `${witchTitle || 'La bruja'} considera sus palabras...`,
            `Un momento, la magia tarda en manifestarse...`
        ];
        let msgIdx = 0;
        const textEl = loadingDiv.querySelector('.loading-text');
        const thinkTimer = setTimeout(() => {
            if (textEl) textEl.textContent = thinkingMessages[msgIdx % thinkingMessages.length];
            msgIdx++;
        }, 3000);
        const cycleTimer = setInterval(() => {
            if (textEl) textEl.textContent = thinkingMessages[msgIdx % thinkingMessages.length];
            msgIdx++;
        }, 5000);
        loadingDiv._clearTimers = () => { clearTimeout(thinkTimer); clearInterval(cycleTimer); };
        return loadingDiv;
    };

    // ===== FORM SUBMIT =====
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const rawMessage = userInput.value.trim();
        if (!rawMessage || isProcessing) return;

        addMessage(rawMessage, 'user');
        chatHistory.push({ role: 'user', text: rawMessage });
        userInput.value = '';
        autoResize();

        userInput.disabled = true;
        sendBtn.disabled = true;
        isProcessing = true;

        const loadingDiv = createLoading();

        try {
            const response = await fetch('api/chat.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: rawMessage,
                    witch: selectedWitch,
                    history: chatHistory.slice(-MAX_HISTORY),
                    hotMode: hotMode
                })
            });

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            if (loadingDiv._clearTimers) loadingDiv._clearTimers();
            loadingDiv.remove();

            let aiMessageDiv = null;
            let aiContentDiv = null;
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
                                if (!aiMessageDiv) {
                                    aiMessageDiv = addMessage('', 'ai');
                                    aiContentDiv = aiMessageDiv.querySelector('.content');
                                }
                                fullText += data.text;
                                if (typeof marked !== 'undefined') {
                                    aiContentDiv.innerHTML = marked.parse(fullText);
                                } else {
                                    aiContentDiv.textContent = fullText;
                                }
                                scrollToBottom();
                            } else if (data.done) {
                                if (fullText) chatHistory.push({ role: 'model', text: fullText });
                            } else if (data.error) {
                                if (!aiMessageDiv) addMessage('Error: ' + data.error, 'error');
                            }
                        } catch (err) {
                            console.error('SSE parse error:', err);
                        }
                    }
                }
            }
            if (!fullText && aiMessageDiv) aiMessageDiv.remove();
        } catch (error) {
            if (loadingDiv._clearTimers) loadingDiv._clearTimers();
            loadingDiv.remove();
            addMessage('Error de conexion: ' + error.message, 'error');
        } finally {
            userInput.disabled = false;
            sendBtn.disabled = false;
            isProcessing = false;
            userInput.focus();
        }
    });

    userInput.addEventListener('input', () => {
        sendBtn.disabled = isProcessing || !userInput.value.trim();
    });

    // ===== PDF EXPORT =====
    const generatePdf = () => {
        const btn = headerPdfBtn;
        const originalHtml = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

        const elementToExport = document.createElement('div');
        elementToExport.style.backgroundColor = '#0a0a0a';
        elementToExport.style.color = '#ffffff';
        elementToExport.style.padding = '20px';
        elementToExport.style.fontFamily = 'Inter, sans-serif';

        const header = document.createElement('h2');
        header.style.textAlign = 'center';
        header.style.color = getWitchColor();
        header.textContent = `Aquelarre Einherjer - Conversacion con ${witchTitle}`;
        elementToExport.appendChild(header);

        if (hotMode) {
            const hotLabel = document.createElement('p');
            hotLabel.style.textAlign = 'center';
            hotLabel.style.color = '#ec4899';
            hotLabel.style.fontSize = '0.85rem';
            hotLabel.style.marginBottom = '16px';
            hotLabel.textContent = 'Modo Hot activado';
            elementToExport.appendChild(hotLabel);
        }

        const msgs = Array.from(chatMessages.querySelectorAll('.message'));
        msgs.forEach(msg => {
            if (msg.classList.contains('loading')) return;
            const isUser = msg.classList.contains('user');
            const msgBox = document.createElement('div');
            msgBox.style.marginBottom = '14px';
            msgBox.style.padding = '14px';
            msgBox.style.borderRadius = '10px';
            msgBox.style.backgroundColor = isUser ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.05)';
            msgBox.style.borderLeft = isUser ? '4px solid #3b82f6' : `4px solid ${getWitchColor()}`;

            const sender = document.createElement('strong');
            sender.style.display = 'block';
            sender.style.marginBottom = '4px';
            sender.style.color = isUser ? '#60a5fa' : getWitchColor();
            sender.textContent = isUser ? 'Jugador' : (witchTitle || selectedWitch);

            const contentClone = msg.querySelector('.content').cloneNode(true);
            msgBox.appendChild(sender);
            msgBox.appendChild(contentClone);
            elementToExport.appendChild(msgBox);
        });

        const opt = {
            margin: 10,
            filename: `Aquelarre_${selectedWitch}_Conversacion.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, logging: false },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(elementToExport).save().then(() => {
            btn.innerHTML = '<i class="fas fa-check"></i>';
            setTimeout(() => { btn.innerHTML = originalHtml; btn.disabled = false; }, 2000);
        }).catch(() => {
            btn.innerHTML = originalHtml;
            btn.disabled = false;
        });
    };

    headerPdfBtn.addEventListener('click', generatePdf);

    function getWitchColor() {
        if (selectedWitch === 'herta') return '#bc70c7';
        if (selectedWitch === 'featherine') return '#e5b300';
        if (selectedWitch === 'wanda') return '#dc2626';
        return '#06b6d4';
    }

});
