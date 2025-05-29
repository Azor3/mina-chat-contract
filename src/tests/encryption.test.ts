import { jest } from '@jest/globals';
import { PrivateKey, Signature, Bool} from "o1js";
import { EncryptedData } from '../interfaces/message.interface';
import { generateKey, encrypt, decrypt } from '../encryption/aes-gcm'

jest.useFakeTimers();

describe('AES-GCM algorythm functions',() => {
    it('should encrypt and decrypt the data correctly', () => {
        const key = generateKey();
        const message = "Message itsel!!"
        const encryptedMessage: EncryptedData = encrypt(key, message);
        const decryptedMessage = decrypt(key, encryptedMessage.iv, encryptedMessage.encryptedData, encryptedMessage.authTag);
        expect(message).toStrictEqual(decryptedMessage);
    });
    it('signature of the signer should be the message sender ', () => {
        //Wallet key pairs
        const client1PrivateKey = PrivateKey.random();
        const client1PublicKey = client1PrivateKey.toPublicKey();

        const client2PrivateKey = PrivateKey.random();
        const client2PublicKey = client2PrivateKey.toPublicKey();
        
        // we can add any extra data to sign to prevent MITM attacks
        const signature1 = Signature.create(client1PrivateKey, client2PublicKey.toFields());
        const signature2 = Signature.create(client2PrivateKey, client1PublicKey.toFields());


        const isVerify1 = signature1.verify(client1PublicKey, client2PublicKey.toFields());
        const isVerify2 = signature2.verify(client2PublicKey, client1PublicKey.toFields());
        expect(isVerify1).toStrictEqual(new Bool(true));
        expect(isVerify2).toStrictEqual(new Bool(true));
    });
});
