import {
  AccountUpdate,
  Field,
  Mina,
  PrivateKey,
  PublicKey,
  MerkleTree,
  Poseidon,
  Signature,
} from 'o1js';

import { Wisper, MessageVerificationProgramProof } from '../SettleContract'; // Adjust import path as needed
import { MessageVerificationProgram } from '../proof/proof';
import {
    generateProof,
    generateProofWithPreviousProof
} from '../proof/generateProof';
const MESSAGE_TREE_DEPTH = 10;

describe('Wisper Smart Contract', () => {
    async function deployContract() {
      const txn = await Mina.transaction(deployerAccount, async () => {
        AccountUpdate.fundNewAccount(deployerAccount); // params: which account will pay the fee and the number of account u want to create and pay
        await zkApp.deploy();
      });
      await txn.prove();
      await txn.sign([deployerKey, zkAppPrivateKey]).send();
    }
    async function createAndFundAccount() {
      const txn = await Mina.transaction(deployerAccount, async() => {
        const accountUpdate = AccountUpdate.fundNewAccount(deployerAccount, 2); // params: which account will pay the fee and the number of account u want to create and pay
        accountUpdate.send({ to: accountPublicKey, amount: 5_000_000_000}); // Amount 0 olsa bile wallet creation için fee deployer account tarafından ödeniyor
        accountUpdate.send({ to: accountPublicKey2, amount: 5_000_000_000 });
      });

      await txn.prove();
      await txn.sign([deployerKey]).send();
    
      const balanceOfAcc1 = Mina.getBalance(accountPublicKey);
      console.log('Acc1 Balance:', balanceOfAcc1.toString());
      const balanceOfAcc2 = Mina.getBalance(accountPublicKey2);
      console.log('Acc2 Balance:', balanceOfAcc2.toString());
    }
    // Mock ZK Proof creation (you'll need to replace this with actual proof generation)
    async function createMockProof(merkleTree: MerkleTree): Promise<MessageVerificationProgramProof> {
      let pureMessage = 'Hello Bob, you should get this message.';

      const message = pureMessage
        .split('')
        .map((char) => Field(char.charCodeAt(0)));
      
      const messageHash = Poseidon.hash(message);
      const messageSignature = Signature.create(
        deployerKey,
        messageHash.toFields()
      );
      merkleTree = new MerkleTree(MESSAGE_TREE_DEPTH);
      merkleTree.setLeaf(0n, messageHash);

      const mockProof = await generateProof(
        deployerAccount,
        messageHash,
        messageSignature,
        merkleTree,
        0
      );
      return mockProof;
    }
  
  let deployerAccount: PublicKey,
      deployerKey: PrivateKey,
      accountPublicKey: PublicKey,
      accountPublicKey2: PublicKey,
      accountPrivateKey: PrivateKey,
      accountPrivateKey2: PrivateKey,
      zkAppAddress: PublicKey,
      zkAppPrivateKey: PrivateKey,
      zkApp: Wisper;

    beforeAll(async () => {
        await MessageVerificationProgram.compile();
        // Compile the contract
        await Wisper.compile();

        // Setup local blockchain
        const Local = await Mina.LocalBlockchain();
        Mina.setActiveInstance(Local);
        
        // New wallet key pair
        accountPrivateKey = PrivateKey.random();
        accountPublicKey = accountPrivateKey.toPublicKey();

        // New wallet key pair
        accountPrivateKey2 = PrivateKey.random();
        accountPublicKey2 = accountPrivateKey2.toPublicKey();
            
        // Create accounts(funder)
        deployerKey = Local.testAccounts[0].key;
        deployerAccount = deployerKey.toPublicKey();
      
        const balanceOfFunder = Mina.getBalance(deployerAccount);
        console.log('Funder Balance:', balanceOfFunder.toString());

        await createAndFundAccount();
      
        // Prepare ZK App
        zkAppPrivateKey = PrivateKey.random();
        zkAppAddress = zkAppPrivateKey.toPublicKey();
        zkApp = new Wisper(zkAppAddress);
    });

    describe('Contract Initialization', () => {
      beforeAll(async () => {
        await deployContract();
      });

      test('contract is deployed with initial state', async () => {
        const hostUser = zkApp.hostUser.get();
        const guestUser = zkApp.guestUser.get();
        const chatId = zkApp.chatId.get();
        const merkleRoot = zkApp.merkleRoot.get();
        const timestamp = zkApp.timestamp.get();

        expect(hostUser).toEqual(PublicKey.empty());
        expect(guestUser).toEqual(PublicKey.empty());
        expect(chatId).toEqual(Field(0));
        expect(merkleRoot).toEqual(Field(0));
        expect(timestamp).toEqual(Field(0));
      });

      test('should successfully settle a chat with valid parameters', async () => {
        const hostUser = accountPublicKey;
        const guestUser = accountPublicKey2;
        const chatId = Field(123);
        const timestamp = Field(Date.now());
        const merkleTree = new MerkleTree(MESSAGE_TREE_DEPTH);
        const mockProof = await createMockProof(merkleTree);
        const merkleRoot = merkleTree.getRoot();
        const txn = await Mina.transaction(hostUser, async () => {
          await zkApp.settleChat(
              hostUser,
              guestUser,
              chatId,
              merkleRoot,
              timestamp,
              mockProof
          );
        });

        await txn.prove();
        await txn.sign([accountPrivateKey]).send();

        // Verify updated state
        const updatedHostUser = zkApp.hostUser.get();
        const updatedGuestUser = zkApp.guestUser.get();
        const updatedChatId = zkApp.chatId.get();
        const updatedMerkleRoot = zkApp.merkleRoot.get();
        const updatedTimestamp = zkApp.timestamp.get();

        expect(updatedHostUser).toEqual(hostUser);
        expect(updatedGuestUser).toEqual(guestUser);
        expect(updatedChatId).toEqual(chatId);
        expect(updatedMerkleRoot).toEqual(merkleRoot);
        expect(updatedTimestamp).toEqual(timestamp);
      });
    });
});