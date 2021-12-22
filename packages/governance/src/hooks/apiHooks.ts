import { PublicKey } from '@solana/web3.js';
import { useWallet } from '@oyster/common';
import { deserializeAccount } from '@oyster/common';
import {
  deserialize_stake_acct,
  deserialize_stake_pool_acct,
  get_stake_pool_token_account,
} from '../wasm/wormhole_staking';
import {
  getRealmConfigAddress,
  getSignatoryRecordAddress,
  getTokenOwnerRecordAddress,
  getVoteRecordAddress,
  Governance,
  Proposal,
  ProposalInstruction,
  RealmConfigAccount,
  SignatoryRecord,
  TokenOwnerRecord,
  VoteRecord,
} from '../models/accounts';
import { pubkeyFilter } from '../models/core/api';
import {
  useGovernanceAccountByPda,
  useGovernanceAccountByPubkey,
  useGovernanceAccountsByFilter,
} from './accountHooks';
import { useRpcContext } from './useRpcContext';
import { useEffect, useState } from 'react';
import { STAKE_PROGRAM_ID } from '../constants/pubkeys';

// ----- Realm Config ---------

export function useRealmConfig(realm: PublicKey) {
  const { programId } = useRpcContext();

  return useGovernanceAccountByPda<RealmConfigAccount>(
    RealmConfigAccount,
    async () => {
      if (!realm) {
        return;
      }
      return await getRealmConfigAddress(programId, realm);
    },
    [realm],
  )?.tryUnwrap();
}

// ----- Governance -----

export function useGovernance(governance: PublicKey | undefined) {
  return useGovernanceAccountByPubkey<Governance>(
    Governance,
    governance,
  )?.tryUnwrap();
}

export function useGovernancesByRealm(realm: PublicKey | undefined) {
  return useGovernanceAccountsByFilter<Governance>(Governance, [
    pubkeyFilter(1, realm),
  ]);
}

// ----- Proposal -----

export function useProposal(proposal: PublicKey | undefined) {
  return useGovernanceAccountByPubkey<Proposal>(
    Proposal,
    proposal,
  )?.tryUnwrap();
}

export function useProposalsByGovernance(governance: PublicKey | undefined) {
  return useGovernanceAccountsByFilter<Proposal>(Proposal, [
    pubkeyFilter(1, governance),
  ]);
}

// ----- TokenOwnerRecord -----

export function useTokenOwnerRecord(tokenOwnerRecord: PublicKey | undefined) {
  return useGovernanceAccountByPubkey<TokenOwnerRecord>(
    TokenOwnerRecord,
    tokenOwnerRecord,
  );
}

export function useTokenOwnerRecords(
  realm: PublicKey | undefined,
  governingTokenMint: PublicKey | undefined,
) {
  return useGovernanceAccountsByFilter<TokenOwnerRecord>(TokenOwnerRecord, [
    pubkeyFilter(1, realm),
    pubkeyFilter(1 + 32, governingTokenMint),
  ]);
}

export function useWalletTokenOwnerRecord(
  realm: PublicKey | undefined,
  governingTokenMint: PublicKey | undefined,
) {
  const { wallet, programId } = useRpcContext();

  return useGovernanceAccountByPda<TokenOwnerRecord>(
    TokenOwnerRecord,
    async () => {
      if (!realm || !wallet?.publicKey || !governingTokenMint) {
        return;
      }

      return await getTokenOwnerRecordAddress(
        programId,
        realm,
        governingTokenMint,
        wallet.publicKey,
      );
    },
    [wallet?.publicKey, governingTokenMint, realm],
  )?.tryUnwrap();
}

/// Returns all TokenOwnerRecords for the current wallet
export function useWalletTokenOwnerRecords() {
  const { publicKey } = useWallet();

  return useGovernanceAccountsByFilter<TokenOwnerRecord>(TokenOwnerRecord, [
    pubkeyFilter(1 + 32 + 32, publicKey),
  ]);
}

export function useProposalAuthority(proposalOwner: PublicKey | undefined) {
  const { publicKey, connected } = useWallet();
  const tokenOwnerRecord = useTokenOwnerRecord(proposalOwner);

  return connected &&
    tokenOwnerRecord?.isSome() &&
    (tokenOwnerRecord.value.info.governingTokenOwner.toBase58() ===
      publicKey?.toBase58() ||
      tokenOwnerRecord.value.info.governanceDelegate?.toBase58() ===
        publicKey?.toBase58())
    ? tokenOwnerRecord?.tryUnwrap()
    : undefined;
}

// ----- Signatory Record -----

export function useWalletSignatoryRecord(proposal: PublicKey) {
  const { wallet, programId } = useRpcContext();

  return useGovernanceAccountByPda<SignatoryRecord>(
    SignatoryRecord,
    async () => {
      if (!proposal || !wallet?.publicKey) {
        return;
      }

      return await getSignatoryRecordAddress(
        programId,
        proposal,
        wallet.publicKey,
      );
    },
    [wallet?.publicKey, proposal],
  )?.tryUnwrap();
}

export function useSignatoriesByProposal(proposal: PublicKey | undefined) {
  return useGovernanceAccountsByFilter<SignatoryRecord>(SignatoryRecord, [
    pubkeyFilter(1, proposal),
  ]);
}

