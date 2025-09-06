// AI Assistant JavaScript
(function() {
const API_BASE = '/api';

// Global variables
let currentFeature = null;
let chatHistory = [];

// DOM elements will be declared inside DOMContentLoaded
let featureCards, chatInterface, summarizeInterface, conceptsInterface, flashcardsInterface;
let chatMessages, chatInput, sendBtn, clearChatBtn, backBtn;
let summarizeTopic, summarizeLength, generateSummaryBtn, summaryResult, summaryContent, summarySources, summarizeBackBtn, summarizeDocument, summarizeFuzzy;
let conceptsDocument, extractConceptsBtn, conceptsResult, conceptsGrid, conceptsBackBtn;
let flashcardTopic, flashcardCount, generateFlashcardsBtn, flashcardsResult, flashcardsContainer, flashcardsBackBtn;

document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    featureCards = document.querySelectorAll('.feature-card');
    chatInterface = document.getElementById('chatInterface');
    summarizeInterface = document.getElementById('summarizeInterface');
    conceptsInterface = document.getElementById('conceptsInterface');
    flashcardsInterface = document.getElementById('flashcardsInterface');

    // Chat elements
    chatMessages = document.getElementById('chatMessages');
    chatInput = document.getElementById('chatInput');
    sendBtn = document.getElementById('sendBtn');
    clearChatBtn = document.getElementById('clearChat');
    backBtn = document.getElementById('backBtn');

    // Summarize elements
    summarizeTopic = document.getElementById('summarizeTopic');
    summarizeLength = document.getElementById('summarizeLength');
    generateSummaryBtn = document.getElementById('generateSummary');
    summaryResult = document.getElementById('summaryResult');
    summaryContent = document.getElementById('summaryContent');
    summarySources = document.getElementById('summarySources');
    summarizeBackBtn = document.getElementById('summarizeBackBtn');
    summarizeDocument = document.getElementById('summarizeDocument');
    summarizeFuzzy = document.getElementById('summarizeFuzzy');

    // Concepts elements
    conceptsDocument = document.getElementById('conceptsDocument');
    extractConceptsBtn = document.getElementById('extractConcepts');
    conceptsResult = document.getElementById('conceptsResult');
    conceptsGrid = document.getElementById('conceptsGrid');
    conceptsBackBtn = document.getElementById('conceptsBackBtn');

    // Flashcards elements
    flashcardTopic = document.getElementById('flashcardTopic');
    flashcardCount = document.getElementById('flashcardCount');
    generateFlashcardsBtn = document.getElementById('generateFlashcards');
    flashcardsResult = document.getElementById('flashcardsResult');
    flashcardsContainer = document.getElementById('flashcardsContainer');
    flashcardsBackBtn = document.getElementById('flashcardsBackBtn');
    flashcardsDocument = document.getElementById('flashcardsDocument');

    // Now run initialization
    initializeEventListeners();
    loadDocuments();
    setupChatInput();
});



// Initialize event listeners
function initializeEventListeners() {
    // Feature card clicks
    featureCards.forEach(card => {
        card.addEventListener('click', function() {
            const feature = this.getAttribute('data-feature');
            console.log('Feature card clicked:', feature); // DEBUG LOG
            showFeature(feature);
        });
    });

    // Back buttons
    backBtn.addEventListener('click', showFeatureCards);
    summarizeBackBtn.addEventListener('click', showFeatureCards);
    conceptsBackBtn.addEventListener('click', showFeatureCards);
    flashcardsBackBtn.addEventListener('click', showFeatureCards);

    // Chat functionality
    sendBtn.addEventListener('click', sendMessage);
    clearChatBtn.addEventListener('click', clearChat);
    
    // Quick actions
    document.querySelectorAll('.quick-action').forEach(btn => {
        btn.addEventListener('click', function() {
            const action = this.getAttribute('data-action');
            handleQuickAction(action);
        });
    });

    // Summarize functionality
    generateSummaryBtn.addEventListener('click', generateSummary);

    // Concepts functionality
    extractConceptsBtn.addEventListener('click', extractConcepts);

    // Flashcards functionality
    generateFlashcardsBtn.addEventListener('click', generateFlashcards);
}

// Show feature interface
function showFeature(feature) {
    currentFeature = feature;
    
    // Hide all interfaces
    hideAllInterfaces();
    
    // Show selected feature
    switch(feature) {
        case 'chat':
            chatInterface.style.display = 'flex';
            break;
        case 'summarize':
            summarizeInterface.style.display = 'block';
            break;
        case 'concepts':
            conceptsInterface.style.display = 'block';
            break;
        case 'flashcards':
            flashcardsInterface.style.display = 'block';
            break;
    }
    
    // Update active card
    featureCards.forEach(card => {
        card.classList.remove('active');
        if (card.getAttribute('data-feature') === feature) {
            card.classList.add('active');
        }
    });
}

