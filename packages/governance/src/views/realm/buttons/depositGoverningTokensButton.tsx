import { ParsedAccount } from '@oyster/common';
import { Button, Col, Modal, Row } from 'antd';
import React from 'react';
import { Realm } from '../../../models/accounts';
import { LABELS } from '../../../constants';
import { hooks } from '@oyster/common';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { depositGoverningTokens } from '../../../actions/depositGoverningTokens';
import { useWalletTokenOwnerRecord, useStakeAccountRecord } from '../../../hooks/apiHooks';
import { PublicKey } from '@solana/web3.js';
import { useRpcContext } from '../../../hooks/useRpcContext';

const { useAccountByMint } = hooks;

const { confirm } = Modal;
export function DepositGoverningTokensButton({
  realm,
  governingTokenMint,
  tokenName,
}: {
  realm: ParsedAccount<Realm> | undefined;
  governingTokenMint: PublicKey | undefined;
  tokenName?: string;
}) {
  const rpcContext = useRpcContext();

  const governingTokenAccount = useAccountByMint(governingTokenMint);
  const tokenOwnerRecord = useWalletTokenOwnerRecord(
    realm?.pubkey,
    governingTokenMint,
  );
  const accountRecord = useStakeAccountRecord();
  console.log(accountRecord);

  if (!realm) {
    return null;
  }

  const isVisible =
    !tokenOwnerRecord;

  return isVisible ? (
    <Button
      type="primary"
      onClick={() =>
        confirm({
          title: LABELS.DEPOSIT_TOKENS,
          icon: <ExclamationCircleOutlined />,
          content: (
            <Row>
              <Col span={24}>
                <p>{LABELS.CREATE_VOTER_RECORD}</p>
              </Col>
            </Row>
          ),
          okText: LABELS.DEPOSIT,
          cancelText: LABELS.CANCEL,
          onOk: async () => {
            if (governingTokenAccount) {
              await depositGoverningTokens(
                rpcContext,
                realm!.pubkey,
                governingTokenAccount,
                governingTokenMint!,
              );
            }
          },
        })
      }
    >
      {LABELS.CREATE_VOTER_RECORD}
    </Button>
  ) : null;
}
