// Interface for the encrypted data
export interface EncryptedData {
  iv: string;
  encryptedData: string;
  authTag: string;
}