// Show feature cards
function showFeatureCards() {
    currentFeature = null;
    hideAllInterfaces();
    
    // Show feature cards
    document.querySelector('.feature-cards').style.display = 'grid';
    
    // Remove active class
    featureCards.forEach(card => card.classList.remove('active'));
}

// Hide all interfaces
function hideAllInterfaces() {
    document.querySelector('.feature-cards').style.display = 'none';
    chatInterface.style.display = 'none';
    summarizeInterface.style.display = 'none';
    conceptsInterface.style.display = 'none';
    flashcardsInterface.style.display = 'none';
}

// Setup chat input
function setupChatInput() {
    chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // Auto-resize textarea
    chatInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    });
}

// Send message
async function sendMessage() {
    const message = chatInput.value.trim();
    if (!message) return;
    
    // Add user message to chat
    addMessageToChat('user', message);
    chatInput.value = '';
    chatInput.style.height = 'auto';
    
    // Disable send button
    sendBtn.disabled = true;
    
    try {
        // Show typing indicator
        showTypingIndicator();
        
        // Send to AI
        const response = await fetch(`${API_BASE}/ai/qa`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ question: message, maxResults: 10 })
        });
        
        if (response.ok) {
            const data = await response.json();
            addMessageToChat('ai', data.answer);
        } else {
            throw new Error('Failed to get AI response');
        }
    } catch (error) {
        console.error('Chat error:', error);
        addMessageToChat('ai', 'Sorry, I encountered an error. Please try again.');
    } finally {
        hideTypingIndicator();
        sendBtn.disabled = false;
    }
}

// Add message to chat
function addMessageToChat(sender, content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}`;
    
    const avatar = document.createElement('div');
    avatar.className = sender === 'user' ? 'user-avatar' : 'ai-avatar';
    
    if (sender === 'user') {
        avatar.textContent = 'U';
    } else {
        avatar.innerHTML = '<i class="bx bx-bot"></i>';
    }
    
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    bubble.innerHTML = content;
    
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(bubble);
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Store in history
    chatHistory.push({ sender, content, timestamp: new Date() });
}

// Show typing indicator
function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'chat-message';
    typingDiv.id = 'typing-indicator';
    
    typingDiv.innerHTML = `
        <div class="ai-avatar">
            <i class="bx bx-bot"></i>
        </div>
        <div class="message-bubble">
            <div class="typing-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;
    
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Hide typing indicator
function hideTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) {
        indicator.remove();
    }
}

// Clear chat
function clearChat() {
    if (confirm('Are you sure you want to clear the chat history?')) {
        chatMessages.innerHTML = `
            <div class="welcome-message">
                <div class="ai-avatar">
                    <i class='bx bx-bot'></i>
                </div>
                <div class="message-content">
                    <h3>Hello! I'm your AI Study Assistant</h3>
                    <p>I can help you with:</p>
                    <ul>
                        <li>Answering questions about your study materials</li>
                        <li>Providing detailed summaries with page references</li>
                        <li>Extracting key concepts and topics</li>
                        <li>Creating flashcards for better memorization</li>
                    </ul>
                    <p>What would you like to know?</p>
                </div>
            </div>
        `;
        chatHistory = [];
    }
}

// Handle quick actions
function handleQuickAction(action) {
    const input = chatInput.value.trim();
    let enhancedInput = input;
    
    switch(action) {
        case 'summarize':
            enhancedInput = `Please summarize: ${input}`;
            break;
        case 'explain':
            enhancedInput = `Please explain in detail: ${input}`;
            break;
        case 'examples':
            enhancedInput = `Please provide examples for: ${input}`;
            break;
    }
    
    chatInput.value = enhancedInput;
    chatInput.focus();
}

// Generate summary
async function generateSummary() {
    const topic = summarizeTopic.value.trim();
    const length = summarizeLength.value;
    const documentId = summarizeDocument?.value || '';
    const fuzzy = !!(summarizeFuzzy && summarizeFuzzy.checked);
    
    if (!topic) {
        showNotification('Please enter a topic to summarize', 'warning');
        return;
    }
    if (!documentId) {
        showNotification('Please select a document for summarization', 'warning');
        return;
    }
    
    generateSummaryBtn.disabled = true;
    generateSummaryBtn.innerHTML = '<i class="bx bx-loader-alt"></i> Generating...';
    
    try {
        const response = await fetch(`${API_BASE}/ai/summarize`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                topic: topic,
                documentId: documentId,
                fuzzy: fuzzy,
                length: length,
                maxResults: 15 
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            displaySummary({ data, topic });
        } else {
            throw new Error('Failed to generate summary');
        }
    } catch (error) {
        console.error('Summary error:', error);
        showNotification('Failed to generate summary. Please try again.', 'error');
    } finally {
        generateSummaryBtn.disabled = false;
        generateSummaryBtn.innerHTML = '<i class="bx bx-text"></i> Generate Summary';
    }
}

