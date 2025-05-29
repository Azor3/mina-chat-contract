import {
  Field,
  SmartContract,
  state,
  State,
  method,
  PublicKey,
  MerkleTree,
  ZkProgram,
} from 'o1js';
import { MessageVerificationProgram } from './proof/proof';

export class MessageVerificationProgramProof extends ZkProgram.Proof(
  MessageVerificationProgram
) {}

const MESSAGE_TREE_DEPTH = 10; // Max 2^10 message

export class Wisper extends SmartContract {
  @state(Field) merkleRoot = State<Field>();
  @state(PublicKey) hostUser = State<PublicKey>();
  @state(PublicKey) guestUser = State<PublicKey>();
  @state(Field) timestamp = State<Field>();
  @state(Field) chatId = State<Field>();

  init() {
    super.init();
    this.merkleRoot.set(Field(0));
    this.hostUser.set(PublicKey.empty());
    this.guestUser.set(PublicKey.empty());
    this.timestamp.set(Field(0));
    this.chatId.set(Field(0));
  }

  //Needed info to verification can be added to parameters.
  @method async settleChat(
    hostUser: PublicKey,
    guestUser: PublicKey,
    chatId: Field,
    merkleRoot: Field,
    timestamp: Field,
    proof: MessageVerificationProgramProof
  ) {
    const senderPublicKey = this.sender.getAndRequireSignatureV2();

    // Check if senderPublicKey is either hostUser or guestUser
    const isHost = hostUser.equals(senderPublicKey);
    const isGuest = guestUser.equals(senderPublicKey);
    isHost
      .or(isGuest)
      .assertTrue('Sender must be either the host or guest user.');

    // Call the verify function from ZKProgram and verify the proof
    proof.verify();

    this.hostUser.requireEquals(this.hostUser.get());
    const storedHostUser = this.hostUser.get();
    storedHostUser.assertEquals(PublicKey.empty());

    this.guestUser.requireEquals(this.guestUser.get());
    const storedGuestUser = this.guestUser.get();
    storedGuestUser.assertEquals(PublicKey.empty());

    this.chatId.requireEquals(this.chatId.get());
    const storedChatId = this.chatId.get();
    storedChatId.assertEquals(Field(0));

    this.merkleRoot.requireEquals(this.merkleRoot.get());
    const storedMerkleRoot = this.merkleRoot.get();
    storedMerkleRoot.assertEquals(Field(0));

    this.timestamp.requireEquals(this.timestamp.get());
    const storedTimestamp = this.timestamp.get();
    storedTimestamp.assertEquals(Field(0));

    this.merkleRoot.set(merkleRoot);
    this.timestamp.set(timestamp);
    this.guestUser.set(guestUser);
    this.hostUser.set(hostUser);
    this.chatId.set(chatId);
  }
}
