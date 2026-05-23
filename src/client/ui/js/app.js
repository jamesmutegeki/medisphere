(() => {
  const api = new ApiClient();
  const cc = new CryptoClient();

  const SRP_PRIME_HEX =
    'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF' +
    'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF' +
    'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF' +
    'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF' +
    'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF' +
    'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF' +
    'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF' +
    'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF';

  let ws = null;
  let currentUser = null;
  let currentConversation = null;
  let conversations = [];
  let activeTtl = 0;
  let typingTimeout = null;
  let rateLimit = false;

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);

  // Screens
  const splashScreen = $('#splash');
  const authScreen = $('#auth-screen');
  const mainScreen = $('#main-screen');

  // After splash animation completes (1.5s delay + 2s fade) show auth
  setTimeout(() => {
    splashScreen.classList.add('hidden');
    authScreen.classList.remove('hidden');
  }, 3600);

  // Auth steps
  const authStep1 = $('#auth-step-1');
  const authStepLogin = $('#auth-step-login');
  const authStepRegister = $('#auth-step-register');
  const authStepGen = $('#auth-step-generating');
  const stepDots = $$('.step-dot');
  const stepLines = $$('.step-line');

  // Auth forms
  const loginForm = $('#login-form');
  const registerForm = $('#register-form');
  const loginBtn = $('#login-btn');
  const registerBtn = $('#register-btn');
  const loginError = $('#login-error');
  const registerError = $('#register-error');

  // Key gen
  const genSteps = $$('.gen-step');
  const genStatus = $('#gen-status');

  // Sidebar
  const myAvatar = $('#my-avatar');
  const myUsername = $('#my-username');
  const conversationsList = $('#conversation-items');
  const convCount = $('#conv-count');
  const convEmpty = $('#conv-empty');
  const searchInput = $('#search-input');

  // Chat area
  const chatPlaceholder = $('#chat-placeholder');
  const chatView = $('#chat-view');
  const chatAvatar = $('#chat-avatar');
  const chatUsername = $('#chat-username');
  const messagesList = $('#messages-list');
  const messagesContainer = $('#messages-container');
  const messageInput = $('#message-input');
  const sendBtn = $('#send-btn');
  const typingIndicator = $('#typing-indicator');
  const typingText = $('#typing-text');

  // TTL
  const ttlBtn = $('#ttl-btn');
  const ttlOptions = $('#ttl-options');

  // Modals
  const verifyModal = $('#verify-modal');
  const settingsModal = $('#settings-modal');

  // ===== STEP-BASED AUTH NAVIGATION =====
  function showAuthStep(stepId) {
    $$('.auth-step').forEach(s => s.classList.add('hidden'));
    const target = document.getElementById(stepId);
    if (target) target.classList.remove('hidden');
  }

  function updateStepIndicator(active) {
    stepDots.forEach((dot, i) => {
      const num = i + 1;
      dot.classList.remove('active', 'done');
      if (num < active) dot.classList.add('done');
      else if (num === active) dot.classList.add('active');
    });
    stepLines.forEach((line, i) => {
      const num = i + 1;
      line.classList.remove('done');
      if (num < active) line.classList.add('done');
    });
  }

  // Choice cards
  $$('.choice-card').forEach(card => {
    card.addEventListener('click', () => {
      const target = card.dataset.target;
      if (target === 'login') {
        showAuthStep('auth-step-login');
        updateStepIndicator(2);
      } else if (target === 'register') {
        showAuthStep('auth-step-register');
        updateStepIndicator(2);
      }
    });
  });

  // Back buttons
  $$('.step-back').forEach(btn => {
    btn.addEventListener('click', () => {
      showAuthStep('auth-step-1');
      updateStepIndicator(1);
      loginError.textContent = '';
      registerError.textContent = '';
    });
  });

  // Password strength
  const regPassword = $('#reg-password');
  regPassword.addEventListener('input', () => {
    const val = regPassword.value;
    const bar = $('#strength-bar');
    const text = $('#strength-text');
    let score = 0;
    if (val.length >= 8) score++;
    if (val.length >= 14) score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;
    const colors = ['', '#e17055', '#e17055', '#fdcb6e', '#00b894', '#00b894'];
    const labels = ['', 'Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
    bar.style.width = `${(score / 5) * 100}%`;
    bar.style.background = colors[score] || '';
    text.textContent = labels[score] || '';
  });

  // Register
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = $('#reg-username').value.trim();
    const password = regPassword.value;
    const confirm = $('#reg-confirm').value;
    if (password !== confirm) {
      registerError.textContent = 'Passwords do not match';
      return;
    }
    if (password.length < 8) {
      registerError.textContent = 'Password must be at least 8 characters';
      return;
    }
    registerBtn.classList.add('loading');
    registerError.textContent = '';
    try {
      await api.register(username, password);
      registerError.textContent = 'Account created. Please sign in.';
      registerError.style.color = 'var(--green)';
      setTimeout(() => {
        showAuthStep('auth-step-login');
        updateStepIndicator(2);
        registerError.textContent = '';
        registerError.style.color = '';
      }, 1500);
    } catch (err) {
      registerError.textContent = err.message;
    } finally {
      registerBtn.classList.remove('loading');
    }
  });

  // Login
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = $('#login-username').value.trim();
    const password = $('#login-password').value;

    loginBtn.classList.add('loading');
    loginError.textContent = '';
    try {
      const h1 = await api.srpHandshake1(username);
      const salt = h1.salt;
      const B_bytes = new Uint8Array(h1.B.match(/.{1,2}/g).map(b => parseInt(b, 16)));

      const aArr = window.crypto.getRandomValues(new Uint8Array(64));
      const a = BigInt('0x' + Array.from(aArr).map(b => b.toString(16).padStart(2, '0')).join(''));
      const g = 5n;
      const N = BigInt('0x' + SRP_PRIME_HEX);
      const N_bytes_len = 256;

      // k = SHA-256(N_bytes || 0x05) → matches server
      const N_bytes = bigIntToBytes(N, N_bytes_len);
      const g_byte = new Uint8Array([5]);
      const kCombined = new Uint8Array(N_bytes.length + g_byte.length);
      kCombined.set(N_bytes, 0);
      kCombined.set(g_byte, N_bytes.length);
      const kHash = await window.crypto.subtle.digest('SHA-256', kCombined);
      const k = BigInt('0x' + Array.from(new Uint8Array(kHash)).map(b => b.toString(16).padStart(2, '0')).join(''));

      const A_val = modPow(g, a, N);
      const A_bytes = bigIntToBytes(A_val, N_bytes_len);
      const B = BigInt('0x' + Array.from(B_bytes).map(b => b.toString(16).padStart(2, '0')).join(''));

      // u = SHA-256(A_256_bytes || B_256_bytes) → matches server
      const uCombined = new Uint8Array(N_bytes_len + N_bytes_len);
      uCombined.set(A_bytes, 0);
      uCombined.set(B_bytes, N_bytes_len);
      const uHash = await window.crypto.subtle.digest('SHA-256', uCombined);
      const u = BigInt('0x' + Array.from(new Uint8Array(uHash)).map(b => b.toString(16).padStart(2, '0')).join(''));

      const saltBytes = new Uint8Array(salt.match(/.{1,2}/g).map(b => parseInt(b, 16)));
      const upBytes2 = new TextEncoder().encode(username + ':' + password);
      const xCombined = new Uint8Array(saltBytes.length + upBytes2.length);
      xCombined.set(saltBytes, 0);
      xCombined.set(upBytes2, saltBytes.length);
      const xArr2 = await window.crypto.subtle.digest('SHA-256', xCombined);
      const x = BigInt('0x' + Array.from(new Uint8Array(xArr2)).map(b => b.toString(16).padStart(2, '0')).join(''));
      const S = modPow((B - k * modPow(g, x, N)) % N, (a + u * x) % N, N);

      // K = SHA-256(S_256_bytes) → matches server
      const S_bytes = bigIntToBytes(S, N_bytes_len);
      const K_raw = await window.crypto.subtle.digest('SHA-256', S_bytes);
      const K = new Uint8Array(K_raw);

      // M1 = SHA-256(A_256_bytes || B_256_bytes || K) → matches server
      const m1Combined = new Uint8Array(N_bytes_len + N_bytes_len + K.length);
      m1Combined.set(A_bytes, 0);
      m1Combined.set(B_bytes, N_bytes_len);
      m1Combined.set(K, N_bytes_len + N_bytes_len);
      const M1_hash = await window.crypto.subtle.digest('SHA-256', m1Combined);
      const M1 = new Uint8Array(M1_hash);

      const h2 = await api.srpHandshake2(username, A_bytes, M1);
      api.token = h2.token;

      const me = await api.getMe();
      api.userId = me.id;
      currentUser = me;

      // Show key generation step before init
      showAuthStep('auth-step-generating');
      updateStepIndicator(3);
      await initApp();
    } catch (err) {
      loginError.textContent = err.message || 'Authentication failed';
      loginBtn.classList.remove('loading');
    }
  });

  async function sha256(str) {
    const hash = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function modPow(base, exp, mod) {
    if (mod === 1n) return 0n;
    let result = 1n;
    base = base % mod;
    while (exp > 0n) {
      if (exp % 2n === 1n) result = (result * base) % mod;
      exp = exp >> 1n;
      base = (base * base) % mod;
    }
    return result;
  }

  function bigIntToBytes(n, minLen) {
    let hex = n.toString(16);
    if (hex.length % 2) hex = '0' + hex;
    const bytes = new Uint8Array(hex.match(/.{1,2}/g).map(b => parseInt(b, 16)));
    if (bytes.length >= minLen) return bytes;
    const padded = new Uint8Array(minLen);
    padded.set(bytes, minLen - bytes.length);
    return padded;
  }

  async function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  // Initialize app after login
  async function initApp() {
    const hasIdentity = localStorage.getItem('identityKey_' + api.userId);
    let needKeyGen = false;
    if (!hasIdentity) {
      needKeyGen = true;
    } else {
      try {
        const stored = JSON.parse(hasIdentity);
        cc.identityKeyPair = await cc.importPrivateKey(
          new Uint8Array(stored.private.match(/.{1,2}/g).map(b => parseInt(b, 16)))
        );
      } catch {
        needKeyGen = true;
      }
    }

    if (needKeyGen) {
      genStatus.textContent = 'Creating your identity keypair...';
      genSteps[0].classList.add('active');
      await sleep(600);

      const keyPair = await window.crypto.subtle.generateKey({ name: 'X25519' }, true, ['deriveBits']);
      cc.identityKeyPair = keyPair;
      const pub = await cc.getPublicKeyBytes(keyPair);
      const priv = await cc.getPrivateKeyBytes(keyPair);
      localStorage.setItem('identityKey_' + api.userId, JSON.stringify({
        public: Array.from(pub).map(b => b.toString(16).padStart(2, '0')).join(''),
        private: Array.from(priv).map(b => b.toString(16).padStart(2, '0')).join(''),
      }));

      genSteps[0].classList.remove('active');
      genSteps[0].classList.add('done');

      genStatus.textContent = 'Generating signed pre-key...';
      genSteps[1].classList.add('active');
      await sleep(600);
    }

    const spk = await window.crypto.subtle.generateKey({ name: 'X25519' }, true, ['deriveBits']);
    const spkPub = await cc.getPublicKeyBytes(spk);
    const spkPriv = await cc.getPrivateKeyBytes(spk);

    if (needKeyGen) {
      genSteps[1].classList.remove('active');
      genSteps[1].classList.add('done');

      genStatus.textContent = 'Generating one-time pre-keys (100)...';
      genSteps[2].classList.add('active');
      await sleep(800);
    }

    const identityPub = await cc.getPublicKeyBytes(cc.identityKeyPair);
    const sigCombined = new Uint8Array(spkPub.length + new TextEncoder().encode(api.userId).length);
    sigCombined.set(spkPub, 0);
    sigCombined.set(new TextEncoder().encode(api.userId), spkPub.length);
    const sigHashRaw = await window.crypto.subtle.digest('SHA-256', sigCombined);
    const signature = new Uint8Array(sigHashRaw);

    const opks = [];
    for (let i = 0; i < 100; i++) {
      const k = await window.crypto.subtle.generateKey({ name: 'X25519' }, true, ['deriveBits']);
      opks.push(await cc.getPublicKeyBytes(k));
    }

    if (needKeyGen) {
      genSteps[2].classList.remove('active');
      genSteps[2].classList.add('done');

      genStatus.textContent = 'Uploading key bundle to server...';
      genSteps[3].classList.add('active');
      await sleep(500);
    }

    await api.uploadBundle(identityPub, spkPub, signature, opks);

    if (needKeyGen) {
      genSteps[3].classList.remove('active');
      genSteps[3].classList.add('done');
      await sleep(300);
    }

    localStorage.setItem('signedPrekey_' + api.userId, Array.from(spkPriv).map(b => b.toString(16).padStart(2, '0')).join(''));

    authScreen.classList.add('hidden');
    mainScreen.classList.remove('hidden');
    myUsername.textContent = currentUser.username;
    myAvatar.textContent = currentUser.username[0].toUpperCase();

    connectWebSocket();
    loadConversations();
  }

  // WebSocket
  function connectWebSocket() {
    const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${proto}//${location.host}/ws/v1/chat?token=${api.token}`;
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {};

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        handleWsEvent(msg);
      } catch (e) {
        console.error('WS parse error', e);
      }
    };

    ws.onclose = () => {
      setTimeout(connectWebSocket, 3000);
    };

    ws.onerror = () => {
      ws.close();
    };
  }

  function handleWsEvent(msg) {
    const { event, data } = msg;
    switch (event) {
      case 'new_message':
        handleNewMessage(data);
        break;
      case 'delivered':
        break;
      case 'typing':
        showTypingIndicator(data.from, true);
        break;
      case 'stopped_typing':
        showTypingIndicator(data.from, false);
        break;
      case 'read_receipt':
        handleReadReceipt(data);
        break;
      case 'status_change':
        handleStatusChange(data);
        break;
    }
  }

  async function handleNewMessage(data) {
    const fromId = data.from;
    if (fromId === currentConversation) {
      try {
        const plaintext = await decryptIncomingMessage(data);
        addMessageToUI({
          senderId: fromId,
          text: new TextDecoder().decode(plaintext),
          timestamp: new Date().toISOString(),
          isSent: false,
          isRead: false,
          messageNumber: data.message_number,
          fileId: data.file_id,
        });
        markMessageRead(data.message_id);
      } catch (e) {
        console.error('Decryption failed', e);
      }
    }
    await loadConversations();
  }

  async function decryptIncomingMessage(data) {
    const fromId = data.from;
    const sessionKey = `session_${fromId}`;
    let session = cc.sessions.get(sessionKey);

    if (!session) {
      const stored = localStorage.getItem(sessionKey);
      if (stored) {
        session = JSON.parse(stored);
        cc.sessions.set(sessionKey, session);
      }
    }

    if (!session) {
      const bundle = await api.getUser(fromId);
      const theirIdentity = cc._base64ToBytes(bundle.identity_key);
      const epKey = cc._base64ToBytes(data.ratchet_key);

      const spkPrivHex = localStorage.getItem('signedPrekey_' + api.userId);
      const spkPriv = await window.crypto.subtle.importKey(
        'pkcs8',
        new Uint8Array(spkPrivHex.match(/.{1,2}/g).map(b => parseInt(b, 16))),
        { name: 'X25519' },
        true,
        ['deriveBits']
      );

      const sharedSecret = await cc.x3dhReceive(
        theirIdentity, epKey, data.used_opk_id || -1,
        { privateKey: spkPriv, publicKey: await window.crypto.subtle.importKey('raw', cc._base64ToBytes(bundle.identity_key), { name: 'X25519' }, true, []) },
        new Map()
      );

      session = {
        sharedSecret: Array.from(sharedSecret).map(b => b.toString(16).padStart(2, '0')).join(''),
        receiveChain: null,
        sendChain: null,
        receiveCount: 0,
        sendCount: 0,
        theirRatchet: epKey,
        ourRatchet: null,
      };
      cc.sessions.set(sessionKey, session);
      localStorage.setItem(sessionKey, JSON.stringify(session));
    }

    const sharedBytes = new Uint8Array(session.sharedSecret.match(/.{1,2}/g).map(b => parseInt(b, 16)));
    const msgKey = await cc.hkdf(
      new TextEncoder().encode('SecureMessengerMessageV1'),
      sharedBytes,
      new TextEncoder().encode('msg_' + data.message_number)
    );

    const ct = cc._base64ToBytes(data.ciphertext);
    return await cc.decryptMessage(ct, msgKey);
  }

  function showTypingIndicator(fromId, isTyping) {
    if (fromId === currentConversation) {
      if (isTyping) {
        typingIndicator.classList.remove('hidden');
        typingText.textContent = chatUsername.textContent + ' is typing...';
      } else {
        typingIndicator.classList.add('hidden');
      }
    }
  }

  function handleReadReceipt(data) {
    if (data.from === currentConversation) {
      const msgs = messagesList.querySelectorAll('.message.sent');
      msgs.forEach(m => {
        const status = m.querySelector('.message-status');
        if (status) {
          status.textContent = '\u2713\u2713';
          status.classList.add('read');
        }
      });
    }
  }

  function handleStatusChange(data) {
    const convItems = $$('.conversation-item');
    convItems.forEach(item => {
      if (item.dataset.userId === data.user_id) {
        const status = item.querySelector('.conv-status');
        if (status) {
          status.textContent = data.status;
          status.className = 'conv-status ' + data.status;
        }
      }
    });
    if (data.user_id === currentConversation) {
      const statusEl = $('#chat-status');
      statusEl.innerHTML = `<span class="encryption-indicator"><span class="lock-pulse"></span>${data.status === 'online' ? 'Online' : 'Offline'} \u00B7 Encrypted</span>`;
    }
  }

  // Load conversations
  async function loadConversations() {
    try {
      const inbox = await api.getInbox(200);
      const userIds = new Set();
      inbox.forEach(m => {
        userIds.add(m.sender_id === api.userId ? m.recipient_id : m.sender_id);
      });

      conversations = [];
      for (const uid of userIds) {
        try {
          const user = await api.getUser(uid);
          conversations.push(user);
        } catch {}
      }

      renderConversations();
    } catch (e) {
      console.error('Load conversations error', e);
    }
  }

  function renderConversations() {
    conversationsList.innerHTML = '';
    convCount.textContent = conversations.length;
    convEmpty.classList.toggle('hidden', conversations.length > 0);

    conversations.forEach(user => {
      const div = document.createElement('div');
      div.className = 'conversation-item' + (user.id === currentConversation ? ' active' : '');
      div.dataset.userId = user.id;
      div.innerHTML = `
        <div class="avatar">${(user.display_name || user.username)[0].toUpperCase()}</div>
        <div class="conversation-info">
          <div class="conversation-name">${user.display_name || user.username}</div>
          <div class="conversation-preview">${user.identity_key ? 'Encrypted' : 'No key exchange'}</div>
        </div>
        <div class="conversation-meta">
          <div class="conv-status ${user.last_online ? 'online' : 'offline'}">${user.last_online ? 'online' : 'offline'}</div>
        </div>
      `;
      div.addEventListener('click', () => openConversation(user));
      conversationsList.appendChild(div);
    });
  }

  // Open conversation
  async function openConversation(user) {
    currentConversation = user.id;
    chatPlaceholder.classList.add('hidden');
    chatView.classList.remove('hidden');
    chatUsername.textContent = user.display_name || user.username;
    chatAvatar.textContent = (user.display_name || user.username)[0].toUpperCase();
    $('#chat-status').innerHTML = `<span class="encryption-indicator"><span class="lock-pulse"></span>Encrypted</span>`;

    $$('.conversation-item').forEach(i => i.classList.remove('active'));
    const activeItem = document.querySelector(`.conversation-item[data-user-id="${user.id}"]`);
    if (activeItem) activeItem.classList.add('active');

    messagesList.innerHTML = '';
    messageInput.disabled = false;
    sendBtn.disabled = false;
    messageInput.focus();

    updateLastSeen(user.id);

    try {
      const msgs = await api.getConversation(user.id);
      msgs.reverse();
      for (const msg of msgs) {
        try {
          const fromMe = msg.sender_id === api.userId;
          let plaintext = '[encrypted]';
          try {
            const ct = cc._base64ToBytes(msg.ciphertext);
            const sessionKey = `session_${fromMe ? msg.recipient_id : msg.sender_id}`;
            let session = cc.sessions.get(sessionKey);
            if (session) {
              const sharedBytes = new Uint8Array(session.sharedSecret.match(/.{1,2}/g).map(b => parseInt(b, 16)));
              const msgKey = await cc.hkdf(
                new TextEncoder().encode('SecureMessengerMessageV1'),
                sharedBytes,
                new TextEncoder().encode('msg_' + msg.message_number)
              );
              const decrypted = await cc.decryptMessage(ct, msgKey);
              plaintext = new TextDecoder().decode(decrypted);
            }
          } catch {}
          addMessageToUI({
            id: msg.id,
            senderId: msg.sender_id,
            text: plaintext,
            timestamp: msg.created_at,
            isSent: fromMe,
            isRead: msg.is_read,
            messageNumber: msg.message_number,
            fileId: msg.file_id,
            ttl: msg.ttl_seconds,
          });
        } catch {}
      }
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    } catch (e) {
      console.error('Load conversation error', e);
    }
  }

  // Send message
  sendBtn.addEventListener('click', sendMessage);
  messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  messageInput.addEventListener('input', () => {
    sendBtn.disabled = !messageInput.value.trim();
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        event: 'typing',
        data: { recipient_id: currentConversation, is_typing: true },
      }));
      clearTimeout(typingTimeout);
      typingTimeout = setTimeout(() => {
        ws.send(JSON.stringify({
          event: 'typing',
          data: { recipient_id: currentConversation, is_typing: false },
        }));
      }, 2000);
    }
  });

  async function sendMessage() {
    const text = messageInput.value.trim();
    if (!text || !currentConversation || rateLimit) return;

    rateLimit = true;
    setTimeout(() => { rateLimit = false; }, 500);

    messageInput.value = '';
    sendBtn.disabled = true;

    try {
      const sessionKey = `session_${currentConversation}`;
      let session = cc.sessions.get(sessionKey);
      if (!session) {
        const bundle = await api.getBundle(currentConversation);
        const result = await cc.x3dhInit(bundle);

        const sharedHex = Array.from(result.sharedSecret).map(b => b.toString(16).padStart(2, '0')).join('');
        session = {
          sharedSecret: sharedHex,
          receiveChain: null,
          sendChain: null,
          receiveCount: 0,
          sendCount: 1,
          theirRatchet: Array.from(result.theirIdentityPub).map(b => b.toString(16).padStart(2, '0')).join(''),
          ourRatchet: Array.from(result.ephemeralKey).map(b => b.toString(16).padStart(2, '0')).join(''),
        };
        cc.sessions.set(sessionKey, session);
        localStorage.setItem(sessionKey, JSON.stringify(session));
      }

      const sharedBytes = new Uint8Array(session.sharedSecret.match(/.{1,2}/g).map(b => parseInt(b, 16)));
      const msgNumber = session.sendCount || 0;
      session.sendCount = msgNumber + 1;

      const msgKey = await cc.hkdf(
        new TextEncoder().encode('SecureMessengerMessageV1'),
        sharedBytes,
        new TextEncoder().encode('msg_' + msgNumber)
      );

      const plaintext = new TextEncoder().encode(text);
      const ciphertext = await cc.encryptMessage(plaintext, msgKey);

      const prevCount = 0;
      const ratchetKey = new Uint8Array(session.ourRatchet ? session.ourRatchet.match(/.{1,2}/g).map(b => parseInt(b, 16)) : []);

      const result = await api.sendMessage(
        currentConversation, ciphertext, msgNumber, prevCount, ratchetKey,
        1, null, activeTtl || null
      );

      localStorage.setItem(sessionKey, JSON.stringify(session));

      addMessageToUI({
        id: result.message_id,
        senderId: api.userId,
        text: text,
        timestamp: new Date().toISOString(),
        isSent: true,
        isRead: false,
        messageNumber: msgNumber,
        ttl: activeTtl,
      });

      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          event: 'send_message',
          data: {
            recipient_id: currentConversation,
            ciphertext: btoa(String.fromCharCode(...ciphertext)),
            message_number: msgNumber,
            prev_send_count: prevCount,
            ratchet_key: btoa(String.fromCharCode(...ratchetKey)),
            message_type: 1,
            message_id: result.message_id,
          },
        }));
      }

      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    } catch (e) {
      console.error('Send error', e);
      messageInput.value = text;
      sendBtn.disabled = false;
    }
  }

  function addMessageToUI(msg) {
    const div = document.createElement('div');
    div.className = `message ${msg.isSent ? 'sent' : 'received'}`;
    div.dataset.msgId = msg.id ? msg.id.substring(0, 8) : 'msg-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
    if (msg.fileId) {
      div.innerHTML = `
        <div class="file-attachment">
          <svg class="file-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          <div>
            <div class="file-name">Encrypted file</div>
            <div class="file-size">End-to-end encrypted</div>
          </div>
        </div>
        <span class="message-time">${formatTime(msg.timestamp)}</span>
      `;
    } else {
      div.innerHTML = `
        ${msg.text}
        <span class="message-time">
          ${formatTime(msg.timestamp)}
          ${msg.isSent ? `<span class="message-status ${msg.isRead ? 'read' : 'delivered'}">${msg.isRead ? '\u2713\u2713' : '\u2713'}</span>` : ''}
          ${msg.ttl ? `<span class="ttl-badge">${msg.ttl}s</span>` : ''}
        </span>
      `;
    }
    messagesList.appendChild(div);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function formatTime(ts) {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function markMessageRead(messageId) {
    api.markRead(messageId).catch(() => {});
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        event: 'read_receipt',
        data: { recipient_id: currentConversation, message_id: messageId },
      }));
    }
  }

  // TTL selector
  ttlBtn.addEventListener('click', () => {
    ttlOptions.classList.toggle('hidden');
  });

  ttlOptions.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      const ttl = parseInt(btn.dataset.ttl);
      activeTtl = ttl;
      ttlOptions.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      if (ttl > 0) btn.classList.add('active');
      ttlBtn.classList.toggle('active', ttl > 0);
      ttlOptions.classList.add('hidden');
    });
  });

  // Close TTL options on click outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.ttl-wrap')) {
      ttlOptions.classList.add('hidden');
    }
  });

  // Identity verification
  $('#verify-identity-btn').addEventListener('click', async () => {
    if (!currentConversation) return;
    verifyModal.classList.remove('hidden');

    const myPub = await cc.getPublicKeyBytes(cc.identityKeyPair);
    const myFp = await cc.generateFingerprint(myPub);

    let theirFp = '---';
    try {
      const user = await api.getUser(currentConversation);
      if (user.identity_key) {
        const theirPub = cc._base64ToBytes(user.identity_key);
        theirFp = await cc.generateFingerprint(theirPub);
      }
    } catch {}

    $('#my-fingerprint').textContent = myFp;
    $('#their-fingerprint').textContent = theirFp;
    $('#verify-username').textContent = chatUsername.textContent;

    const statusEl = $('#verification-status');
    if (myFp && theirFp && myFp !== '---' && theirFp !== '---') {
      statusEl.innerHTML = '<span class="status-icon">\u{1F512}</span><span>Compare these fingerprints in person or via a trusted channel to verify identity.</span>';
      statusEl.className = 'verification-status';
    }
  });

  $('#verify-modal-close').addEventListener('click', () => {
    verifyModal.classList.add('hidden');
  });

  $('#verify-copy-fp').addEventListener('click', () => {
    const fp = $('#their-fingerprint').textContent;
    navigator.clipboard.writeText(fp).then(() => {
      $('#verify-copy-fp').textContent = 'Copied!';
      setTimeout(() => { $('#verify-copy-fp').textContent = 'Copy Their Fingerprint'; }, 2000);
    });
  });

  verifyModal.addEventListener('click', (e) => {
    if (e.target === verifyModal) verifyModal.classList.add('hidden');
  });

  // Settings
  $('#settings-btn').addEventListener('click', async () => {
    settingsModal.classList.remove('hidden');
    $('#settings-username').textContent = currentUser.username;
    $('#settings-userid').textContent = currentUser.id;
    const pub = await cc.getPublicKeyBytes(cc.identityKeyPair);
    const fp = await cc.generateFingerprint(pub);
    $('#settings-fingerprint').textContent = fp;
  });

  $('#settings-modal-close').addEventListener('click', () => {
    settingsModal.classList.add('hidden');
  });

  settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) settingsModal.classList.add('hidden');
  });

  // Logout
  $('#logout-btn').addEventListener('click', async () => {
    try { await api.logout(); } catch {}
    if (ws) ws.close();
    api.token = null;
    api.userId = null;
    cc.sessions.clear();
    currentConversation = null;
    mainScreen.classList.add('hidden');
    authScreen.classList.remove('hidden');
    settingsModal.classList.add('hidden');
    $('#login-password').value = '';
    $('#login-error').textContent = '';
    messagesList.innerHTML = '';
    chatView.classList.add('hidden');
    chatPlaceholder.classList.remove('hidden');
    showAuthStep('auth-step-1');
    updateStepIndicator(1);
  });

  // Search users
  searchInput.addEventListener('input', async () => {
    const q = searchInput.value.trim();
    if (q.length < 1) {
      renderConversations();
      return;
    }
    try {
      const users = await api.searchUsers(q);
      conversationsList.innerHTML = '';
      convEmpty.classList.add('hidden');
      users.forEach(user => {
        const div = document.createElement('div');
        div.className = 'conversation-item';
        div.dataset.userId = user.id;
        div.innerHTML = `
          <div class="avatar">${(user.display_name || user.username)[0].toUpperCase()}</div>
          <div class="conversation-info">
            <div class="conversation-name">${user.display_name || user.username}</div>
            <div class="conversation-preview">${user.identity_key ? 'Encrypted' : 'No keys'}</div>
          </div>
        `;
        div.addEventListener('click', () => openConversation(user));
        conversationsList.appendChild(div);
      });
    } catch {}
  });

  // File sharing
  $('#file-input').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file || !currentConversation) return;

    try {
      const fileKey = window.crypto.getRandomValues(new Uint8Array(32));
      const fileData = await file.arrayBuffer();
      const nonce = window.crypto.getRandomValues(new Uint8Array(12));
      const aesKey = await window.crypto.subtle.importKey('raw', fileKey, { name: 'AES-GCM' }, false, ['encrypt']);
      const encrypted = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: nonce },
        aesKey,
        fileData
      );

      const encryptedPayload = new Uint8Array(nonce.length + encrypted.byteLength);
      encryptedPayload.set(nonce, 0);
      encryptedPayload.set(new Uint8Array(encrypted), nonce.length);

      const sessionKey = `session_${currentConversation}`;
      let session = cc.sessions.get(sessionKey);
      if (!session) {
        const bundle = await api.getBundle(currentConversation);
        const x = await cc.x3dhInit(bundle);
        const sh = Array.from(x.sharedSecret).map(b => b.toString(16).padStart(2, '0')).join('');
        session = { sharedSecret: sh, sendCount: 0 };
        cc.sessions.set(sessionKey, session);
      }

      const sharedBytes = new Uint8Array(session.sharedSecret.match(/.{1,2}/g).map(b => parseInt(b, 16)));
      const msgKey = await cc.hkdf(
        new TextEncoder().encode('SecureMessengerMessageV1'),
        sharedBytes,
        new TextEncoder().encode('file_key_' + Date.now())
      );

      const encryptedKey = await cc.encryptMessage(fileKey, msgKey);

      const blob = new Blob([encryptedPayload], { type: 'application/octet-stream' });
      const uploadFile = new File([blob], file.name, { type: 'application/octet-stream' });
      const result = await api.uploadFile(uploadFile, encryptedKey, file.type || 'application/octet-stream');

      await api.sendMessage(
        currentConversation, new Uint8Array(0), 0, 0, new Uint8Array(32),
        2, result.file_id, activeTtl || null
      );

      addMessageToUI({
        senderId: api.userId,
        text: 'Encrypted file sent',
        timestamp: new Date().toISOString(),
        isSent: true,
        fileId: result.file_id,
        ttl: activeTtl,
      });
    } catch (err) {
      console.error('File upload error', err);
    }

    e.target.value = '';
  });

  // Close modals on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      verifyModal.classList.add('hidden');
      settingsModal.classList.add('hidden');
      ttlOptions.classList.add('hidden');
    }
  });

  // Theme Toggle (Light/Dark)
  let isDark = localStorage.getItem('theme') !== 'light';
  if (!isDark) document.body.classList.add('light');
  $('#theme-toggle-btn').addEventListener('click', () => {
    isDark = !isDark;
    document.body.classList.toggle('light', !isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  });

  // Sound Notification
  function playNotificationSound() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const t = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.connect(gain1); gain1.connect(ctx.destination);
      osc1.frequency.value = 800; gain1.gain.setValueAtTime(0.1, t);
      osc1.start(t); osc1.stop(t + 0.1);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2); gain2.connect(ctx.destination);
      osc2.frequency.value = 1000; gain2.gain.setValueAtTime(0.05, t + 0.1);
      osc2.start(t + 0.1); osc2.stop(t + 0.2);
    } catch (e) {}
  }

  // Message Reactions
  let reactingToMessageId = null;

  messagesList.addEventListener('dblclick', (e) => {
    const msg = e.target.closest('.message');
    if (!msg || !msg.dataset.msgId) return;
    showReactionPicker(msg);
  });

  function showReactionPicker(msgEl) {
    const picker = $('#reaction-picker');
    reactingToMessageId = msgEl.dataset.msgId;
    const rect = msgEl.getBoundingClientRect();
    picker.style.bottom = (window.innerHeight - rect.top + 10) + 'px';
    picker.style.left = Math.min(rect.left + rect.width / 2 - 80, window.innerWidth - 200) + 'px';
    picker.classList.remove('hidden');

    clearTimeout(picker._hideTimer);
    picker._hideTimer = setTimeout(() => picker.classList.add('hidden'), 3000);
  }

  $('#reaction-picker').addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn || !reactingToMessageId) return;
    const reaction = btn.dataset.reaction;
    const msg = messagesList.querySelector(`[data-msg-id="${reactingToMessageId}"]`);
    if (msg) {
      let reactions = msg.querySelector('.reactions');
      if (!reactions) {
        reactions = document.createElement('div');
        reactions.className = 'reactions';
        msg.appendChild(reactions);
      }
      let existing = reactions.querySelector(`[data-reaction="${reaction}"]`);
      if (existing) {
        existing.remove();
        if (reactions.children.length === 0) reactions.remove();
      } else {
        const el = document.createElement('span');
        el.className = 'reaction active';
        el.dataset.reaction = reaction;
        el.textContent = reaction;
        reactions.appendChild(el);
      }
    }
    $('#reaction-picker').classList.add('hidden');
    reactingToMessageId = null;
  });

  // Export Conversation
  $('#export-chat-btn').addEventListener('click', () => {
    if (!currentConversation) return;
    const msgs = messagesList.querySelectorAll('.message');
    const lines = [`Secure Messenger — Conversation Export`,
      `Date: ${new Date().toISOString()}`,
      `Contact: ${chatUsername.textContent}`,
      `Total messages: ${msgs.length}`,
      `Encryption: End-to-end encrypted (X25519 + AES-256-GCM)`,
      `Export includes decrypted content only.`,
      `==========================================`, ''];
    msgs.forEach(m => {
      const isSent = m.classList.contains('sent');
      const sender = isSent ? 'You' : chatUsername.textContent;
      const time = m.querySelector('.message-time')?.textContent || '';
      const text = m.childNodes[0]?.textContent?.trim() || '';
      const reactions = m.querySelector('.reactions');
      const reactStr = reactions ? ' [' + Array.from(reactions.querySelectorAll('.reaction')).map(r => r.textContent).join(' ') + ']' : '';
      lines.push(`[${time}] ${sender}: ${text}${reactStr}`);
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `secure-chat-${chatUsername.textContent}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  });

  // In-Chat Search
  let searchResults = [];
  let searchIndex = -1;

  $('#search-chat-btn').addEventListener('click', () => {
    $('#chat-search-bar').classList.toggle('hidden');
    if (!$('#chat-search-bar').classList.contains('hidden')) {
      $('#chat-search-input').focus();
    }
  });

  $('#chat-search-close').addEventListener('click', () => {
    $('#chat-search-bar').classList.add('hidden');
    clearSearchHighlights();
  });

  $('#chat-search-input').addEventListener('input', () => {
    const q = $('#chat-search-input').value.trim().toLowerCase();
    clearSearchHighlights();
    if (!q) return;
    searchResults = [];
    searchIndex = -1;
    const msgs = messagesList.querySelectorAll('.message');
    msgs.forEach(m => {
      const text = (m.childNodes[0]?.textContent || '').toLowerCase();
      if (text.includes(q)) {
        m.classList.add('chat-search-highlight');
        searchResults.push(m);
      }
    });
    if (searchResults.length > 0) {
      searchIndex = 0;
      searchResults[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    updateSearchCount();
  });

  function updateSearchCount() {
    const countEl = $('#search-count');
    if (searchResults.length > 0 && searchIndex >= 0) {
      countEl.textContent = `${searchIndex + 1}/${searchResults.length}`;
    } else {
      countEl.textContent = '';
    }
  }

  $('#search-prev').addEventListener('click', () => {
    if (searchResults.length === 0) return;
    searchIndex = (searchIndex - 1 + searchResults.length) % searchResults.length;
    searchResults[searchIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
    updateSearchCount();
  });

  $('#search-next').addEventListener('click', () => {
    if (searchResults.length === 0) return;
    searchIndex = (searchIndex + 1) % searchResults.length;
    searchResults[searchIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
    updateSearchCount();
  });

  function clearSearchHighlights() {
    messagesList.querySelectorAll('.chat-search-highlight').forEach(m => m.classList.remove('chat-search-highlight'));
    searchResults = [];
    searchIndex = -1;
    $('#search-count').textContent = '';
  }

  // Last Seen
  function updateLastSeen(userId) {
    api.getUser(userId).then(u => {
      if (u.last_online) {
        const d = new Date(u.last_online);
        const now = new Date();
        const diff = (now - d) / 1000;
        let label = '';
        if (diff < 60) label = 'Just now';
        else if (diff < 3600) label = `${Math.floor(diff / 60)}m ago`;
        else if (diff < 86400) label = `${Math.floor(diff / 3600)}h ago`;
        else label = d.toLocaleDateString();
        const el = $('#chat-status');
        el.innerHTML = `<span class="encryption-indicator"><span class="lock-pulse"></span>Last seen ${label}</span>`;
      }
    }).catch(() => {});
  }

  // Sound on new message (when not focused)
  let windowFocused = true;
  window.addEventListener('focus', () => { windowFocused = true; });
  window.addEventListener('blur', () => { windowFocused = false; });

  const origHandleNewMsg = handleNewMessage;
  handleNewMessage = async function (data) {
    if (!windowFocused && data.from !== api.userId) {
      playNotificationSound();
    }
    return origHandleNewMsg(data);
  };

  // Password visibility toggle
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.pw-toggle');
    if (!btn) return;
    const input = document.getElementById(btn.dataset.target);
    if (!input) return;
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    btn.querySelector('.eye-open').classList.toggle('hidden', !isPassword);
    btn.querySelector('.eye-closed').classList.toggle('hidden', isPassword);
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && currentConversation) {
      e.preventDefault();
      sendMessage();
    }
    if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
      e.preventDefault();
      $('#search-input').focus();
    }
  });

})();
