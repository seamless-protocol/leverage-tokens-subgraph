import { newMockEvent } from "matchstick-as"
import { ethereum, BigInt, Address, Bytes } from "@graphprotocol/graph-ts"
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
} from "../generated/LeverageManager/LeverageManager"

export function createDefaultManagementFeeAtCreationSetEvent(
  fee: BigInt
): DefaultManagementFeeAtCreationSet {
  let defaultManagementFeeAtCreationSetEvent =
    changetype<DefaultManagementFeeAtCreationSet>(newMockEvent())

  defaultManagementFeeAtCreationSetEvent.parameters = new Array()

  defaultManagementFeeAtCreationSetEvent.parameters.push(
    new ethereum.EventParam("fee", ethereum.Value.fromUnsignedBigInt(fee))
  )

  return defaultManagementFeeAtCreationSetEvent
}

export function createInitializedEvent(version: BigInt): Initialized {
  let initializedEvent = changetype<Initialized>(newMockEvent())

  initializedEvent.parameters = new Array()

  initializedEvent.parameters.push(
    new ethereum.EventParam(
      "version",
      ethereum.Value.fromUnsignedBigInt(version)
    )
  )

  return initializedEvent
}

export function createLeverageManagerInitializedEvent(
  leverageTokenFactory: Address
): LeverageManagerInitialized {
  let leverageManagerInitializedEvent =
    changetype<LeverageManagerInitialized>(newMockEvent())

  leverageManagerInitializedEvent.parameters = new Array()

  leverageManagerInitializedEvent.parameters.push(
    new ethereum.EventParam(
      "leverageTokenFactory",
      ethereum.Value.fromAddress(leverageTokenFactory)
    )
  )

  return leverageManagerInitializedEvent
}

export function createLeverageTokenActionFeeSetEvent(
  leverageToken: Address,
  action: i32,
  fee: BigInt
): LeverageTokenActionFeeSet {
  let leverageTokenActionFeeSetEvent =
    changetype<LeverageTokenActionFeeSet>(newMockEvent())

  leverageTokenActionFeeSetEvent.parameters = new Array()

  leverageTokenActionFeeSetEvent.parameters.push(
    new ethereum.EventParam(
      "leverageToken",
      ethereum.Value.fromAddress(leverageToken)
    )
  )
  leverageTokenActionFeeSetEvent.parameters.push(
    new ethereum.EventParam(
      "action",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(action))
    )
  )
  leverageTokenActionFeeSetEvent.parameters.push(
    new ethereum.EventParam("fee", ethereum.Value.fromUnsignedBigInt(fee))
  )

  return leverageTokenActionFeeSetEvent
}

export function createLeverageTokenCreatedEvent(
  token: Address,
  collateralAsset: Address,
  debtAsset: Address,
  config: ethereum.Tuple
): LeverageTokenCreated {
  let leverageTokenCreatedEvent =
    changetype<LeverageTokenCreated>(newMockEvent())

  leverageTokenCreatedEvent.parameters = new Array()

  leverageTokenCreatedEvent.parameters.push(
    new ethereum.EventParam("token", ethereum.Value.fromAddress(token))
  )
  leverageTokenCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "collateralAsset",
      ethereum.Value.fromAddress(collateralAsset)
    )
  )
  leverageTokenCreatedEvent.parameters.push(
    new ethereum.EventParam("debtAsset", ethereum.Value.fromAddress(debtAsset))
  )
  leverageTokenCreatedEvent.parameters.push(
    new ethereum.EventParam("config", ethereum.Value.fromTuple(config))
  )

  return leverageTokenCreatedEvent
}

export function createManagementFeeChargedEvent(
  leverageToken: Address,
  sharesFee: BigInt
): ManagementFeeCharged {
  let managementFeeChargedEvent =
    changetype<ManagementFeeCharged>(newMockEvent())

  managementFeeChargedEvent.parameters = new Array()

  managementFeeChargedEvent.parameters.push(
    new ethereum.EventParam(
      "leverageToken",
      ethereum.Value.fromAddress(leverageToken)
    )
  )
  managementFeeChargedEvent.parameters.push(
    new ethereum.EventParam(
      "sharesFee",
      ethereum.Value.fromUnsignedBigInt(sharesFee)
    )
  )

  return managementFeeChargedEvent
}

export function createManagementFeeSetEvent(
  token: Address,
  fee: BigInt
): ManagementFeeSet {
  let managementFeeSetEvent = changetype<ManagementFeeSet>(newMockEvent())

  managementFeeSetEvent.parameters = new Array()

  managementFeeSetEvent.parameters.push(
    new ethereum.EventParam("token", ethereum.Value.fromAddress(token))
  )
  managementFeeSetEvent.parameters.push(
    new ethereum.EventParam("fee", ethereum.Value.fromUnsignedBigInt(fee))
  )

  return managementFeeSetEvent
}

export function createMintEvent(
  token: Address,
  sender: Address,
  actionData: ethereum.Tuple
): Mint {
  let mintEvent = changetype<Mint>(newMockEvent())

  mintEvent.parameters = new Array()

  mintEvent.parameters.push(
    new ethereum.EventParam("token", ethereum.Value.fromAddress(token))
  )
  mintEvent.parameters.push(
    new ethereum.EventParam("sender", ethereum.Value.fromAddress(sender))
  )
  mintEvent.parameters.push(
    new ethereum.EventParam("actionData", ethereum.Value.fromTuple(actionData))
  )

  return mintEvent
}

