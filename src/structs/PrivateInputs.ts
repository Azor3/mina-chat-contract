import {
  Signature,
  Struct,
  MerkleWitness as BaseMerkleWitness,
} from 'o1js';
const MESSAGE_TREE_DEPTH = 10; // Adjust based on your needs
class MerkleWitness extends BaseMerkleWitness(MESSAGE_TREE_DEPTH) { }

export class PrivateInputs extends Struct({
  messageSignature: Signature,
  merklePath: MerkleWitness,
}) {}
