import {
  Field,
  PublicKey,
  Struct,
} from 'o1js';

export class MessageProof extends Struct({
  senderPublicKey: PublicKey,
  messageHash: Field,
  merkleRoot: Field,
}) {}