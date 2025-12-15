
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-ctr';

// Ensure ENCRYPTION_KEY is 32 bytes (64 hex chars) in env. 
// For dev defaults we can fallback, but in prod it must be secure.
const getKey = () => {
    const key = process.env.ENCRYPTION_KEY || 'default-insecure-key-for-dev-only-32bytes';
    // If key is hex string and 64 chars, parse it. Else ensure it's 32 chars long or hash it.
    // For simplicity in this demo, we assume the env var is proper or we use a fixed buffer for dev.
    return Buffer.alloc(32, key); // Padding/Truncating to 32 bytes simple approach
};

export const encrypt = (text: string): string => {
    const iv = randomBytes(16);
    const cipher = createCipheriv(ALGORITHM, getKey(), iv);
    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);

    return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
};

export const decrypt = (hash: string): string => {
    const [ivHex, contentHex] = hash.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = createDecipheriv(ALGORITHM, getKey(), iv);
    const decrypted = Buffer.concat([decipher.update(Buffer.from(contentHex, 'hex')), decipher.final()]);

    return decrypted.toString();
};
