import * as crypto from 'crypto';
import { EncryptedData } from '../interfaces/message.interface';

// Function to generate a random key
export function generateKey(): Buffer {
  return crypto.randomBytes(32); // 256 bits key
}

// Function to encrypt a message
export function encrypt(key: Buffer, message: string): EncryptedData {
  const iv: Buffer = crypto.randomBytes(12); // 96 bits IV
  const cipher: crypto.CipherGCM = crypto.createCipheriv('aes-256-gcm', key, iv);

  let encrypted: string = cipher.update(message, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag: string = cipher.getAuthTag().toString('hex');

  return {
    iv: iv.toString('hex'),
    encryptedData: encrypted,
    authTag: authTag
  };
}

// Function to decrypt a message
export function decrypt(key: Buffer, iv: string, encryptedData: string, authTag: string): string {
  const decipher: crypto.DecipherGCM = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));

  let decrypted: string = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
