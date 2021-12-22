import {
  PublicKey,
  TransactionInstruction,
  SYSVAR_RENT_PUBKEY,
  SystemProgram,
} from "@solana/web3.js";
import { REGISTRY_PROGRAM_ID, STAKE_PROGRAM_ID} from "../constants/pubkeys";

export const withRevise = async (
  instructions: TransactionInstruction[],
  payer: PublicKey,
  realmAccount: PublicKey,
  communityMint : PublicKey,
  stakeAccount: PublicKey,
  stakePoolAccount: PublicKey,
  stakePoolTokenAccount : PublicKey
) => {

  console.log('withRevise');

  const [VoterWeightRecord] = await PublicKey.findProgramAddress(
    [
      realmAccount.toBuffer(),
      communityMint.toBuffer(),
      payer.toBuffer(),
    ],
    REGISTRY_PROGRAM_ID
  );


  const keys = [
    {
      pubkey: payer,
      isWritable: true,
      isSigner: true,
    },
    {
      pubkey: realmAccount,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: communityMint,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: payer,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: VoterWeightRecord,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: SystemProgram.programId,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: SYSVAR_RENT_PUBKEY,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: stakeAccount,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: stakePoolAccount,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: stakePoolTokenAccount,
      isWritable: false,
      isSigner: false,
    },
  ];

  instructions.push(
    new TransactionInstruction({
      keys,
      programId : REGISTRY_PROGRAM_ID,
      data : Buffer.alloc(1)
    })
  );

  return VoterWeightRecord
};
