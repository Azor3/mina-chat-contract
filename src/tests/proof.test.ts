import { PrivateKey, Signature, Field, Poseidon, MerkleTree } from 'o1js';
import { MessageVerificationProgram } from '../proof/proof';
import { generateProof } from '../proof/generateProof';

describe('Proof generation', () => {
  it('should send message ', async () => {
    const MESSAGE_TREE_DEPTH = 10;

    // chatting key pairs
    const senderPrivateKey = PrivateKey.random();
    const senderPublicKey = senderPrivateKey.toPublicKey();

    const pureMessage = 'Message itsel!!';
    const message = pureMessage
      .split('')
      .map((char) => Field(char.charCodeAt(0)));
    const messageHash = Poseidon.hash(message);
    const messageSignature = Signature.create(
      senderPrivateKey,
      messageHash.toFields()
    );
    const messageSignatureFields = messageSignature.toFields();

    const merkleTree = new MerkleTree(MESSAGE_TREE_DEPTH);
    merkleTree.setLeaf(0n, messageHash);

    const messageCounter = 0;

    await MessageVerificationProgram.compile();

    const proof = await generateProof(
      senderPublicKey,
      messageHash,
      messageSignature,
      merkleTree,
      messageCounter
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const isValid = await MessageVerificationProgram.verify(proof);
    expect(isValid).toStrictEqual(true);
  });
});