export function createRebalanceEvent(
  token: Address,
  sender: Address,
  actions: Array<ethereum.Tuple>
): Rebalance {
  let rebalanceEvent = changetype<Rebalance>(newMockEvent())

  rebalanceEvent.parameters = new Array()

  rebalanceEvent.parameters.push(
    new ethereum.EventParam("token", ethereum.Value.fromAddress(token))
  )
  rebalanceEvent.parameters.push(
    new ethereum.EventParam("sender", ethereum.Value.fromAddress(sender))
  )
  rebalanceEvent.parameters.push(
    new ethereum.EventParam("actions", ethereum.Value.fromTupleArray(actions))
  )

  return rebalanceEvent
}

export function createRedeemEvent(
  token: Address,
  sender: Address,
  actionData: ethereum.Tuple
): Redeem {
  let redeemEvent = changetype<Redeem>(newMockEvent())

  redeemEvent.parameters = new Array()

  redeemEvent.parameters.push(
    new ethereum.EventParam("token", ethereum.Value.fromAddress(token))
  )
  redeemEvent.parameters.push(
    new ethereum.EventParam("sender", ethereum.Value.fromAddress(sender))
  )
  redeemEvent.parameters.push(
    new ethereum.EventParam("actionData", ethereum.Value.fromTuple(actionData))
  )

  return redeemEvent
}

export function createRoleAdminChangedEvent(
  role: Bytes,
  previousAdminRole: Bytes,
  newAdminRole: Bytes
): RoleAdminChanged {
  let roleAdminChangedEvent = changetype<RoleAdminChanged>(newMockEvent())

  roleAdminChangedEvent.parameters = new Array()

  roleAdminChangedEvent.parameters.push(
    new ethereum.EventParam("role", ethereum.Value.fromFixedBytes(role))
  )
  roleAdminChangedEvent.parameters.push(
    new ethereum.EventParam(
      "previousAdminRole",
      ethereum.Value.fromFixedBytes(previousAdminRole)
    )
  )
  roleAdminChangedEvent.parameters.push(
    new ethereum.EventParam(
      "newAdminRole",
      ethereum.Value.fromFixedBytes(newAdminRole)
    )
  )

  return roleAdminChangedEvent
}

export function createRoleGrantedEvent(
  role: Bytes,
  account: Address,
  sender: Address
): RoleGranted {
  let roleGrantedEvent = changetype<RoleGranted>(newMockEvent())

  roleGrantedEvent.parameters = new Array()

  roleGrantedEvent.parameters.push(
    new ethereum.EventParam("role", ethereum.Value.fromFixedBytes(role))
  )
  roleGrantedEvent.parameters.push(
    new ethereum.EventParam("account", ethereum.Value.fromAddress(account))
  )
  roleGrantedEvent.parameters.push(
    new ethereum.EventParam("sender", ethereum.Value.fromAddress(sender))
  )

  return roleGrantedEvent
}

export function createRoleRevokedEvent(
  role: Bytes,
  account: Address,
  sender: Address
): RoleRevoked {
  let roleRevokedEvent = changetype<RoleRevoked>(newMockEvent())

  roleRevokedEvent.parameters = new Array()

  roleRevokedEvent.parameters.push(
    new ethereum.EventParam("role", ethereum.Value.fromFixedBytes(role))
  )
  roleRevokedEvent.parameters.push(
    new ethereum.EventParam("account", ethereum.Value.fromAddress(account))
  )
  roleRevokedEvent.parameters.push(
    new ethereum.EventParam("sender", ethereum.Value.fromAddress(sender))
  )

  return roleRevokedEvent
}

export function createTreasuryActionFeeSetEvent(
  action: i32,
  fee: BigInt
): TreasuryActionFeeSet {
  let treasuryActionFeeSetEvent =
    changetype<TreasuryActionFeeSet>(newMockEvent())

  treasuryActionFeeSetEvent.parameters = new Array()

  treasuryActionFeeSetEvent.parameters.push(
    new ethereum.EventParam(
      "action",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(action))
    )
  )
  treasuryActionFeeSetEvent.parameters.push(
    new ethereum.EventParam("fee", ethereum.Value.fromUnsignedBigInt(fee))
  )

  return treasuryActionFeeSetEvent
}

export function createTreasurySetEvent(treasury: Address): TreasurySet {
  let treasurySetEvent = changetype<TreasurySet>(newMockEvent())

  treasurySetEvent.parameters = new Array()

  treasurySetEvent.parameters.push(
    new ethereum.EventParam("treasury", ethereum.Value.fromAddress(treasury))
  )

  return treasurySetEvent
}

export function createUpgradedEvent(implementation: Address): Upgraded {
  let upgradedEvent = changetype<Upgraded>(newMockEvent())

  upgradedEvent.parameters = new Array()

  upgradedEvent.parameters.push(
    new ethereum.EventParam(
      "implementation",
      ethereum.Value.fromAddress(implementation)
    )
  )

  return upgradedEvent
}
