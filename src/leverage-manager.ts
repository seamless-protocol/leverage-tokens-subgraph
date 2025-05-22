import {
  LendingAdapter,
  LeverageManager,
  LeverageToken
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
import { LeverageToken as LeverageTokenContract } from "../generated/templates/LeverageToken/LeverageToken"
import { LeverageManager as LeverageManagerContract } from "../generated/LeverageManager/LeverageManager"
import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts"
import { ExternalAction, LendingAdapterType, MAX_UINT256_STRING, ADDRESSES } from "./constants"

export function handleDefaultManagementFeeAtCreationSet(
  event: DefaultManagementFeeAtCreationSetEvent
): void {
}

export function handleLeverageManagerInitialized(
  event: LeverageManagerInitializedEvent
): void {
  let leverageManager = getLeverageManager()
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
  let leverageManager = getLeverageManager()
  if (!leverageManager) {
    return
  }

  leverageManager.numLeverageTokens = leverageManager.numLeverageTokens.plus(BigInt.fromI32(1))
  leverageManager.save()

  let lendingAdapter = LendingAdapter.load(event.params.config.lendingAdapter)
  if (!lendingAdapter) {
    lendingAdapter = initLendingAdapter(event.params.config.lendingAdapter)
  }

  let leverageToken = new LeverageToken(event.params.token)
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
  leverageToken.totalCollateralUSD = BigDecimal.zero()
  leverageToken.totalDebt = BigInt.zero()
  leverageToken.totalDebtUSD = BigDecimal.zero()
  leverageToken.totalEquityInCollateral = BigInt.zero()
  leverageToken.totalEquityInDebt = BigInt.zero()
  leverageToken.totalEquityUSD = BigDecimal.zero()

  leverageToken.totalSupply = BigInt.zero()
  leverageToken.totalHolders = BigInt.zero()

  leverageToken.totalMintTokenActionFees = BigInt.zero()
  leverageToken.totalMintTokenActionFeesUSD = BigDecimal.zero()
  leverageToken.totalRedeemTokenActionFees = BigInt.zero()
  leverageToken.totalRedeemTokenActionFeesUSD = BigDecimal.zero()
  leverageToken.totalMintTreasuryFees = BigInt.zero()
  leverageToken.totalMintTreasuryFeesUSD = BigDecimal.zero()
  leverageToken.totalRedeemTreasuryFees = BigInt.zero()
  leverageToken.totalRedeemTreasuryFeesUSD = BigDecimal.zero()
  leverageToken.totalManagementFees = BigInt.zero()
  leverageToken.totalManagementFeesUSD = BigDecimal.zero()

  // ======== End of boilerplate values ========

  leverageToken.save()
}

export function handleManagementFeeCharged(
  event: ManagementFeeChargedEvent
): void {
}

export function handleManagementFeeSet(event: ManagementFeeSetEvent): void {
}

export function handleMint(event: MintEvent): void {
}

export function handleRebalance(event: RebalanceEvent): void {
}

export function handleRedeem(event: RedeemEvent): void {
}

export function handleRoleAdminChanged(event: RoleAdminChangedEvent): void {

}

export function handleRoleGranted(event: RoleGrantedEvent): void {
  let leverageManager = getLeverageManager()
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
  let leverageManager = getLeverageManager()
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
  let leverageManager = getLeverageManager()
  if (!leverageManager) {
    return
  }

  leverageManager.treasury = event.params.treasury
  leverageManager.save()
}

export function getLeverageManager(): LeverageManager | null {
  return LeverageManager.load(Address.fromString(ADDRESSES.LEVERAGE_MANAGER))
}

function getLeverageManagerStub(address: Address): LeverageManager {
  let leverageManager = new LeverageManager(address)
  leverageManager.admin = Address.zero()
  leverageManager.feeManagerRole = Address.zero()
  leverageManager.treasury = Address.zero()

  leverageManager.leverageTokenFactory = Address.zero()

  leverageManager.mintTreasuryActionFee = BigInt.zero()
  leverageManager.redeemTreasuryActionFee = BigInt.zero()
  leverageManager.defaultManagementFeeAtCreation = BigInt.zero()

  leverageManager.totalCollateral = BigInt.zero()
  leverageManager.totalCollateralUSD = BigDecimal.zero()
  leverageManager.totalDebt = BigInt.zero()
  leverageManager.totalDebtUSD = BigDecimal.zero()
  leverageManager.totalHolders = BigInt.zero()

  leverageManager.numLeverageTokens = BigInt.zero()

  return leverageManager
}

function initLendingAdapter(address: Address): LendingAdapter {
  let lendingAdapter = new LendingAdapter(address)
  // TODO: Determine the type of lending adapter by indexing lending adapters deployed from the morpho lending adapter factory,
  // or by try / catch querying the market id on the lending adapter contract
  lendingAdapter.type = LendingAdapterType.MORPHO
  if (lendingAdapter.type === LendingAdapterType.MORPHO) {
    const morphoLendingAdapter = MorphoLendingAdapter.bind(address)

    const marketId = morphoLendingAdapter.morphoMarketId();
    const marketParams = morphoLendingAdapter.marketParams();

    lendingAdapter.morphoMarketId = marketId;
    lendingAdapter.collateralAsset = marketParams.getCollateralToken();
    lendingAdapter.debtAsset = marketParams.getLoanToken();
  }

  lendingAdapter.save()

  return lendingAdapter
}