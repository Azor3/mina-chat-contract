import {
  Poseidon,
  // SelfProof,
  ZkProgram,
  Field,
  PublicKey,
  Struct,
  Signature,
  MerkleWitness as BaseMerkleWitness,
  SelfProof,
} from 'o1js';

const MESSAGE_TREE_DEPTH = 10; // Adjust based on your needs
class MerkleWitness extends BaseMerkleWitness(MESSAGE_TREE_DEPTH) {}

export class PrivateInputs extends Struct({
  messageSignature: Signature,
  merklePath: MerkleWitness,
}) {}

export class MessageProof extends Struct({
  senderPublicKey: PublicKey,
  messageHash: Field,
  merkleRoot: Field,
}) {}

export const MessageVerificationProgram = ZkProgram({
  name: 'MessageVerification',
  publicInput: MessageProof,
  privateInput: PrivateInputs,

  methods: {
    verifyMessage: {
      privateInputs: [PrivateInputs],

      async method(publicInput: MessageProof, privateInput: PrivateInputs) {
        // Verify the signature of the message
        const isSignatureValid = privateInput.messageSignature.verify(
          publicInput.senderPublicKey,
          publicInput.messageHash.toFields()
        );
        isSignatureValid.assertTrue();



        // Verify the Merkle path
        const calculatedRoot = privateInput.merklePath.calculateRoot(
          publicInput.messageHash
        );
        calculatedRoot.assertEquals(publicInput.merkleRoot);
      },
    },
    // Recursive proof verification
    verifyMessageWithPrevious: {
      privateInputs: [PrivateInputs, SelfProof],

      async method(
        publicInput: MessageProof,
        privateInput: PrivateInputs,
        previousProof: SelfProof<MessageProof, void>
      ) {
        // Step 1: Verify the previous proof
        previousProof.verify();

        // Verify the signature of the message
        const isSignatureValid = privateInput.messageSignature.verify(
          publicInput.senderPublicKey,
          publicInput.messageHash.toFields()
        );
        isSignatureValid.assertTrue();

        // Verify the Merkle path
        const calculatedRoot = privateInput.merklePath.calculateRoot(
          publicInput.messageHash
        );
        calculatedRoot.assertEquals(publicInput.merkleRoot);
      },
    },
  },
});