// ----- Proposal Instruction -----

export function useInstructionsByProposal(proposal: PublicKey | undefined) {
  return useGovernanceAccountsByFilter<ProposalInstruction>(
    ProposalInstruction,
    [pubkeyFilter(1, proposal)],
  );
}

// ----- VoteRecord -----

export const useVoteRecordsByProposal = (proposal: PublicKey | undefined) => {
  return useGovernanceAccountsByFilter<VoteRecord>(VoteRecord, [
    pubkeyFilter(1, proposal),
  ]);
};

export const useTokenOwnerVoteRecord = (
  proposal: PublicKey,
  tokenOwnerRecord: PublicKey | undefined,
) => {
  const { programId } = useRpcContext();

  return useGovernanceAccountByPda<VoteRecord>(
    VoteRecord,
    async () => {
      if (!proposal || !tokenOwnerRecord) {
        return;
      }

      return await getVoteRecordAddress(programId, proposal, tokenOwnerRecord);
    },
    [tokenOwnerRecord, proposal],
  );
};

// ----- StakingAccount -----

export function useStakeAccountRecord() {
  const { wallet, connection, endpoint } = useRpcContext();
  const [stakeAccount, setStakeAccount] = useState<any>();
  const [stakePoolAccount, setStakePoolAccount] = useState<any>();
  const [
    stakePoolStakingTokenAccount,
    setStakePoolStakingTokenAccount,
  ] = useState<any>();
  const [votingBalance, setVotingBalance] = useState<any>();
  const [stakeAccountPubkey, setStakeAccountPubkey] = useState<PublicKey>();
  const [stakePoolStakingTokenAccountPubkey, setStakePoolStakingTokenAccountPubkey] = useState<PublicKey>();
  useEffect(() => {
    const updateStakeAccount = async () => {
      if (!wallet?.publicKey) {
        return;
      }

      const raw_stake_accounts = await connection.getProgramAccounts(
        STAKE_PROGRAM_ID,
        {
          filters: [
            { dataSize: 138 },
            { memcmp: { offset: 0, bytes: wallet.publicKey.toBase58() } },
          ],
        },
      );
      let deserialized_stake_account;

      if (raw_stake_accounts.length === 0) {
        return;
      }

      for (const el of raw_stake_accounts) {
        try {
          let deserialized = deserialize_stake_acct(
            new Uint8Array(el.account.data),
          );

          if (deserialized.shares > 0) {
            deserialized_stake_account = deserialized;
            setStakeAccountPubkey(new PublicKey(el.pubkey));
          }
        } catch (error) {
          console.log('Deserialization failed');
        }
      }
      setStakeAccount(deserialized_stake_account);
    };
    updateStakeAccount();
  }, [wallet, endpoint, connection]);

  useEffect(() => {
    const updateStakePoolAccount = async () => {
      if (!stakeAccount?.account_state?.BONDED) {
        return;
      }

      const raw_stake_pool = await connection.getAccountInfo(
        new PublicKey(stakeAccount.account_state.BONDED),
      );
      if (!raw_stake_pool?.data) {
        return;
      }
      let deserialized;
      try {
        deserialized = deserialize_stake_pool_acct(
          new Uint8Array(raw_stake_pool.data),
        );
      } catch (error) {
        console.log('Deserialization failed');
      }

      setStakePoolAccount(deserialized);
    };
    updateStakePoolAccount();
  }, [stakeAccount]);

  useEffect(() => {
    const updateStakePoolStakingTokenAccount = async () => {
      if (!stakeAccount?.account_state?.BONDED) {
        return;
      }

      const stake_pool_token_account_pubkey = get_stake_pool_token_account(
        STAKE_PROGRAM_ID.toBase58(),
        new PublicKey(stakeAccount.account_state.BONDED).toBase58(),
      );

      setStakePoolStakingTokenAccountPubkey(new PublicKey(stake_pool_token_account_pubkey));

      const raw_stake_pool_token_account = await connection.getAccountInfo(
        new PublicKey(stake_pool_token_account_pubkey),
      );

      if (!raw_stake_pool_token_account?.data) {
        return;
      }

      let deserialized;
      try {
        deserialized = deserializeAccount(raw_stake_pool_token_account.data);
      } catch (error) {
        console.log('Deserialization failed');
      }

      setStakePoolStakingTokenAccount(deserialized);
    };
    updateStakePoolStakingTokenAccount();
  }, [stakeAccount]);

  useEffect(() => {
    const updateVotingBalance = async () => {
      if (!stakeAccount?.shares) {
        return;
      }

      if (!stakePoolAccount?.total_shares) {
        return;
      }

      if (!stakePoolStakingTokenAccount?.amount) {
        return;
      }

      setVotingBalance(
        (stakePoolStakingTokenAccount.amount * stakeAccount.shares) /
          stakePoolAccount.total_shares,
      );
    };
    updateVotingBalance();
  }, [stakeAccount, stakePoolAccount, stakePoolStakingTokenAccount]);

  return {
    stakeAccount,
    stakePoolAccount,
    stakePoolStakingTokenAccount,
    votingBalance,
    stakeAccountPubkey,
    stakePoolStakingTokenAccountPubkey
  };
}
