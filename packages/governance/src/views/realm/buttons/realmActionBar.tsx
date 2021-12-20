import { Button, Popover, Space } from 'antd';
import React, { useRef } from 'react';
import { Realm } from '../../../models/accounts';
import { DepositGoverningTokensButton } from './depositGoverningTokensButton';
import { RegisterGovernanceButton } from './registerGovernanceButton';
import { SetRealmAuthorityButton } from './setRealmAuthorityButton';
import { WithdrawGoverningTokensButton } from './withdrawGoverningTokensButton';
import { ParsedAccount, useWallet } from '@oyster/common';
import { MoreOutlined } from '@ant-design/icons';
import { CreateTreasuryAccountButton } from './createTreasuryAccountButton';

export function RealmActionBar({
  realm,
}: {
  realm: ParsedAccount<Realm> | undefined;
}) {
  const parentRef = useRef<HTMLDivElement>(null);
  const { publicKey, connected } = useWallet();

  if (!realm) {
    return null;
  }

  const showCreateNewGovernance = connected;

  const showSetRealmAuthority =
    realm.info.authority?.toBase58() === publicKey?.toBase58();

  const showSettings = showCreateNewGovernance || showSetRealmAuthority;

  return (
    <Space>
      <DepositGoverningTokensButton
        realm={realm}
        governingTokenMint={realm.info.communityMint}
        tokenName="Governance"
      ></DepositGoverningTokensButton>
      <WithdrawGoverningTokensButton
        realm={realm}
        governingTokenMint={realm?.info.communityMint}
        tokenName="Governance"
      ></WithdrawGoverningTokensButton>

      {showSettings && (
        <div ref={parentRef} className="realm-popup-action-container">
          <Popover
            title="Realm Settings"
            placement="bottomRight"
            arrowPointAtCenter
            trigger="click"
            getPopupContainer={() => parentRef.current!}
            content={
              <Space direction="vertical">
                {showCreateNewGovernance && (
                  <RegisterGovernanceButton
                    realm={realm}
                  ></RegisterGovernanceButton>
                )}
                {showCreateNewGovernance && (
                  <CreateTreasuryAccountButton
                    realm={realm}
                  ></CreateTreasuryAccountButton>
                )}
                {showSetRealmAuthority && (
                  <SetRealmAuthorityButton
                    realm={realm}
                  ></SetRealmAuthorityButton>
                )}
              </Space>
            }
          >
            <Button style={{ paddingLeft: 8, paddingRight: 8 }}>
              <MoreOutlined rotate={90} />
            </Button>
          </Popover>
        </div>
      )}
    </Space>
  );
}