// Display summary
function displaySummary({ data, topic }) {
    const raw = (data && data.summary) ? data.summary : '';
    const html = formatSummary(topic, raw);
    summaryContent.innerHTML = html;
    // Do not show page/slide references or sources list to keep it clean
    summarySources.innerHTML = '';
    summaryResult.style.display = 'block';
    summaryResult.scrollIntoView({ behavior: 'smooth' });
}

// Format raw summary text into a clean heading + bullet list, remove page/slide refs
function formatSummary(topic, raw) {
    const heading = `<h2 class="topic-heading">${escapeHtml(capitalize(topic))}</h2>`;
    const cleaned = stripReferences(raw);
    const bullets = toBullets(cleaned);
    return heading + bullets;
}

function stripReferences(text) {
    if (!text) return '';
    // Remove patterns like (File.pdf, Page 34) or [Slide 10] etc.
    let t = text.replace(/\(([^)]*Page[^)]*)\)/gi, '')
                .replace(/\[(?:[^\]]*page[^\]]*|[^\]]*slide[^\]]*)\]/gi, '')
                .replace(/\bPage\s*\d+\b/gi, '')
                .replace(/\bSlide\s*\d+\b/gi, '')
                .replace(/\s{2,}/g, ' ');
    return t.trim();
}

function toBullets(text) {
    if (!text) return '<ul class="summary-points"><li>No information found for this topic in the selected document.</li></ul>';
    // Try to split by existing bullet markers first
    let parts = text.split(/\n+|•\s+|\-\s+|\*\s+/).map(s => s.trim()).filter(Boolean);
    if (parts.length < 3) {
        // Fallback: split into sentences
        parts = text.split(/(?<=\.)\s+/).map(s => s.trim()).filter(Boolean);
    }
    // Limit overly long bullets and remove duplicates
    const seen = new Set();
    const items = parts
        .map(s => s.replace(/^\d+\)\s*/, '').replace(/^\d+\.\s*/, ''))
        .map(s => cleanMarkdown(s))
        .map(s => s.length > 300 ? s.slice(0, 297) + '…' : s)
        .filter(s => { const key = s.toLowerCase(); if (seen.has(key)) return false; seen.add(key); return true; });
    if (!items.length) {
        return '<ul class="summary-points"><li>No information found for this topic in the selected document.</li></ul>';
    }
    // Classify headings vs descriptions
    const htmlItems = items.map(li => {
        const isHeading = /:$/g.test(li) && li.length <= 80;
        const cls = isHeading ? 'point-heading' : 'point-desc';
        const text = isHeading ? li.replace(/:$/, '') : li;
        return `<li class="${cls}">${escapeHtml(text)}</li>`;
    });
    return '<ul class="summary-points">' + htmlItems.join('') + '</ul>';
}

function escapeHtml(str) {
    return String(str).replace(/[&<>"]/g, function(c){
        return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];
    });
}

function capitalize(str) {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Remove markdown artifacts like **bold**, *emphasis*, underscores, and stray backticks
function cleanMarkdown(s) {
    if (!s) return s;
    return s
        // remove bold/italic markers
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/\*([^*]+)\*/g, '$1')
        .replace(/__([^_]+)__/g, '$1')
        .replace(/_([^_]+)_/g, '$1')
        .replace(/`([^`]+)`/g, '$1')
        // collapse extra spaces
        .replace(/\s{2,}/g, ' ')
        .trim();
}

// Extract concepts
async function extractConcepts() {
    const documentId = conceptsDocument.value;
    extractConceptsBtn.disabled = true;
    extractConceptsBtn.innerHTML = '<i class="bx bx-loader-alt"></i> Extracting...';
    try {
        if (!documentId) {
            showNotification('Please select a document for key concepts.', 'warning');
            extractConceptsBtn.disabled = false;
            extractConceptsBtn.innerHTML = '<i class="bx bx-bulb"></i> Extract Key Concepts';
            return;
        }
        const response = await fetch(`${API_BASE}/ai/concepts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ documentId: documentId, maxResults: 15 })
        });
        if (response.ok) {
            const data = await response.json();
            displayConcepts(data.concepts);
        } else {
            throw new Error('Failed to extract concepts');
        }
    } catch (error) {
        console.error('Concepts error:', error);
        showNotification('Failed to extract concepts. Please try again.', 'error');
    } finally {
        extractConceptsBtn.disabled = false;
        extractConceptsBtn.innerHTML = '<i class="bx bx-bulb"></i> Extract Key Concepts';
    }
}

