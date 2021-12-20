import { PublicKey, TransactionInstruction, Account } from '@solana/web3.js';
import { models, TokenAccount } from '@oyster/common';
import { withDepositGoverningTokens } from '../models/withDepositGoverningTokens';
import { sendTransactionWithNotifications } from '../tools/transactions';
import { RpcContext } from '../models/core/api';
import {BN} from 'bn.js'

const { approve } = models;

export const depositGoverningTokens = async (
  { connection, wallet, programId, programVersion, walletPubkey }: RpcContext,
  realm: PublicKey,
  governingTokenSource: TokenAccount,
  governingTokenMint: PublicKey,
) => {
  let instructions: TransactionInstruction[] = [];
  let signers: Account[] = [];

  const amount = new BN(0);

  const transferAuthority = approve(
    instructions,
    [],
    governingTokenSource.pubkey,
    walletPubkey,
    amount,
  );

  signers.push(transferAuthority);

  await withDepositGoverningTokens(
    instructions,
    programId,
    programVersion,
    realm,
    governingTokenSource.pubkey,
    governingTokenMint,
    walletPubkey,
    transferAuthority.publicKey,
    walletPubkey,
    amount,
  );

  await sendTransactionWithNotifications(
    connection,
    wallet,
    instructions,
    signers,
    'Creating token record',
    'Token record created',
  );
};
