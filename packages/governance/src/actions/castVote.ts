import { Account, PublicKey, TransactionInstruction } from '@solana/web3.js';
import { ParsedAccount } from '@oyster/common';

import { Proposal } from '../models/accounts';
import { withCastVote } from '../models/withCastVote';
import { Vote, YesNoVote } from '../models/instructions';
import { sendTransactionWithNotifications } from '../tools/transactions';
import { RpcContext } from '../models/core/api';
import { withRevise } from '../models/withRevise';

export const castVote = async (
  { connection, wallet, programId, programVersion, walletPubkey }: RpcContext,
  realm: PublicKey,
  proposal: ParsedAccount<Proposal>,
  tokeOwnerRecord: PublicKey,
  yesNoVote: YesNoVote,
  accountRecord: any,
) => {
  let signers: Account[] = [];
  let instructions: TransactionInstruction[] = [];

  let governanceAuthority = walletPubkey;
  let payer = walletPubkey;

  const voterWeightRecord = await withRevise(
    instructions,
    walletPubkey,
    realm,
    proposal.info.governingTokenMint,
    accountRecord.stakeAccountPubkey as PublicKey,
    new PublicKey(accountRecord.stakeAccount.account_state.BONDED),
    accountRecord.stakePoolStakingTokenAccountPubkey as PublicKey,
  );

  await withCastVote(
    instructions,
    programId,
    programVersion,
    realm,
    proposal.info.governance,
    proposal.pubkey,
    proposal.info.tokenOwnerRecord,
    tokeOwnerRecord,
    governanceAuthority,
    proposal.info.governingTokenMint,
    Vote.fromYesNoVote(yesNoVote),
    payer,
    voterWeightRecord,
  );

  await sendTransactionWithNotifications(
    connection,
    wallet,
    instructions,
    signers,
    'Voting on proposal',
    'Proposal voted on',
  );
};
