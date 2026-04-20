document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const chatForm = document.getElementById('chatForm');
    const userInput = document.getElementById('userInput');
    const chatMessages = document.getElementById('chatMessages');
    const sendBtn = document.getElementById('sendBtn');
    const chatInputFooter = document.getElementById('chatInputFooter');
    const pdfDownloadArea = document.getElementById('pdfDownloadArea');
    const downloadPdfBtn = document.getElementById('downloadPdfBtn');
    
    // Header Stats
    const turnCountEl = document.getElementById('turnCount');
    const magicFragmentsEl = document.getElementById('magicFragments');
    const turnCounterBadge = document.getElementById('turnCounterBadge');
    
    // Lobby Elements
    const witchLobby = document.getElementById('witchLobby');
    const chatContainer = document.getElementById('chatContainer');
    const witchCards = document.querySelectorAll('.witch-card');
    const startChatBtn = document.getElementById('startChatBtn');
    const activeWitchName = document.getElementById('activeWitchName');

    // State Variables
    let isProcessing = false;
    let selectedWitch = null;
    let turnCount = 0;
    const MAX_TURNS = 3;
    let magicFragments = 0;
    
    // Conversation History for API
    let chatHistory = [];

    // Configure marked.js
    if (typeof marked !== 'undefined') {
        marked.setOptions({
            breaks: true,
            gfm: true,
            headerIds: false,
            mangle: false
        });
    }

    // ===== LOBBY LOGIC =====
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

        // Hide lobby, show chat
        witchLobby.style.opacity = '0';
        setTimeout(() => {
            witchLobby.style.display = 'none';
            chatContainer.style.display = 'flex';
            
            // Set first message based on witch
            initializeWitchEncounter(selectedWitch);
        }, 500);
    });

    const initializeWitchEncounter = (witch) => {
        let title = "Aquelarre";
        let initialMsg = "";

        if (witch === 'herta') {
            title = "The Herta";
            document.documentElement.style.setProperty('--accent-color', '#bc70c7');
            initialMsg = "Vaya, otro humano aburrido. Tienes exactamente tres oportunidades para mantener mi interés antes de que te eche de este espacio virtual. Empieza.";
        } else if (witch === 'featherine') {
            title = "Featherine Augustus Aurora";
            document.documentElement.style.setProperty('--accent-color', '#e5b300');
            initialMsg = "Hmph, un «Child of Man» ha entrado en la ciudad de los libros. Veamos si tu insignificante fragmento de historia logra entretenerme en este tablero. Escribe las primeras líneas de tu guion.";
        } else if (witch === 'wanda') {
            title = "Bruja Escarlata";
            document.documentElement.style.setProperty('--accent-color', '#dc2626');
            initialMsg = "El caos es impredecible, pero yo soy su dueña. No tienes idea de en dónde te has metido. Demuéstrame que tu mente puede soportar mi realidad en tres actos.";
        }

        const imgSrc = witch === 'wanda' ? 'escarlata.jpg' : `${witch}.jpg`;
        activeWitchName.innerHTML = `<img src="assets/images/${imgSrc}" style="width:28px; height:28px; border-radius:50%; margin-right:10px; object-fit:cover; border: 1px solid rgba(255,255,255,0.2); vertical-align: middle;"> ${title}`;
        
        // Add AI initial message to UI and history
        addMessage(initialMsg, 'ai');
        chatHistory.push({ role: 'model', text: initialMsg });
        
        userInput.focus();
    };

    // ===== TEXTAREA AUTO-RESIZE =====
    const autoResizeTextarea = () => {
        userInput.style.height = 'auto';
        const maxHeight = 150;
        const newHeight = Math.min(userInput.scrollHeight, maxHeight);
        userInput.style.height = newHeight + 'px';
    };

    userInput.addEventListener('input', autoResizeTextarea);

    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!isProcessing && userInput.value.trim() && turnCount < MAX_TURNS) {
                chatForm.dispatchEvent(new Event('submit'));
            }
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

    // ===== ADD MESSAGE TO UI =====
    const addMessage = (text, type) => {
        const div = document.createElement('div');
        div.className = `message ${type}`;

        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'avatar';
        avatarDiv.innerHTML = type === 'user'
            ? '<i class="fas fa-user-circle"></i>'
            : '<i class="fas fa-moon"></i>';
        
        if (type === 'ai' && selectedWitch) {
            const imgSrc = selectedWitch === 'wanda' ? 'escarlata.jpg' : `${selectedWitch}.jpg`;
            avatarDiv.innerHTML = `<img src="assets/images/${imgSrc}" style="width:36px; height:36px; border-radius:50%; object-fit:cover; border:1px solid rgba(255,255,255,0.2);">`;
        }
        
        div.appendChild(avatarDiv);

        const contentDiv = document.createElement('div');
        contentDiv.className = 'content';

        if (type === 'ai' && typeof marked !== 'undefined') {
            contentDiv.innerHTML = marked.parse(text);
        } else if (type === 'error') {
            contentDiv.innerHTML = `<p style="color: #ef4444;"><i class="fas fa-exclamation-circle"></i> ${text}</p>`;
        } else {
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

    const createLoadingIndicator = () => {
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'message ai loading';
        loadingDiv.innerHTML = `
            <div class="avatar"><i class="fas fa-circle-notch fa-spin"></i></div>
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

    // Extract magic fragments from AI text
    const extractFragments = (text) => {
        const fragmentRegex = /\[FRAGMENTOS:\s*(\d+)\]/gi;
        let match;
        let sumExtracted = 0;
        let cleanText = text;

        while ((match = fragmentRegex.exec(text)) !== null) {
            let pts = parseInt(match[1], 10);
            if (pts > 35) pts = 35; // HARD CAP to prevent AI hallucinations
            sumExtracted += pts;
        }
        
        cleanText = cleanText.replace(/\[FRAGMENTOS:\s*\d+\]/gi, '').trim();
        
        return { cleanText: cleanText, extractedSum: sumExtracted };
    };

    // ===== HANDLE FORM SUBMISSION =====
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const rawMessage = userInput.value.trim();

        if (!rawMessage || isProcessing || turnCount >= MAX_TURNS) return;

        // Turn management
        turnCount++;
        turnCountEl.textContent = turnCount;
        
        if(turnCount >= MAX_TURNS) {
            turnCounterBadge.style.color = '#ef4444';
        }

        addMessage(rawMessage, 'user');
        chatHistory.push({ role: 'user', text: rawMessage });
        
        userInput.value = '';
        autoResizeTextarea();

        userInput.disabled = true;
        sendBtn.disabled = true;
        isProcessing = true;

        const loadingDiv = createLoadingIndicator();

        try {
            const response = await fetch('api/chat.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: rawMessage,
                    model: 'pro', // Defaulting to pro model for better RPG Persona
                    witch: selectedWitch,
                    history: chatHistory,
                    turnsLeft: MAX_TURNS - turnCount
                })
            });

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            loadingDiv.remove();

            const aiMessageDiv = addMessage('', 'ai');
            const aiContentDiv = aiMessageDiv.querySelector('.content');
            let fullText = '';
            let displayedText = '';
            let currentMsgFragmentsTracked = 0;

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
                                
                                // Process fragments and hide them
                                const fragData = extractFragments(fullText);
                                displayedText = fragData.cleanText;
                                
                                if (fragData.extractedSum > currentMsgFragmentsTracked) {
                                    let diff = fragData.extractedSum - currentMsgFragmentsTracked;
                                    magicFragments += diff;
                                    currentMsgFragmentsTracked = fragData.extractedSum;
                                    
                                    magicFragmentsEl.textContent = magicFragments;
                                    const magicBadge = document.querySelector('.magic-badge');
                                    magicBadge.classList.remove('pulse-animation');
                                    void magicBadge.offsetWidth; // trigger reflow
                                    magicBadge.classList.add('pulse-animation');
                                }                                
                                if (typeof marked !== 'undefined') {
                                    aiContentDiv.innerHTML = marked.parse(displayedText);
                                } else {
                                    aiContentDiv.textContent = displayedText;
                                }
                                scrollToBottom();
                            } else if (data.done) {
                                // Done streaming
                                chatHistory.push({ role: 'model', text: fullText });
                                
                                // If max turns reached, end test
                                if (turnCount >= MAX_TURNS) {
                                    endEvent();
                                }
                            } else if (data.error) {
                                addMessage('Error de magia: ' + data.error, 'error');
                            }
                        } catch (e) {
                            console.error('Error parsing SSE:', e);
                        }
                    }
                }
            }

        } catch (error) {
            loadingDiv.remove();
            addMessage('Error de conexión astral: ' + error.message, 'error');
        } finally {
            if (turnCount < MAX_TURNS) {
                userInput.disabled = false;
                sendBtn.disabled = false;
                userInput.focus();
            }
            isProcessing = false;
        }
    });

    const endEvent = () => {
        chatInputFooter.style.display = 'none';
        pdfDownloadArea.style.display = 'block';
        scrollToBottom();
    };

    // ===== PDF EXPORT =====
    downloadPdfBtn.addEventListener('click', () => {
        downloadPdfBtn.disabled = true;
        downloadPdfBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generando Grimorio...';
        
        const chatContainerEl = document.getElementById('chatMessages');
        
        // Clone for PDF generation to keep styles clean
        const elementToExport = document.createElement('div');
        elementToExport.style.backgroundColor = document.body.style.backgroundColor || '#0a0a0a';
        elementToExport.style.color = '#ffffff';
        elementToExport.style.padding = '20px';
        elementToExport.style.fontFamily = 'Inter, sans-serif';
        
        const header = document.createElement('h2');
        header.style.textAlign = 'center';
        header.style.color = getWitchColor();
        header.textContent = `Aquelarre Einherjer - Prueba de ${activeWitchName.textContent.replace('Aquelarre', '').trim()}`;
        
        const sub = document.createElement('p');
        sub.style.textAlign = 'center';
        sub.style.marginBottom = '20px';
        sub.textContent = `Fragmentos Mágicos Obtenidos: ${magicFragments}`;
        
        elementToExport.appendChild(header);
        elementToExport.appendChild(sub);
        
        // Copy messages text safely
        const msgs = Array.from(chatContainerEl.querySelectorAll('.message'));
        msgs.forEach(msg => {
            if(msg.classList.contains('loading')) return;
            const isUser = msg.classList.contains('user');
            
            const msgBox = document.createElement('div');
            msgBox.style.marginBottom = '15px';
            msgBox.style.padding = '15px';
            msgBox.style.borderRadius = '10px';
            msgBox.style.backgroundColor = isUser ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.05)';
            msgBox.style.borderLeft = isUser ? '4px solid #3b82f6' : `4px solid ${getWitchColor()}`;
            
            const sender = document.createElement('strong');
            sender.style.display = 'block';
            sender.style.marginBottom = '5px';
            sender.style.color = isUser ? '#60a5fa' : getWitchColor();
            sender.textContent = isUser ? 'Jugador' : activeWitchName.textContent.replace('Aquelarre', '').trim();
            
            const contentClone = msg.querySelector('.content').cloneNode(true);
            
            msgBox.appendChild(sender);
            msgBox.appendChild(contentClone);
            elementToExport.appendChild(msgBox);
        });

        const opt = {
            margin:       10,
            filename:     `Aquelarre_${selectedWitch}_Resultado.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true, logging: false },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        // Render PDF
        html2pdf().set(opt).from(elementToExport).save().then(() => {
            downloadPdfBtn.innerHTML = '<i class="fas fa-check"></i> ¡Grimorio Descargado!';
            setTimeout(() => {
                downloadPdfBtn.disabled = false;
                downloadPdfBtn.innerHTML = '<i class="fas fa-file-pdf"></i> Descargar Veredicto (PDF)';
            }, 3000);
        });
    });
    
    function getWitchColor() {
        if(selectedWitch === 'herta') return '#bc70c7';
        if(selectedWitch === 'featherine') return '#e5b300';
        if(selectedWitch === 'wanda') return '#dc2626';
        return '#06b6d4';
    }

    userInput.addEventListener('input', () => {
        sendBtn.disabled = isProcessing || !userInput.value.trim() || turnCount >= MAX_TURNS;
    });
});
