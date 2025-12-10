document.addEventListener('DOMContentLoaded', () => {
    const chatForm = document.getElementById('chatForm');
    const userInput = document.getElementById('userInput');
    const chatMessages = document.getElementById('chatMessages');
    const modelButton = document.getElementById('modelButton');
    const modelDropdown = document.getElementById('modelDropdown');
    const usageInfo = document.getElementById('usageInfo');

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
        const message = userInput.value.trim();

        if (!message || isProcessing) return;

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
        if (usage.remaining !== undefined) {
            usageInfo.textContent = `Usos restantes hoy: ${usage.remaining}`;
        } else {
            usageInfo.textContent = '';
        }
    };
});
