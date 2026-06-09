class CryptoClient {
  constructor() {
    this.identityKeyPair = null;
    this.signedPreKey = null;
    this.sessions = new Map();
    this.pendingSessions = new Map();
  }

  async generateIdentityKey() {
    const key = await crypto.subtle.generateKey(
      { name: 'X25519' },
      true,
      ['deriveBits']
    );
    this.identityKeyPair = key;
    return key;
  }

  async getPublicKeyBytes(keyPair) {
    const raw = await crypto.subtle.exportKey('raw', keyPair.publicKey);
    return new Uint8Array(raw);
  }

  async getPrivateKeyBytes(keyPair) {
    const raw = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
    return new Uint8Array(raw);
  }

  async importPublicKey(bytes) {
    return await crypto.subtle.importKey(
      'raw', bytes, { name: 'X25519' }, true, []
    );
  }

  async importPrivateKey(bytes) {
    return await crypto.subtle.importKey(
      'pkcs8', bytes, { name: 'X25519' }, true, ['deriveBits']
    );
  }

  async deriveSharedSecret(privateKey, publicKey) {
    const shared = await crypto.subtle.deriveBits(
      { name: 'X25519', public: publicKey },
      privateKey,
      256
    );
    return new Uint8Array(shared);
  }

  async hkdf(salt, ikm, info, length = 32) {
    const key = await crypto.subtle.importKey(
      'raw', ikm, 'HKDF', false, ['deriveBits']
    );
    const bits = await crypto.subtle.deriveBits(
      {
        name: 'HKDF',
        salt: salt,
        info: info,
        hash: 'SHA-256',
      },
      key,
      length * 8
    );
    return new Uint8Array(bits);
  }

  async encryptAESGCM(plaintext, key, nonce) {
    const aesKey = await crypto.subtle.importKey(
      'raw', key, { name: 'AES-GCM' }, false, ['encrypt']
    );
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: nonce },
      aesKey,
      plaintext
    );
    return new Uint8Array(encrypted);
  }

  async decryptAESGCM(ciphertext, key, nonce) {
    const aesKey = await crypto.subtle.importKey(
      'raw', key, { name: 'AES-GCM' }, false, ['decrypt']
    );
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: nonce },
      aesKey,
      ciphertext
    );
    return new Uint8Array(decrypted);
  }

  async encryptMessage(plaintext, msgKey, ad = new Uint8Array(0)) {
    const nonce = crypto.getRandomValues(new Uint8Array(12));
    const aesKey = await crypto.subtle.importKey(
      'raw', msgKey, { name: 'AES-GCM' }, false, ['encrypt']
    );
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: nonce, additionalData: ad },
      aesKey,
      plaintext
    );
    const result = new Uint8Array(nonce.length + encrypted.byteLength);
    result.set(nonce, 0);
    result.set(new Uint8Array(encrypted), nonce.length);
    return result;
  }

  async decryptMessage(ciphertextWithNonce, msgKey, ad = new Uint8Array(0)) {
    const nonce = ciphertextWithNonce.slice(0, 12);
    const ct = ciphertextWithNonce.slice(12);
    const aesKey = await crypto.subtle.importKey(
      'raw', msgKey, { name: 'AES-GCM' }, false, ['decrypt']
    );
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: nonce, additionalData: ad },
      aesKey,
      ct
    );
    return new Uint8Array(decrypted);
  }

  async generateFingerprint(publicKeyBytes) {
    const hash = await crypto.subtle.digest('SHA-256', publicKeyBytes);
    const h = new Uint8Array(hash);
    const chunks = [];
    for (let i = 0; i < 12; i += 2) {
      chunks.push(h[i].toString(16).padStart(2, '0').toUpperCase() +
                   h[i + 1].toString(16).padStart(2, '0').toUpperCase());
    }
    return chunks.join(' ');
  }

  async pbkdf2(password, salt, iterations = 600000) {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']
    );
    const bits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: iterations,
        hash: 'SHA-256',
      },
      key,
      256
    );
    return new Uint8Array(bits);
  }

  async x3dhInit(theirBundle) {
    const ephemeral = await crypto.subtle.generateKey(
      { name: 'X25519' }, true, ['deriveBits']
    );
    const ourIdentityPub = await this.getPublicKeyBytes(this.identityKeyPair);
    const theirIdentityPub = this._base64ToBytes(theirBundle.identity_key);
    const theirSignedPrekey = this._base64ToBytes(theirBundle.signed_prekey);

    const dh1 = await this.deriveSharedSecret(
      this.identityKeyPair.privateKey,
      await this.importPublicKey(theirSignedPrekey)
    );
    const dh2 = await this.deriveSharedSecret(
      ephemeral.privateKey,
      await this.importPublicKey(theirIdentityPub)
    );
    const dh3 = await this.deriveSharedSecret(
      ephemeral.privateKey,
      await this.importPublicKey(theirSignedPrekey)
    );

    let dh4 = new Uint8Array(0);
    let usedOpkId = -1;
    if (theirBundle.one_time_prekeys && theirBundle.one_time_prekeys.length > 0) {
      const opk = theirBundle.one_time_prekeys[0];
      const opkPub = this._base64ToBytes(opk.public_key);
      dh4 = await this.deriveSharedSecret(
        ephemeral.privateKey,
        await this.importPublicKey(opkPub)
      );
      usedOpkId = opk.key_id;
    }

    const combined = new Uint8Array(dh1.length + dh2.length + dh3.length + dh4.length);
    combined.set(dh1, 0);
    combined.set(dh2, dh1.length);
    combined.set(dh3, dh1.length + dh2.length);
    if (dh4.length > 0) {
      combined.set(dh4, dh1.length + dh2.length + dh3.length);
    }

    const sharedSecret = await this.hkdf(
      this._strToBytes('SecureMessengerRootV1'),
      combined,
      this._strToBytes('X3DH-init')
    );

    const epPub = await this.getPublicKeyBytes(ephemeral);

    return {
      sharedSecret,
      ephemeralKey: epPub,
      usedOpkId,
      theirIdentityPub,
      ourIdentityPub,
    };
  }

  async x3dhReceive(theirIdentityKeyBytes, theirEphemeralKeyBytes, usedOpkId, signedPrekeyPair, oneTimePrekeys) {
    const theirIdentityPub = await this.importPublicKey(theirIdentityKeyBytes);
    const theirEphemeralPub = await this.importPublicKey(theirEphemeralKeyBytes);

    const dh1 = await this.deriveSharedSecret(signedPrekeyPair.privateKey, theirIdentityPub);
    const dh2 = await this.deriveSharedSecret(this.identityKeyPair.privateKey, theirEphemeralPub);
    const dh3 = await this.deriveSharedSecret(signedPrekeyPair.privateKey, theirEphemeralPub);

    let dh4 = new Uint8Array(0);
    if (usedOpkId >= 0 && oneTimePrekeys.has(usedOpkId)) {
      const opk = oneTimePrekeys.get(usedOpkId);
      dh4 = await this.deriveSharedSecret(opk.privateKey, theirEphemeralPub);
      oneTimePrekeys.delete(usedOpkId);
    }

    const combined = new Uint8Array(dh1.length + dh2.length + dh3.length + dh4.length);
    combined.set(dh1, 0);
    combined.set(dh2, dh1.length);
    combined.set(dh3, dh1.length + dh2.length);
    if (dh4.length > 0) {
      combined.set(dh4, dh1.length + dh2.length + dh3.length);
    }

    return await this.hkdf(
      this._strToBytes('SecureMessengerRootV1'),
      combined,
      this._strToBytes('X3DH-init')
    );
  }

  _strToBytes(s) {
    return new TextEncoder().encode(s);
  }

  _bytesToBase64(bytes) {
    const binary = String.fromCharCode(...bytes);
    return btoa(binary);
  }

  _base64ToBytes(str) {
    const binary = atob(str);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  _bytesToHex(bytes) {
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  _hexToBytes(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    }
    return bytes;
  }
}

window.CryptoClient = CryptoClient;
