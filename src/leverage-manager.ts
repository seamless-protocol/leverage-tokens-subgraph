import {
  DefaultManagementFeeAtCreationSet as DefaultManagementFeeAtCreationSetEvent,
  Initialized as InitializedEvent,
  LeverageManagerInitialized as LeverageManagerInitializedEvent,
  LeverageTokenActionFeeSet as LeverageTokenActionFeeSetEvent,
  LeverageTokenCreated as LeverageTokenCreatedEvent,
  ManagementFeeCharged as ManagementFeeChargedEvent,
  ManagementFeeSet as ManagementFeeSetEvent,
  Mint as MintEvent,
  Rebalance as RebalanceEvent,
  Redeem as RedeemEvent,
  RoleAdminChanged as RoleAdminChangedEvent,
  RoleGranted as RoleGrantedEvent,
  RoleRevoked as RoleRevokedEvent,
  TreasuryActionFeeSet as TreasuryActionFeeSetEvent,
  TreasurySet as TreasurySetEvent,
  Upgraded as UpgradedEvent
} from "../generated/LeverageManager/LeverageManager"
import {
  DefaultManagementFeeAtCreationSet,
  Initialized,
  LeverageManagerInitialized,
  LeverageTokenActionFeeSet,
  LeverageTokenCreated,
  ManagementFeeCharged,
  ManagementFeeSet,
  Mint,
  Rebalance,
  Redeem,
  RoleAdminChanged,
  RoleGranted,
  RoleRevoked,
  TreasuryActionFeeSet,
  TreasurySet,
  Upgraded
} from "../generated/schema"
import { Bytes } from "@graphprotocol/graph-ts"

export function handleDefaultManagementFeeAtCreationSet(
  event: DefaultManagementFeeAtCreationSetEvent
): void {
  let entity = new DefaultManagementFeeAtCreationSet(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.fee = event.params.fee

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleInitialized(event: InitializedEvent): void {
  let entity = new Initialized(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.version = event.params.version

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleLeverageManagerInitialized(
  event: LeverageManagerInitializedEvent
): void {
  let entity = new LeverageManagerInitialized(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.leverageTokenFactory = event.params.leverageTokenFactory

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleLeverageTokenActionFeeSet(
  event: LeverageTokenActionFeeSetEvent
): void {
  let entity = new LeverageTokenActionFeeSet(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.leverageToken = event.params.leverageToken
  entity.action = event.params.action
  entity.fee = event.params.fee

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleLeverageTokenCreated(
  event: LeverageTokenCreatedEvent
): void {
  let entity = new LeverageTokenCreated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.token = event.params.token
  entity.collateralAsset = event.params.collateralAsset
  entity.debtAsset = event.params.debtAsset
  entity.config_lendingAdapter = event.params.config.lendingAdapter
  entity.config_rebalanceAdapter = event.params.config.rebalanceAdapter
  entity.config_mintTokenFee = event.params.config.mintTokenFee
  entity.config_redeemTokenFee = event.params.config.redeemTokenFee

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleManagementFeeCharged(
  event: ManagementFeeChargedEvent
): void {
  let entity = new ManagementFeeCharged(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.leverageToken = event.params.leverageToken
  entity.sharesFee = event.params.sharesFee

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleManagementFeeSet(event: ManagementFeeSetEvent): void {
  let entity = new ManagementFeeSet(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.token = event.params.token
  entity.fee = event.params.fee

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleMint(event: MintEvent): void {
  let entity = new Mint(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.token = event.params.token
  entity.sender = event.params.sender
  entity.actionData_collateral = event.params.actionData.collateral
  entity.actionData_debt = event.params.actionData.debt
  entity.actionData_equity = event.params.actionData.equity
  entity.actionData_shares = event.params.actionData.shares
  entity.actionData_tokenFee = event.params.actionData.tokenFee
  entity.actionData_treasuryFee = event.params.actionData.treasuryFee

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleRebalance(event: RebalanceEvent): void {
  let entity = new Rebalance(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.token = event.params.token
  entity.sender = event.params.sender
  entity.actions = changetype<Bytes[]>(event.params.actions)

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleRedeem(event: RedeemEvent): void {
  let entity = new Redeem(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.token = event.params.token
  entity.sender = event.params.sender
  entity.actionData_collateral = event.params.actionData.collateral
  entity.actionData_debt = event.params.actionData.debt
  entity.actionData_equity = event.params.actionData.equity
  entity.actionData_shares = event.params.actionData.shares
  entity.actionData_tokenFee = event.params.actionData.tokenFee
  entity.actionData_treasuryFee = event.params.actionData.treasuryFee

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleRoleAdminChanged(event: RoleAdminChangedEvent): void {
  let entity = new RoleAdminChanged(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.role = event.params.role
  entity.previousAdminRole = event.params.previousAdminRole
  entity.newAdminRole = event.params.newAdminRole

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleRoleGranted(event: RoleGrantedEvent): void {
  let entity = new RoleGranted(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.role = event.params.role
  entity.account = event.params.account
  entity.sender = event.params.sender

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleRoleRevoked(event: RoleRevokedEvent): void {
  let entity = new RoleRevoked(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.role = event.params.role
  entity.account = event.params.account
  entity.sender = event.params.sender

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleTreasuryActionFeeSet(
  event: TreasuryActionFeeSetEvent
): void {
  let entity = new TreasuryActionFeeSet(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.action = event.params.action
  entity.fee = event.params.fee

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleTreasurySet(event: TreasurySetEvent): void {
  let entity = new TreasurySet(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.treasury = event.params.treasury

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleUpgraded(event: UpgradedEvent): void {
  let entity = new Upgraded(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.implementation = event.params.implementation

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}
