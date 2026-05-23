class ApiClient {
  constructor(baseUrl = '') {
    this.baseUrl = baseUrl;
    this.token = null;
    this.userId = null;
  }

  async request(method, path, body = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    const opts = { method, headers };
    if (body) {
      opts.body = JSON.stringify(body);
    }
    const res = await fetch(`${this.baseUrl}/api/v1${path}`, opts);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'Request failed');
    }
    return res.json();
  }

  async register(username, password) {
    const salt = crypto.getRandomValues(new Uint8Array(32));
    const upBytes = new TextEncoder().encode(username + ':' + password);
    const combined = new Uint8Array(salt.length + upBytes.length);
    combined.set(salt, 0);
    combined.set(upBytes, salt.length);
    const xArr = await crypto.subtle.digest('SHA-256', combined);
    const x = new Uint8Array(xArr);
    const v = BigInt('0x' + Array.from(x).map(b => b.toString(16).padStart(2, '0')).join(''));

    const body = {
      username,
      srp_salt: Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join(''),
      srp_verifier: v.toString(),
      identity_key: '',
    };
    return this.request('POST', '/auth/register', body);
  }

  async srpHandshake1(username) {
    return this.request('POST', '/auth/handshake1', { username });
  }

  async srpHandshake2(username, A, M1) {
    const aStr = Array.from(A).map(b => b.toString(16).padStart(2, '0')).join('');
    const m1Str = Array.from(M1).map(b => b.toString(16).padStart(2, '0')).join('');
    return this.request('POST', '/auth/handshake2', { username, A: aStr, M1: m1Str });
  }

  async uploadBundle(identityKey, signedPrekey, signature, oneTimePrekeys) {
    const b64 = (bytes) => btoa(String.fromCharCode(...bytes));
    return this.request('POST', '/keys/upload-bundle', {
      identity_key: b64(identityKey),
      signed_prekey: b64(signedPrekey),
      signed_prekey_signature: b64(signature),
      signed_prekey_id: 0,
      one_time_prekeys: oneTimePrekeys.map((k, i) => ({
        key_id: i,
        public_key: b64(k),
      })),
    });
  }

  async getBundle(userId) {
    return this.request('GET', `/keys/bundle/${userId}`);
  }

  async sendMessage(recipientId, ciphertext, msgNumber, prevSendCount, ratchetKey, msgType = 1, fileId = null, ttl = null) {
    const b64 = (bytes) => btoa(String.fromCharCode(...bytes));
    const body = {
      recipient_id: recipientId,
      ciphertext: b64(ciphertext),
      message_number: msgNumber,
      prev_send_count: prevSendCount,
      message_type: msgType,
    };
    if (ratchetKey) body.ratchet_key = b64(ratchetKey);
    if (fileId) body.file_id = fileId;
    if (ttl) body.ttl_seconds = ttl;
    return this.request('POST', '/messages/send', body);
  }

  async getInbox(limit = 50) {
    return this.request('GET', `/messages/inbox?limit=${limit}`);
  }

  async getConversation(userId, limit = 50) {
    return this.request('GET', `/messages/conversation/${userId}?limit=${limit}`);
  }

  async markRead(messageId) {
    return this.request('POST', `/messages/mark-read/${messageId}`);
  }

  async markDelivered(messageId) {
    return this.request('POST', `/messages/mark-delivered/${messageId}`);
  }

  async uploadFile(file, encryptedKey, mimeType) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('encrypted_key', Array.from(encryptedKey).map(b => b.toString(16).padStart(2, '0')).join(''));
    formData.append('mime_type', mimeType);

    const headers = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    const res = await fetch(`${this.baseUrl}/api/v1/files/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'Upload failed');
    }
    return res.json();
  }

  async downloadFile(fileId) {
    const headers = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    const res = await fetch(`${this.baseUrl}/api/v1/files/download/${fileId}`, { headers });
    if (!res.ok) throw new Error('Download failed');
    const buf = await res.arrayBuffer();
    return {
      data: new Uint8Array(buf),
      fileName: atob(res.headers.get('X-File-Name') || ''),
      encryptedKey: res.headers.get('X-Encrypted-Key') || '',
      mimeType: res.headers.get('X-Mime-Type') || '',
      senderId: res.headers.get('X-Sender-Id') || '',
    };
  }

  async searchUsers(query) {
    return this.request('GET', `/users/search?q=${encodeURIComponent(query)}`);
  }

  async getMe() {
    return this.request('GET', '/users/me');
  }

  async getUser(userId) {
    return this.request('GET', `/users/${userId}`);
  }

  async getOnlineUsers() {
    return this.request('GET', '/users/online');
  }

  async logout() {
    return this.request('POST', '/auth/logout');
  }
}

window.ApiClient = ApiClient;
