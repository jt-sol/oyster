import { utils } from '@oyster/common';
import {
  PublicKey,
  SYSVAR_CLOCK_PUBKEY,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from '@solana/web3.js';
import { getGovernanceSchema } from './serialisation';
import { serialize } from 'borsh';
import { CastVoteArgs, Vote } from './instructions';
import {
  getRealmConfigAddress,
  getVoteRecordAddress,
  RealmConfig,
} from './accounts';
import { PROGRAM_VERSION_V1 } from './registry/api';

export const withCastVote = async (
  instructions: TransactionInstruction[],
  programId: PublicKey,
  programVersion: number,
  realm: PublicKey,
  governance: PublicKey,
  proposal: PublicKey,
  proposalOwnerRecord: PublicKey,
  tokenOwnerRecord: PublicKey,
  governanceAuthority: PublicKey,
  governingTokenMint: PublicKey,
  vote: Vote,
  payer: PublicKey,
  voterWeightRecord: PublicKey,
) => {
  const { system: systemId } = utils.programIds();

  const args = new CastVoteArgs(
    programVersion === PROGRAM_VERSION_V1
      ? { yesNoVote: vote.toYesNoVote(), vote: undefined }
      : { yesNoVote: undefined, vote: vote },
  );
  const data = Buffer.from(
    serialize(getGovernanceSchema(programVersion), args),
  );

  const voteRecordAddress = await getVoteRecordAddress(
    programId,
    proposal,
    tokenOwnerRecord,
  );
  const realmConfigAddress = await getRealmConfigAddress(programId, realm);

  const keys = [
    {
      pubkey: realm,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: governance,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: proposal,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: proposalOwnerRecord,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: tokenOwnerRecord,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: governanceAuthority,
      isWritable: false,
      isSigner: true,
    },
    {
      pubkey: voteRecordAddress,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: governingTokenMint,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: payer,
      isWritable: false,
      isSigner: true,
    },
    {
      pubkey: systemId,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: SYSVAR_RENT_PUBKEY,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: SYSVAR_CLOCK_PUBKEY,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: realmConfigAddress,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: voterWeightRecord,
      isSigner: false,
      isWritable: false,
    },
  ];

  instructions.push(
    new TransactionInstruction({
      keys,
      programId,
      data,
    }),
  );
};
