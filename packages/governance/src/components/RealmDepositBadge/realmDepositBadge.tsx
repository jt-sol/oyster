import React from 'react';
import { contexts, ParsedAccount } from '@oyster/common';
import { TokenOwnerRecord } from '../../models/accounts';
import {useStakeAccountRecord } from '../../hooks/apiHooks';
import {
  formatMintNaturalAmountAsDecimal,
  formatMintVoteWeight,
} from '../../tools/units';
import { MintInfo } from '@solana/spl-token';
import { BN } from 'bn.js'

const { useMint } = contexts.Accounts;

export function RealmDepositBadge({
  councilTokenOwnerRecord,
  communityTokenOwnerRecord,
  showVoteWeights,
}: {
  
  councilTokenOwnerRecord: ParsedAccount<TokenOwnerRecord> | undefined;
  communityTokenOwnerRecord: ParsedAccount<TokenOwnerRecord> | undefined;
  showVoteWeights?: boolean;
}) {

  const accountRecord = useStakeAccountRecord();

  const communityMint = useMint(
    communityTokenOwnerRecord?.info.governingTokenMint,
  );

  const councilMint = useMint(councilTokenOwnerRecord?.info.governingTokenMint);

  if (!councilTokenOwnerRecord && !communityTokenOwnerRecord) {
    return null;
  }

  return (
    <>
      <span>staked </span>
      {communityTokenOwnerRecord && communityMint && (
        <TokenDepositStatistics
          label="tokens"
          mint={communityMint}
          amount={accountRecord.votingBalance}
          showVoteWeights={showVoteWeights}
        ></TokenDepositStatistics>
      )}
      {communityTokenOwnerRecord && councilTokenOwnerRecord && ' | '}
      {councilTokenOwnerRecord && councilMint && (
        <TokenDepositStatistics
          label="council tokens"
          mint={councilMint}
          amount={accountRecord.votingBalance}
          showVoteWeights={showVoteWeights}
        ></TokenDepositStatistics>
      )}
    </>
  );
}

function TokenDepositStatistics({
  label,
  mint,
  amount,
  showVoteWeights,
}: {
  label: string;
  mint: MintInfo;
  amount : number;
  showVoteWeights: boolean | undefined;
}) {
  return (
    <>
      <span>{`${label}: ${formatMintNaturalAmountAsDecimal(
        mint,
        new BN(amount),
      )}`}</span>
       {showVoteWeights &&
        (amount !==0) && (
          <span>{` (${formatMintVoteWeight(
            mint,
            new BN(amount),
          )})`}</span>
        )}
   </>
  );
}
