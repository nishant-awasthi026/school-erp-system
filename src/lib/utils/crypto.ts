import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
// Use a 32-byte key for AES-256. For production, this should be in .env
// We'll fall back to a hashed fallback so it's guaranteed 32 bytes even if missing.
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY 
    ? crypto.createHash('sha256').update(process.env.ENCRYPTION_KEY).digest() 
    : crypto.createHash('sha256').update('fallback-secret-key-change-in-prod').digest();

/**
 * Encrypts a string using AES-256-GCM
 */
export function encrypt(text: string): string {
    if (!text) return text;
    
    // Check if already encrypted (a simple heuristic: starts with 'enc:')
    if (text.startsWith('enc:')) return text;

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    
    // Format: enc:iv:encrypted:authTag
    return `enc:${iv.toString('hex')}:${encrypted}:${authTag}`;
}

/**
 * Decrypts a string previously encrypted with AES-256-GCM
 */
export function decrypt(text: string): string {
    if (!text || !text.startsWith('enc:')) return text;

    try {
        const parts = text.split(':');
        if (parts.length !== 4) return text;

        const [, ivHex, encryptedHex, authTagHex] = parts;
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');

        const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
        decipher.setAuthTag(authTag);
        
        let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    } catch (e) {
        console.error('Decryption failed', e);
        return '**Decryption Error**'; // Return a safe fallback rather than raw encrypted data
    }
}
