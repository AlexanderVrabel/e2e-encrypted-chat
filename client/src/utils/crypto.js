export async function generateKeyPair() {
    return await window.crypto.subtle.generateKey(
        {
            name: "RSA-OAEP",
            modulusLength: 2048,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: "SHA-256",
        },
        true,
        ["encrypt", "decrypt"]
    );
}

export async function exportKey(key) {
    return await window.crypto.subtle.exportKey("jwk", key);
}

export async function importKey(jwk, type) {
    return await window.crypto.subtle.importKey(
        "jwk",
        jwk,
        {
            name: "RSA-OAEP",
            hash: "SHA-256",
        },
        true,
        type === "public" ? ["encrypt"] : ["decrypt"]
    );
}



export async function generateSessionKey() {
    return await window.crypto.subtle.generateKey(
        {
            name: "AES-GCM",
            length: 256,
        },
        true,
        ["encrypt", "decrypt"]
    );
}

export async function exportSessionKey(key) {
    return await window.crypto.subtle.exportKey("raw", key);
}

export async function importSessionKey(rawParams) {
    return await window.crypto.subtle.importKey("raw", rawParams, { name: "AES-GCM" }, true, ["encrypt", "decrypt"]);
}



export async function encryptSessionKey(sessionKey, publicKey) {
    const rawKey = await exportSessionKey(sessionKey);
    const encrypted = await window.crypto.subtle.encrypt({ name: "RSA-OAEP" }, publicKey, rawKey);
    return arrayBufferToBase64(encrypted);
}

export async function decryptSessionKey(encryptedKeyBase64, privateKey) {
    const encrypted = base64ToArrayBuffer(encryptedKeyBase64);
    const decryptedRaw = await window.crypto.subtle.decrypt({ name: "RSA-OAEP" }, privateKey, encrypted);
    return await importSessionKey(decryptedRaw);
}



export async function encryptMessage(text, sessionKey) {
    const enc = new TextEncoder();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv }, sessionKey, enc.encode(text));

    return {
        iv: arrayBufferToBase64(iv),
        content: arrayBufferToBase64(encrypted),
    };
}

export async function decryptMessage(payload, sessionKey) {
    try {
        const iv = base64ToArrayBuffer(payload.iv);
        const content = base64ToArrayBuffer(payload.content);
        const decrypted = await window.crypto.subtle.decrypt({ name: "AES-GCM", iv }, sessionKey, content);
        const dec = new TextDecoder();
        return dec.decode(decrypted);
    } catch (e) {
        console.error("Decryption failed:", e);
        return "[Decryption Error]";
    }
}



function arrayBufferToBase64(buffer) {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

function base64ToArrayBuffer(base64) {
    const binary_string = window.atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
}
