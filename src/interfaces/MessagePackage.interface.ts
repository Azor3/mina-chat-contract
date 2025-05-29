import { Proof } from "o1js";
import { EncryptedData } from "./message.interface";
import { MessageProof } from "../structs/MessageProof";

export interface MessagePackage {
  encryptedMessage: EncryptedData;
  proof: Proof< MessageProof, void>;
}