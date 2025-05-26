import {
  LendingAdapter,
  LeverageManager,
  LeverageToken,
  LeverageManagerAssetStats,
  User,
  Mint,
  EquityUpdate,
  PositionEquityUpdate
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
import { LeverageToken as LeverageTokenTemplate } from "../generated/templates"
import { LeverageToken as LeverageTokenContract } from "../generated/templates/LeverageToken/LeverageToken"
import { LeverageManager as LeverageManagerContract } from "../generated/LeverageManager/LeverageManager"
import { MorphoLendingAdapter as MorphoLendingAdapterContract } from "../generated/LeverageManager/MorphoLendingAdapter"
import { Address, BigInt } from "@graphprotocol/graph-ts"
import { ExternalAction, LendingAdapterType, MAX_UINT256_STRING, WAD_STRING } from "./constants"
import { getLeverageManagerStub, getPositionStub } from "./stubs"
import { getPosition } from "./utils"

export function handleDefaultManagementFeeAtCreationSet(
  event: DefaultManagementFeeAtCreationSetEvent
): void {
}

export function handleLeverageManagerInitialized(
  event: LeverageManagerInitializedEvent
): void {
  let leverageManager = LeverageManager.load(event.address)
  if (!leverageManager) {
    return
  }

  leverageManager.leverageTokenFactory = event.params.leverageTokenFactory

  leverageManager.save()
}

export function handleLeverageTokenActionFeeSet(
  event: LeverageTokenActionFeeSetEvent
): void {
}

export function handleLeverageTokenCreated(
  event: LeverageTokenCreatedEvent
): void {
  let leverageManager = LeverageManager.load(event.address)
  if (!leverageManager) {
    return
  }

  leverageManager.leverageTokensCount = leverageManager.leverageTokensCount.plus(BigInt.fromI32(1))
  leverageManager.save()

  let lendingAdapter = LendingAdapter.load(event.params.config.lendingAdapter)
  if (!lendingAdapter) {
    lendingAdapter = initLendingAdapter(event.params.config.lendingAdapter)
  }

  LeverageTokenTemplate.create(event.params.token)
  const leverageToken = new LeverageToken(event.params.token)
  const leverageTokenContract = LeverageTokenContract.bind(event.params.token)

  leverageToken.leverageManager = leverageManager.id
  leverageToken.name = leverageTokenContract.name()
  leverageToken.symbol = leverageTokenContract.symbol()

  leverageToken.createdTimestamp = event.block.timestamp
  leverageToken.createdBlockNumber = event.block.number

  leverageToken.lendingAdapter = lendingAdapter.id
  leverageToken.rebalanceAdapter = event.params.config.rebalanceAdapter

  leverageToken.managementFee = leverageManager.defaultManagementFeeAtCreation
  leverageToken.mintTokenActionFee = event.params.config.mintTokenFee
  leverageToken.redeemTokenActionFee = event.params.config.redeemTokenFee

  // ======== Boilerplate values ========

  // Default to max uint256, like the protocol does for an empty LeverageToken
  leverageToken.collateralRatio = BigInt.fromString(MAX_UINT256_STRING);

  leverageToken.totalCollateral = BigInt.zero()
  leverageToken.totalCollateralInDebt = BigInt.zero()
  leverageToken.totalDebt = BigInt.zero()
  leverageToken.totalDebtInCollateral = BigInt.zero()
  leverageToken.totalEquityInCollateral = BigInt.zero()
  leverageToken.totalEquityInDebt = BigInt.zero()

  leverageToken.totalSupply = BigInt.zero()
  leverageToken.totalHolders = BigInt.zero()

  leverageToken.totalMintTokenActionFees = BigInt.zero()
  leverageToken.totalRedeemTokenActionFees = BigInt.zero()
  leverageToken.totalMintTreasuryFees = BigInt.zero()
  leverageToken.totalRedeemTreasuryFees = BigInt.zero()
  leverageToken.totalManagementFees = BigInt.zero()

  // ======== End of boilerplate values ========

  leverageToken.save()

  initLeverageManagerAssetStats(Address.fromBytes(leverageManager.id), Address.fromBytes(lendingAdapter.collateralAsset))
  initLeverageManagerAssetStats(Address.fromBytes(leverageManager.id), Address.fromBytes(lendingAdapter.debtAsset))
}

export function handleManagementFeeCharged(
  event: ManagementFeeChargedEvent
): void {
}

export function handleManagementFeeSet(event: ManagementFeeSetEvent): void {
}

// TODO: Add pricing in both assets when oracle indexing is implemented
export function handleMint(event: MintEvent): void {
  const leverageManager = LeverageManager.load(event.address)
  if (!leverageManager) {
    return
  }

  const leverageToken = LeverageToken.load(event.params.token)
  if (!leverageToken) {
    return
  }

  const lendingAdapter = LendingAdapter.load(leverageToken.lendingAdapter)
  if (!lendingAdapter) {
    return
  }

  const leverageManagerCollateralAssetStats = LeverageManagerAssetStats.load(lendingAdapter.collateralAsset)
  if (!leverageManagerCollateralAssetStats) {
    return
  }

  const leverageManagerDebtAssetStats = LeverageManagerAssetStats.load(lendingAdapter.debtAsset)
  if (!leverageManagerDebtAssetStats) {
    return
  }

  const user = User.load(event.params.sender)
  if (!user) {
    return
  }

  let position = getPosition(event.params.sender, Address.fromBytes(leverageToken.id))
  if (!position) {
    position = getPositionStub(event.params.sender, Address.fromBytes(leverageToken.id))
  }

  // The id for timeseries is autogenerated; even if we set it to a real value, it is silently overwritten
  const mint = new Mint(0)
  mint.position = position.id
  mint.leverageToken = leverageToken.id
  mint.amount = event.params.actionData.shares
  mint.collateral = event.params.actionData.collateral
  mint.collateralInDebt = BigInt.zero()
  mint.debt = event.params.actionData.debt
  mint.debtInCollateral = BigInt.zero()
  mint.equityInCollateral = event.params.actionData.equity
  mint.equityInDebt = BigInt.zero()
  mint.tokenActionFee = event.params.actionData.tokenFee
  mint.treasuryActionFee = event.params.actionData.treasuryFee
  mint.timestamp = event.block.timestamp.toI64()
  mint.blockNumber = event.block.number
  mint.save()

  position.collateral = position.collateral.plus(mint.collateral)
  position.debt = position.debt.plus(mint.debt)
  position.collateralInDebt = BigInt.zero()
  position.debtInCollateral = BigInt.zero()
  position.equityInCollateral = position.equityInCollateral.plus(mint.equityInCollateral)
  position.equityInDebt = BigInt.zero()
  position.save()

  leverageToken.totalCollateral = leverageToken.totalCollateral.plus(mint.collateral)
  leverageToken.totalCollateralInDebt = BigInt.zero()
  leverageToken.totalDebt = leverageToken.totalDebt.plus(mint.debt)
  leverageToken.totalDebtInCollateral = BigInt.zero()
  leverageToken.totalEquityInCollateral = leverageToken.totalEquityInCollateral.plus(mint.equityInCollateral)
  leverageToken.totalEquityInDebt = BigInt.zero()
  leverageToken.totalMintTokenActionFees = leverageToken.totalMintTokenActionFees.plus(mint.tokenActionFee)
  leverageToken.totalMintTreasuryFees = leverageToken.totalMintTreasuryFees.plus(mint.treasuryActionFee)
  leverageToken.collateralRatio = leverageToken.totalCollateralInDebt.times(BigInt.fromString(WAD_STRING)).div(leverageToken.totalDebt)
  leverageToken.save()

  // The id for timeseries is autogenerated; even if we set it to a real value, it is silently overwritten
  const positionEquityUpdate = new PositionEquityUpdate(0)
  positionEquityUpdate.position = position.id
  positionEquityUpdate.collateral = position.collateral
  positionEquityUpdate.debt = position.debt
  positionEquityUpdate.collateralInDebt = position.collateralInDebt
  positionEquityUpdate.debtInCollateral = position.debtInCollateral
  positionEquityUpdate.equityInCollateral = position.equityInCollateral
  positionEquityUpdate.equityInDebt = position.equityInDebt
  positionEquityUpdate.timestamp = event.block.timestamp.toI64()
  positionEquityUpdate.blockNumber = event.block.number
  positionEquityUpdate.save()

  // The id for timeseries is autogenerated; even if we set it to a real value, it is silently overwritten
  const leverageTokenEquityUpdate = new EquityUpdate(0)
  leverageTokenEquityUpdate.leverageToken = leverageToken.id
  leverageTokenEquityUpdate.totalCollateral = leverageToken.totalCollateral
  leverageTokenEquityUpdate.totalCollateralInDebt = leverageToken.totalCollateralInDebt
  leverageTokenEquityUpdate.totalDebt = leverageToken.totalDebt
  leverageTokenEquityUpdate.totalDebtInCollateral = leverageToken.totalDebtInCollateral
  leverageTokenEquityUpdate.totalEquityInCollateral = leverageToken.totalEquityInCollateral
  leverageTokenEquityUpdate.totalEquityInDebt = leverageToken.totalEquityInDebt
  leverageTokenEquityUpdate.collateralRatio = leverageToken.collateralRatio
  leverageTokenEquityUpdate.timestamp = event.block.timestamp.toI64()
  leverageTokenEquityUpdate.blockNumber = event.block.number
  leverageTokenEquityUpdate.save()

  leverageManagerCollateralAssetStats.totalCollateral = leverageManagerCollateralAssetStats.totalCollateral.plus(mint.collateral)
  leverageManagerCollateralAssetStats.save()

  leverageManagerDebtAssetStats.totalDebt = leverageManagerDebtAssetStats.totalDebt.plus(mint.debt)
  leverageManagerDebtAssetStats.save()
}

export function handleRebalance(event: RebalanceEvent): void {
}

export function handleRedeem(event: RedeemEvent): void {
}

export function handleRoleAdminChanged(event: RoleAdminChangedEvent): void {

}

export function handleRoleGranted(event: RoleGrantedEvent): void {
  let leverageManager = LeverageManager.load(event.address)
  if (!leverageManager) {
    // Handling the case where the LeverageManager is being initialized, this is the first event emitted that we need
    // to handle
    leverageManager = getLeverageManagerStub(event.address)
  }

  let leverageManagerContract = LeverageManagerContract.bind(Address.fromBytes(leverageManager.id))

  if (event.params.role.equals(leverageManagerContract.DEFAULT_ADMIN_ROLE())) {
    leverageManager.admin = event.params.account
  } else if (event.params.role.equals(leverageManagerContract.FEE_MANAGER_ROLE())) {
    leverageManager.feeManagerRole = event.params.account
  }

  leverageManager.save()
}

export function handleRoleRevoked(event: RoleRevokedEvent): void {
}

export function handleTreasuryActionFeeSet(
  event: TreasuryActionFeeSetEvent
): void {
  let leverageManager = LeverageManager.load(event.address)
  if (!leverageManager) {
    return
  }

  if (event.params.action === ExternalAction.MINT) {
    leverageManager.mintTreasuryActionFee = event.params.fee
  } else if (event.params.action === ExternalAction.REDEEM) {
    leverageManager.redeemTreasuryActionFee = event.params.fee
  }

  leverageManager.save()
}

export function handleTreasurySet(event: TreasurySetEvent): void {
  let leverageManager = LeverageManager.load(event.address)
  if (!leverageManager) {
    return
  }

  leverageManager.treasury = event.params.treasury
  leverageManager.save()
}

function initLendingAdapter(address: Address): LendingAdapter {
  let lendingAdapter = new LendingAdapter(address)
  // TODO: Determine the type of lending adapter by indexing lending adapters deployed from the morpho lending adapter factory,
  // or by try / catch querying the market id on the lending adapter contract
  lendingAdapter.type = LendingAdapterType.MORPHO
  if (lendingAdapter.type === LendingAdapterType.MORPHO) {
    const morphoLendingAdapter = MorphoLendingAdapterContract.bind(address)

    const marketId = morphoLendingAdapter.morphoMarketId();
    const marketParams = morphoLendingAdapter.marketParams();

    lendingAdapter.morphoMarketId = marketId;
    lendingAdapter.collateralAsset = marketParams.getCollateralToken();
    lendingAdapter.debtAsset = marketParams.getLoanToken();
  }

  lendingAdapter.save()

  return lendingAdapter
}

function initLeverageManagerAssetStats(leverageManager: Address, asset: Address): LeverageManagerAssetStats {
  let leverageManagerAssetStats = LeverageManagerAssetStats.load(asset)
  if (!leverageManagerAssetStats) {
    leverageManagerAssetStats = new LeverageManagerAssetStats(asset)
    leverageManagerAssetStats.leverageManager = leverageManager
    leverageManagerAssetStats.totalCollateral = BigInt.zero()
    leverageManagerAssetStats.totalDebt = BigInt.zero()
    leverageManagerAssetStats.save()
  }
  return leverageManagerAssetStats
}