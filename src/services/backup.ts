import { gcm } from '@noble/ciphers/aes.js';
import { pbkdf2Async } from '@noble/hashes/pbkdf2.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js';
import { emptyWorkshop, type Workshop } from '../domain/model.ts';
import { validateWorkshop } from '../domain/validation.ts';
const iterations = 600000;
const encoder = new TextEncoder();
const decoder = new TextDecoder();
export function shopSnapshot(data: Workshop, shopId: string): Workshop { const snapshot = emptyWorkshop(); for (const key of Object.keys(snapshot).filter(k => k !== 'schemaVersion') as (Exclude<keyof Workshop, 'schemaVersion'>)[])
    (snapshot[key] as unknown[]) = data[key].filter(r => r.shopId === shopId); validateWorkshop(snapshot); if (snapshot.shops.length !== 1)
    throw new Error('shopMismatch'); return snapshot; }
export async function encryptBackup(snapshot: Workshop, password: string, random: (n: number) => Uint8Array): Promise<string> {
    validateWorkshop(snapshot);
    if (password.length < 12)
        throw new Error('passwordShort');
    if (snapshot.shops.length !== 1)
        throw new Error('shopMismatch');
    const salt = random(16), nonce = random(12);
    const key = await pbkdf2Async(sha256, encoder.encode(password), salt, { c: iterations, dkLen: 32 });
    try {
        const content = JSON.stringify({ schemaVersion: 2, createdAt: new Date().toISOString(), data: snapshot });
        const ciphertext = gcm(key, nonce, encoder.encode('tailor-master-backup-v1')).encrypt(encoder.encode(content));
        return JSON.stringify({ format: 'tailor-master', version: 1, kdf: 'pbkdf2-sha256', iterations, salt: bytesToHex(salt), nonce: bytesToHex(nonce), ciphertext: bytesToHex(ciphertext) });
    }
    finally {
        key.fill(0);
    }
}
export async function decryptBackup(raw: string, password: string): Promise<Workshop> {
    if (raw.length > 100000000)
        throw new Error('backupInvalid');
    try {
        const pkg = JSON.parse(raw);
        if (pkg.format !== 'tailor-master' || pkg.version !== 1 || pkg.kdf !== 'pbkdf2-sha256' || pkg.iterations !== iterations || !/^([a-f0-9]{32})$/.test(pkg.salt) || !/^([a-f0-9]{24})$/.test(pkg.nonce) || typeof pkg.ciphertext !== 'string' || pkg.ciphertext.length < 32)
            throw new Error();
        const key = await pbkdf2Async(sha256, encoder.encode(password), hexToBytes(pkg.salt), { c: iterations, dkLen: 32 });
        try {
            const plaintext = gcm(key, hexToBytes(pkg.nonce), encoder.encode('tailor-master-backup-v1')).decrypt(hexToBytes(pkg.ciphertext));
            const content = JSON.parse(decoder.decode(plaintext));
            if (content.schemaVersion !== 2)
                throw new Error();
            validateWorkshop(content.data);
            if (content.data.shops.length !== 1)
                throw new Error();
            return content.data;
        }
        finally {
            key.fill(0);
        }
    }
    catch {
        throw new Error('backupDecryptFailed');
    }
}

