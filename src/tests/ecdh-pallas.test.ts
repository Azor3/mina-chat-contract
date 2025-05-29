import { jest } from '@jest/globals';
import { CryptoUtils } from '../ecdh-pallas/ecdh-pallas';
import { Field, PrivateKey } from 'o1js';

jest.useFakeTimers();

describe('ECDH Pallas', () => {

    it('should compute the shared secret correctly', () => {

        const privateKey1 = PrivateKey.random();
        const privateKey2 = PrivateKey.random();

        const publicKey1 = privateKey1.toPublicKey();
        const publicKey2 = privateKey2.toPublicKey();

        const sharedSecret1 = CryptoUtils.computeSharedSecret(privateKey1, publicKey2);
        const sharedSecret2 = CryptoUtils.computeSharedSecret(privateKey2, publicKey1);

        expect(CryptoUtils.fieldToBuffer(sharedSecret1)).toStrictEqual(CryptoUtils.fieldToBuffer(sharedSecret2));

    });
});