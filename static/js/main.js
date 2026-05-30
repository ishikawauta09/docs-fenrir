/**
 * Fenrir Documentation Portal - Interactivity and Live Playground
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. MOBILE MENU NAVBAR TOGGLE
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('show');
        });
    }

    // 2. COPY TO CLIPBOARD UTILITIES
    setupCopyTriggers();

    // 3. DOCUMENTATION SYSTEM (ONLY ON DOCS PAGE)
    if (document.querySelector('.docs-container')) {
        setupDocsSystem();
    }

    // 4. INTERACTIVE PLAYGROUND SYSTEM (ONLY ON PLAYGROUND PAGE)
    if (document.querySelector('.playground-grid')) {
        setupPlaygroundSystem();
    }
});

/**
 * Hook click handlers to copy elements and code blocks
 */
function setupCopyTriggers() {
    // Command install copy
    const btnCopyInstall = document.getElementById('btnCopyInstall');
    if (btnCopyInstall) {
        btnCopyInstall.addEventListener('click', () => {
            const cmdText = document.getElementById('installCmd').textContent;
            copyTextToClipboard(cmdText, btnCopyInstall);
        });
    }

    // Documentation code blocks copy
    document.querySelectorAll('.btn-code-copy').forEach(btn => {
        btn.addEventListener('click', () => {
            const preElement = btn.closest('.code-container').querySelector('pre');
            if (preElement) {
                // Strip copy button text
                const codeText = preElement.innerText.trim();
                copyTextToClipboard(codeText, btn);
            }
        });
    });
}

