import { jest } from '@jest/globals';
import { PrivateKey, Signature, Poseidon, Field, MerkleTree } from 'o1js';
import { EncryptedData } from '../interfaces/message.interface';
import { MessagePackage } from '../interfaces/MessagePackage.interface';
import { encrypt, decrypt } from '../encryption/aes-gcm';
import {
  generateProof,
  generateProofWithPreviousProof,
  // generateProofWithPreviousProof,
} from '../proof/generateProof';
import { MessageVerificationProgram } from '../proof/proof';
import { CryptoUtils } from '../ecdh-pallas/ecdh-pallas';
const MESSAGE_TREE_DEPTH = 10;

jest.useFakeTimers();

describe('Chat functions', () => {
  //These keys will use for signing messages
  const signingPrivateKey1 = PrivateKey.random();
  const signingPublicKey1 = signingPrivateKey1.toPublicKey();
  const signingPrivateKey2 = PrivateKey.random();
  const signingPublicKey2 = signingPrivateKey2.toPublicKey();

  //These keys will use for create encryption key
  const encryptionPrivKey1 = PrivateKey.random();
  const encryptionPrivKey2 = PrivateKey.random();
  const encryptionPubKey1 = encryptionPrivKey1.toPublicKey();
  const encryptionPubKey2 = encryptionPrivKey2.toPublicKey();

  let pureMessage = 'Hello Bob, you should get this message.';
  let messagePackage: MessagePackage;
  const newPureMessage = 'Hey Alice, i got your message do not worry';
  let messagePackage2: MessagePackage;

  const merkleTree = new MerkleTree(MESSAGE_TREE_DEPTH);

  beforeAll(async () => {
    await MessageVerificationProgram.compile();

    //This is the key we will use for encryption
    const sharedSecret = CryptoUtils.computeSharedSecret(
      encryptionPrivKey1,
      encryptionPubKey2
    );
    const sharedKey = CryptoUtils.fieldToBuffer(sharedSecret);

    //This is the cipher text that we will send from one client to other
    const encryptedMessage: EncryptedData = encrypt(sharedKey, pureMessage);

    const message = pureMessage
      .split('')
      .map((char) => Field(char.charCodeAt(0)));
    const messageHash = Poseidon.hash(message);
    const messageSignature = Signature.create(
      signingPrivateKey1,
      messageHash.toFields()
    );
    merkleTree.setLeaf(0n, messageHash);
    const messageIndex = 0;
    const proof = await generateProof(
      signingPublicKey1,
      messageHash,
      messageSignature,
      merkleTree,
      messageIndex
    );

    //This is the package clients post each other
    messagePackage = {
      encryptedMessage: encryptedMessage,
      proof: proof,
    };
  });
  it('should decrypt and get exact message', async () => {
    const sharedSecret = CryptoUtils.computeSharedSecret(
      encryptionPrivKey2,
      encryptionPubKey1
    );
    const sharedKey = CryptoUtils.fieldToBuffer(sharedSecret);
    const decryptedMessage = decrypt(
      sharedKey,
      messagePackage.encryptedMessage.iv,
      messagePackage.encryptedMessage.encryptedData,
      messagePackage.encryptedMessage.authTag
    );

    expect(pureMessage).toStrictEqual(decryptedMessage);
  });
  it('should verify the proof', async () => {
    const isValid = await MessageVerificationProgram.verify(
      messagePackage.proof
    );
    expect(isValid).toBe(true);
  });
  it('should other client verify and keep chatting as well', async () => {
    const sharedSecret = CryptoUtils.computeSharedSecret(
      encryptionPrivKey2,
      encryptionPubKey1
    );
    const sharedKey = CryptoUtils.fieldToBuffer(sharedSecret);

    const encryptedMessage: EncryptedData = encrypt(sharedKey, newPureMessage);

    const message = newPureMessage
      .split('')
      .map((char) => Field(char.charCodeAt(0)));
    const messageHash = Poseidon.hash(message);
    const messageSignature = Signature.create(
      signingPrivateKey2,
      messageHash.toFields()
    );
    merkleTree.setLeaf(1n, messageHash);
    const messageIndex = 1;
    const newProof = await generateProofWithPreviousProof(
      signingPublicKey2,
      messageHash,
      messageSignature,
      merkleTree,
      messageIndex,
      messagePackage.proof
    );
    messagePackage2 = {
      encryptedMessage: encryptedMessage,
      proof: newProof,
    };
  });
  it('should decrypt and get exact message', async () => {
    const sharedSecret = CryptoUtils.computeSharedSecret(
      encryptionPrivKey1,
      encryptionPubKey2
    );
    const sharedKey = CryptoUtils.fieldToBuffer(sharedSecret);
    const decryptedMessage = decrypt(
      sharedKey,
      messagePackage2.encryptedMessage.iv,
      messagePackage2.encryptedMessage.encryptedData,
      messagePackage2.encryptedMessage.authTag
    );

    expect(newPureMessage).toStrictEqual(decryptedMessage);
  });
  it('should verify the proof', async () => {
    const isValid = await MessageVerificationProgram.verify(
      messagePackage2.proof
    );
    expect(isValid).toBe(true);
  });
});
