import { PrivateKey, PublicKey, Field, Poseidon } from 'o1js';
export { CryptoUtils };

class CryptoUtils {
    /**
     * ECDH Compute shared key
     * @param privateKey Local private key
     * @param peersPublicKey Peer's public key
     * @returns The computed shared secret
    */
    static computeSharedSecret(privateKey: PrivateKey, peersPublicKey: PublicKey): Field {
        const publicKeyPoint = peersPublicKey.toGroup();
        const sharedPoint = publicKeyPoint.scale(privateKey.s);
        return sharedPoint.x;
    }

    /**
     * HKDF Extract fonksiyonu
     * @param sharedSecretKey Shared secret key from ECDH
     * @param salt Optional salt value
     * @returns Pseudo-Random Key (PRK)
    */
   static hkdfExtract(sharedSecretKey: Field, salt?: Field): Field {
        const actualSalt = salt ?? Field(0); // use 0 if there is no salt value
        return Poseidon.hash([sharedSecretKey, actualSalt]);
   }

    /**
     * HKDF Expand function
     * @param prk Pseudo-Random Key
     * @param length Number of keys requested
     * @returns Computed keys list
     */
    static hkdfExpand(prk: Field, length: number): Field[] {
        const output: Field[] = [];
        let previousT = Field(0);

        for (let i = 0; i < length; i++) {
            // T(i) = HMAC(PRK, T(i-1) | info | i)
            const counterField = Field(i + 1);
            previousT = Poseidon.hash([previousT, counterField, prk]);
            output.push(previousT);
        }

        return output;
    }

    /**
     * HMAC-based Key Derivation Function
     * @param sharedSecretKey Shared secret key
     * @param length Number of keys requested
     * @param salt Optional salt value
     * @returns Keys list
     */
    static hkdf(
        sharedSecretKey: Field,
        length: number,
        salt?: Field
    ): Field[] {
        const prk = this.hkdfExtract(sharedSecretKey, salt);
        return this.hkdfExpand(prk, length);
    }

    static fieldToBuffer(field: Field): Buffer {
        const hex = field.toBigInt().toString(16).padStart(64, '0');
        return Buffer.from(hex, 'hex');
    }
}