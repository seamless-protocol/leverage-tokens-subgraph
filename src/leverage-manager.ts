import {
  LendingAdapter,
  LeverageManager,
  LeverageToken,
  ManagementFeeCharged,
  Mint,
  Rebalance,
  Redeem,
} from "../generated/schema"
import {
  DefaultManagementFeeAtCreationSet as DefaultManagementFeeAtCreationSetEvent,
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
  TreasurySet as TreasurySetEvent
} from "../generated/LeverageManager/LeverageManager"
import { MorphoLendingAdapter } from "../generated/templates/MorphoLendingAdapter/MorphoLendingAdapter"
import { Address, BigDecimal, BigInt, Bytes } from "@graphprotocol/graph-ts"
import { getLeverageManager, LendingAdapterType } from "./constants"

export function handleDefaultManagementFeeAtCreationSet(
  event: DefaultManagementFeeAtCreationSetEvent
): void {
}

export function handleLeverageManagerInitialized(
  event: LeverageManagerInitializedEvent
): void {
  let leverageManager = new LeverageManager(event.address)

  leverageManager.admin = Address.zero()
  leverageManager.feeManagerRole = Address.zero()
  leverageManager.treasury = Address.zero()
  leverageManager.leverageTokenFactory = Address.zero()
  leverageManager.numLeverageTokens = BigInt.zero()
  leverageManager.totalCollateral = BigInt.zero()
  leverageManager.totalCollateralUSD = BigDecimal.zero()
  leverageManager.totalDebt = BigInt.zero()
  leverageManager.totalDebtUSD = BigDecimal.zero()
  leverageManager.totalHolders = BigInt.zero()

  leverageManager.save()
}

export function handleLeverageTokenActionFeeSet(
  event: LeverageTokenActionFeeSetEvent
): void {
}

export function handleLeverageTokenCreated(
  event: LeverageTokenCreatedEvent
): void {
  let leverageToken = LeverageToken.load(event.params.token)
  if (leverageToken) {

    let lendingAdapter = LendingAdapter.load(event.params.config.lendingAdapter)
    if (!lendingAdapter) {
      lendingAdapter = new LendingAdapter(event.params.config.lendingAdapter)
      // TODO: Determine the type of lending adapter by indexing lending adapters deployed from the morpho lending adapter factory,
      // or by try / catch querying the market id on the lending adapter contract
      lendingAdapter.type = LendingAdapterType.MORPHO
      if (lendingAdapter.type === LendingAdapterType.MORPHO) {
        const morphoLendingAdapter = MorphoLendingAdapter.bind(event.params.config.lendingAdapter)

        const marketId = morphoLendingAdapter.morphoMarketId();
        const marketParams = morphoLendingAdapter.marketParams();

        lendingAdapter.morphoMarketId = marketId;
        lendingAdapter.collateralAsset = marketParams.getCollateralToken();
        lendingAdapter.debtAsset = marketParams.getLoanToken();
      }

      lendingAdapter.save()
    }

    leverageToken.lendingAdapter = lendingAdapter.id
    leverageToken.rebalanceAdapter = event.params.config.rebalanceAdapter

    leverageToken.save()

    const leverageManager = getLeverageManager()
    if (leverageManager) {
      leverageManager.numLeverageTokens = leverageManager.numLeverageTokens.plus(BigInt.fromI32(1))
      leverageManager.save()
    }
  }
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
}

export function handleRoleGranted(event: RoleGrantedEvent): void {
}

export function handleRoleRevoked(event: RoleRevokedEvent): void {
}

export function handleTreasuryActionFeeSet(
  event: TreasuryActionFeeSetEvent
): void {
}

export function handleTreasurySet(event: TreasurySetEvent): void {
}