// Display concepts
function displayConcepts(concepts) {
    conceptsGrid.innerHTML = '';
    if (!concepts || !concepts.length) {
        conceptsGrid.innerHTML = '<div class="empty-state">No key concepts found for this document.</div>';
    } else {
        concepts.forEach(concept => {
            const conceptCard = document.createElement('div');
            conceptCard.className = 'concept-card';
            // Since backend returns an array of strings, not objects
            conceptCard.innerHTML = `<span>${concept}</span>`;
            conceptsGrid.appendChild(conceptCard);
        });
    }
    conceptsResult.style.display = 'block';
    conceptsResult.scrollIntoView({ behavior: 'smooth' });
}

// Generate flashcards
async function generateFlashcards() {
    const topic = flashcardTopic.value.trim();
    const count = flashcardCount.value;
    const documentId = flashcardsDocument.value; // Use the dedicated document selector for flashcards

    if (!topic) {
        showNotification('Please enter a topic for flashcards', 'warning');
        return;
    }
    if (!documentId) {
        showNotification('Please select a document for flashcards', 'warning');
        return;
    }

    generateFlashcardsBtn.disabled = true;
    generateFlashcardsBtn.innerHTML = '<i class="bx bx-loader-alt"></i> Generating...';
    try {
        const response = await fetch(`${API_BASE}/ai/flashcards`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                topic: topic,
                cardCount: parseInt(count),
                documentId: documentId
            })
        });
        if (response.ok) {
            const data = await response.json();
            displayFlashcards(data.flashcards);
        } else {
            throw new Error('Failed to generate flashcards');
        }
    } catch (error) {
        console.error('Flashcards error:', error);
        showNotification('Failed to generate flashcards. Please try again.', 'error');
    } finally {
        generateFlashcardsBtn.disabled = false;
        generateFlashcardsBtn.innerHTML = '<i class="bx bx-card"></i> Generate Flashcards';
    }
}

// Display flashcards
function displayFlashcards(flashcards) {
    flashcardsContainer.innerHTML = '';
    if (!flashcards || !flashcards.length) {
        flashcardsContainer.innerHTML = '<div class="empty-state">No flashcards generated for this document/topic.</div>';
    } else {
        flashcards.forEach((flashcard, index) => {
            const cardDiv = document.createElement('div');
            cardDiv.className = 'flashcard';
            // Our backend returns {front, back, source}
            cardDiv.innerHTML = `
                <div class="flashcard-question">${flashcard.front}</div>
                <div class="flashcard-answer">${flashcard.back}</div>
                <div class="flashcard-source">${flashcard.source}</div>
            `;
            cardDiv.addEventListener('click', function() {
                this.classList.toggle('flipped');
            });
            flashcardsContainer.appendChild(cardDiv);
        });
    }
    flashcardsResult.style.display = 'block';
    flashcardsResult.scrollIntoView({ behavior: 'smooth' });
}

// Load documents for concepts
async function loadDocuments() {
    try {
        const response = await fetch(`${API_BASE}/documents`);
        if (response.ok) {
            const documents = await response.json();
            // Populate conceptsDocument
            documents.forEach(doc => {
                const option = document.createElement('option');
                option.value = doc.id;
                option.textContent = doc.originalFilename;
                conceptsDocument.appendChild(option.cloneNode(true));
            });
            // Populate summarizeDocument
            documents.forEach(doc => {
                const option = document.createElement('option');
                option.value = doc.id;
                option.textContent = doc.originalFilename;
                summarizeDocument.appendChild(option);
            });
            // Populate flashcardsDocument
            documents.forEach(doc => {
                const option = document.createElement('option');
                option.value = doc.id;
                option.textContent = doc.originalFilename;
                flashcardsDocument.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Failed to load documents:', error);
    }
}

// Notification system
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class='bx ${getNotificationIcon(type)}'></i>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">
            <i class='bx bx-x'></i>
        </button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

function getNotificationIcon(type) {
    switch (type) {
        case 'success': return 'bx-check-circle';
        case 'error': return 'bx-error-circle';
        case 'warning': return 'bx-warning';
        default: return 'bx-info-circle';
    }
}
})();