function copyTextToClipboard(text, buttonElement) {
    navigator.clipboard.writeText(text).then(() => {
        const originalContent = buttonElement.innerHTML;
        buttonElement.innerHTML = `<i class="fas fa-check" style="color: #10b981;"></i> Copied!`;
        buttonElement.style.pointerEvents = 'none';
        setTimeout(() => {
            buttonElement.innerHTML = originalContent;
            buttonElement.style.pointerEvents = 'auto';
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy text: ', err);
    });
}

/**
 * Handles the single page documentation sidebar navigation and local search
 */
function setupDocsSystem() {
    const sidebarItems = document.querySelectorAll('.sidebar-item');
    const docSections = document.querySelectorAll('.doc-section');
    const searchInput = document.getElementById('docsSearch');

    // Section Switching via Hash/Clicks
    function showSection(targetId) {
        if (!targetId) targetId = 'intro';
        
        let found = false;
        docSections.forEach(section => {
            if (section.id === targetId) {
                section.classList.add('active');
                found = true;
            } else {
                section.classList.remove('active');
            }
        });

        // Fallback to introduction if section not found
        if (!found) {
            const intro = document.getElementById('intro');
            if (intro) intro.classList.add('active');
            targetId = 'intro';
        }

        // Active state in sidebar
        sidebarItems.forEach(item => {
            const link = item.querySelector('a');
            if (link && link.getAttribute('href') === `#${targetId}`) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        // Scroll to top of content
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Bind hash change listener
    window.addEventListener('hashchange', () => {
        const hash = window.location.hash.substring(1);
        showSection(hash);
    });

    // Initial load section check
    const initialHash = window.location.hash.substring(1);
    showSection(initialHash);

    // Local filter search inside sidebar
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            
            sidebarItems.forEach(item => {
                const text = item.textContent.toLowerCase();
                if (text.includes(query)) {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });

            // Toggle visibility of navigation categories
            document.querySelectorAll('.sidebar-nav-category').forEach(category => {
                const visibleItems = category.querySelectorAll('.sidebar-item[style="display: block;"]');
                const title = category.querySelector('.nav-section-title');
                if (visibleItems.length === 0 && query !== '') {
                    if (title) title.style.display = 'none';
                } else {
                    if (title) title.style.display = 'block';
                }
            });
        });
    }
}

/**
 * Handles the interactive playground API clients, WebSocket chat, and SSE event streaming
 */
function setupPlaygroundSystem() {
    const btnParadigms = document.querySelectorAll('.btn-paradigm');
    const playgroundViews = document.querySelectorAll('.playground-view');
    
    // Switch between playground paradigms
    btnParadigms.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetParadigm = btn.getAttribute('data-paradigm');
            
            btnParadigms.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            playgroundViews.forEach(view => {
                if (view.id === `${targetParadigm}-view`) {
                    view.classList.add('active');
                } else {
                    view.classList.remove('active');
                }
            });

            // Reset specific connections if switching
            closeActiveConnections();
        });
    });

    // Close sockets or streams
    let activeWebSocket = null;
    let activeEventSource = null;

    function closeActiveConnections() {
        if (activeWebSocket) {
            activeWebSocket.close();
            activeWebSocket = null;
            updateWsStatus('Disconnected', 'status-400');
        }
        if (activeEventSource) {
            activeEventSource.close();
            activeEventSource = null;
            updateSseStatus('Stopped', 'status-400');
        }
    }

    // --- A. FLASK PARADIGM API RUNNER ---
    const btnRunFlask = document.getElementById('btnRunFlask');
    if (btnRunFlask) {
        btnRunFlask.addEventListener('click', async () => {
            const nameParam = document.getElementById('flaskName').value || 'Fenrir Developer';
            const endpoint = `/api/flask/greet?name=${encodeURIComponent(nameParam)}`;
            
            renderResponseLoader('flaskTerm');
            try {
                const response = await fetch(endpoint);
                const data = await response.json();
                renderResponseTerminal('flaskTerm', response.status, data);
            } catch (err) {
                renderResponseTerminal('flaskTerm', 500, { error: 'Failed to contact Flask API', detail: err.message });
            }
        });
    }

    // --- B. FASTAPI PARADIGM API RUNNER ---
    const btnRunFastapi = document.getElementById('btnRunFastapi');
    if (btnRunFastapi) {
        btnRunFastapi.addEventListener('click', async () => {
            const username = document.getElementById('fastapiUsername').value || 'guest_dev';
            const email = document.getElementById('fastapiEmail').value || 'guest@fenrir.dev';
            const age = parseInt(document.getElementById('fastapiAge').value) || 25;
            const apiKey = document.getElementById('fastapiApiKey').value || 'super-secret-key';
            const role = document.getElementById('fastapiRole').value || 'member';

            const endpoint = `/api/register?role=${encodeURIComponent(role)}`;
            
            renderResponseLoader('fastapiTerm');
            try {
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-API-Key': apiKey
                    },
                    body: JSON.stringify({ username, email, age })
                });
                const data = await response.json();
                renderResponseTerminal('fastapiTerm', response.status, data);
            } catch (err) {
                renderResponseTerminal('fastapiTerm', 500, { error: 'Failed to contact FastAPI endpoint', detail: err.message });
            }
        });
    }

    // --- C. FALCON PARADIGM API RUNNER ---
    const btnRunFalconGet = document.getElementById('btnRunFalconGet');
    const btnRunFalconPost = document.getElementById('btnRunFalconPost');
    
    if (btnRunFalconGet && btnRunFalconPost) {
        btnRunFalconGet.addEventListener('click', () => runFalconRequest('GET'));
        btnRunFalconPost.addEventListener('click', () => runFalconRequest('POST'));
    }

    async function runFalconRequest(method) {
        const itemId = parseInt(document.getElementById('falconItemId').value) || 123;
        const endpoint = `/api/falcon/item/${itemId}`;
        
        renderResponseLoader('falconTerm');
        try {
            let options = { method };
            if (method === 'POST') {
                const subItem = document.getElementById('falconSubItem').value || 'Sub-feature';
                options.headers = { 'Content-Type': 'application/json' };
                options.body = JSON.stringify({ sub_item: subItem, updated_by: 'Falcon Client' });
            }

            const response = await fetch(endpoint, options);
            const data = await response.json();
            renderResponseTerminal('falconTerm', response.status, data);
        } catch (err) {
            renderResponseTerminal('falconTerm', 500, { error: `Failed to contact Falcon Resource (${method})`, detail: err.message });
        }
    }

    // --- D. WEBSOCKET CHAT CONTROLLER ---
    const btnConnectWs = document.getElementById('btnConnectWs');
    const btnSendWs = document.getElementById('btnSendWs');
    const wsInput = document.getElementById('wsInput');
    const wsChatWindow = document.getElementById('wsChatWindow');

    function updateWsStatus(text, statusClass) {
        const statusEl = document.getElementById('wsStatus');
        if (statusEl) {
            statusEl.textContent = text;
            statusEl.className = `response-status ${statusClass}`;
        }
    }

    if (btnConnectWs) {
        btnConnectWs.addEventListener('click', () => {
            if (activeWebSocket) {
                closeActiveConnections();
                btnConnectWs.textContent = 'Connect WebSocket';
                btnConnectWs.className = 'btn btn-primary';
                return;
            }

            const loc = window.location;
            const wsUri = (loc.protocol === 'https:' ? 'wss:' : 'ws:') + '//' + loc.host + '/ws/chat';
            
            appendChatMsg('System', 'Connecting to real-time ASGI channel...', 'chat-msg-server');
            updateWsStatus('Connecting...', 'status-201');

            try {
                activeWebSocket = new WebSocket(wsUri);
                
                activeWebSocket.onopen = () => {
                    updateWsStatus('Connected', 'status-200');
                    appendChatMsg('System', 'WebSocket established successfully! Try typing a message.', 'chat-msg-server');
                    btnConnectWs.textContent = 'Disconnect';
                    btnConnectWs.className = 'btn btn-secondary';
                };

                activeWebSocket.onmessage = (event) => {
                    appendChatMsg('Server Echo', event.data, 'chat-msg-server');
                };

                activeWebSocket.onerror = (err) => {
                    appendChatMsg('Error', 'WebSocket encountered an error.', 'chat-msg-server');
                    console.error('WS Error:', err);
                };

                activeWebSocket.onclose = () => {
                    appendChatMsg('System', 'Connection closed.', 'chat-msg-server');
                    closeActiveConnections();
                    btnConnectWs.textContent = 'Connect WebSocket';
                    btnConnectWs.className = 'btn btn-primary';
                };

            } catch (err) {
                appendChatMsg('System', `Failed to open connection: ${err.message}`, 'chat-msg-server');
                updateWsStatus('Error', 'status-400');
            }
        });
    }

    if (btnSendWs) {
        btnSendWs.addEventListener('click', sendSocketMessage);
    }
    if (wsInput) {
        wsInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendSocketMessage();
        });
    }

    function sendSocketMessage() {
        if (!activeWebSocket || activeWebSocket.readyState !== WebSocket.OPEN) {
            alert('Please connect to the WebSocket first!');
            return;
        }
        const text = wsInput.value.trim();
        if (text === '') return;

        appendChatMsg('You', text, 'chat-msg-user');
        activeWebSocket.send(text);
        wsInput.value = '';
    }

    function appendChatMsg(sender, text, cls) {
        if (!wsChatWindow) return;
        const msgNode = document.createElement('div');
        msgNode.className = `chat-msg ${cls}`;
        msgNode.innerHTML = `<strong>${sender}:</strong> ${escapeHtml(text)}`;
        wsChatWindow.appendChild(msgNode);
        wsChatWindow.scrollTop = wsChatWindow.scrollHeight;
    }

    // --- E. SERVER-SENT EVENTS (SSE) STREAM ---
    const btnConnectSse = document.getElementById('btnConnectSse');
    const sseVisualizer = document.getElementById('sseVisualizer');

    function updateSseStatus(text, statusClass) {
        const statusEl = document.getElementById('sseStatus');
        if (statusEl) {
            statusEl.textContent = text;
            statusEl.className = `response-status ${statusClass}`;
        }
    }

    if (btnConnectSse) {
        btnConnectSse.addEventListener('click', () => {
            if (activeEventSource) {
                closeActiveConnections();
                btnConnectSse.textContent = 'Connect Stream';
                btnConnectSse.className = 'btn btn-primary';
                return;
            }

            if (sseVisualizer) {
                sseVisualizer.innerHTML = '';
            }

            updateSseStatus('Connecting...', 'status-201');
            try {
                activeEventSource = new EventSource('/api/sse/events');

                activeEventSource.onopen = () => {
                    updateSseStatus('Streaming Live', 'status-200');
                    btnConnectSse.textContent = 'Stop Streaming';
                    btnConnectSse.className = 'btn btn-secondary';
                };

                activeEventSource.onmessage = (event) => {
                    const data = JSON.parse(event.data);
                    appendSseTick(data.timestamp, data.random_value, data.active_workers);
                };

                activeEventSource.onerror = (err) => {
                    updateSseStatus('Error', 'status-400');
                    console.error('SSE Error:', err);
                    closeActiveConnections();
                    btnConnectSse.textContent = 'Connect Stream';
                    btnConnectSse.className = 'btn btn-primary';
                };

            } catch (err) {
                updateSseStatus('Error', 'status-400');
                console.error(err);
            }
        });
    }

    function appendSseTick(time, value, workers) {
        if (!sseVisualizer) return;
        
        const tickNode = document.createElement('div');
        tickNode.className = 'sse-tick';
        tickNode.innerHTML = `
            <span class="sse-pulse"></span>
            <span class="sse-time">[${time}]</span>
            <span class="sse-value">Live metrics: Val = <strong>${value}</strong>, Active Workers = <strong>${workers}</strong></span>
        `;
        
        sseVisualizer.prepend(tickNode);
        
        // Cap lines at 8
        if (sseVisualizer.children.length > 8) {
            sseVisualizer.removeChild(sseVisualizer.lastChild);
        }
    }

    // --- TERMINAL UI RENDER HELPER ---
    function renderResponseLoader(terminalId) {
        const bodyEl = document.getElementById(terminalId);
        if (bodyEl) {
            bodyEl.innerHTML = `<span style="color: var(--text-muted);"><i class="fas fa-spinner fa-spin"></i> Awaiting Fenrir ASGI response...</span>`;
        }
    }

    function renderResponseTerminal(terminalId, statusCode, data) {
        const bodyEl = document.getElementById(terminalId);
        const headerEl = bodyEl.closest('.response-wrapper').querySelector('.response-status');
        
        if (headerEl) {
            headerEl.textContent = `HTTP ${statusCode}`;
            headerEl.className = 'response-status';
            if (statusCode >= 200 && statusCode < 300) {
                headerEl.classList.add('status-200');
            } else {
                headerEl.classList.add('status-400');
            }
        }

        if (bodyEl) {
            bodyEl.textContent = JSON.stringify(data, null, 4);
        }
    }
}

/**
 * Escapes HTML characters to prevent XSS injection in WebSocket chat view
 */
function escapeHtml(str) {
    return str.replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")
              .replace(/"/g, "&quot;")
              .replace(/'/g, "&#039;");
}
