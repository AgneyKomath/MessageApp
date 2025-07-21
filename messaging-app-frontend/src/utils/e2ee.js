// keypair gen yeah
export async function loadOrGenerateKeyPair() {
    const stored = localStorage.getItem("e2ee_priv");
    if (stored) {
        const priv = await crypto.subtle.importKey(
            "jwk",
            JSON.parse(stored),
            { name: "ECDH", namedCurve: "P-256" },
            true,
            ["deriveKey"]
        );
        const pubJwk = JSON.parse(localStorage.getItem("e2ee_pub"));
        const pub = await crypto.subtle.importKey(
            "jwk",
            pubJwk,
            { name: "ECDH", namedCurve: "P-256" },
            true,
            []
        );
        return { privateKey: priv, publicKey: pub };
    }
    const kp = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, [
        "deriveKey",
    ]);
    const privJwk = await crypto.subtle.exportKey("jwk", kp.privateKey);
    const pubJwk = await crypto.subtle.exportKey("jwk", kp.publicKey);
    localStorage.setItem("e2ee_priv", JSON.stringify(privJwk));
    localStorage.setItem("e2ee_pub", JSON.stringify(pubJwk));
    return kp;
}

// derive an AES key from bros JWK
export async function deriveAesKey(privateKey, peerJwk) {
    const peerPub = await crypto.subtle.importKey(
        "jwk",
        peerJwk,
        { name: "ECDH", namedCurve: "P-256" },
        true,
        []
    );
    return crypto.subtle.deriveKey(
        { name: "ECDH", public: peerPub },
        privateKey,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
    );
}

export async function encryptText(aesKey, text) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        aesKey,
        new TextEncoder().encode(text)
    );
    return {
        iv: Array.from(iv),
        data: Array.from(new Uint8Array(ct)),
    };
}
export async function decryptText(aesKey, { iv, data }) {
    const plain = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: new Uint8Array(iv) },
        aesKey,
        new Uint8Array(data)
    );
    return new TextDecoder().decode(plain);
}
