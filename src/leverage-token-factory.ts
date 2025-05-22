import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts"
import {
  BeaconProxyCreated as BeaconProxyCreatedEvent,
} from "../generated/LeverageTokenFactory/LeverageTokenFactory"
import {
  LendingAdapter,
  LeverageToken,
} from "../generated/schema"
import { LeverageToken as LeverageTokenContract } from "../generated/templates/LeverageToken/LeverageToken"
import { getLeverageManager, LendingAdapterType } from "./constants"

export function handleLeverageTokenCreated(event: BeaconProxyCreatedEvent): void {
  let lendingAdapter = LendingAdapter.load(Address.zero())
  if (!lendingAdapter) {
    lendingAdapter = new LendingAdapter(Address.zero())
    lendingAdapter.type = LendingAdapterType.OTHER
    lendingAdapter.morphoMarketId = Address.zero()
    lendingAdapter.collateralAsset = Address.zero()
    lendingAdapter.debtAsset = Address.zero()
    lendingAdapter.save()
  }

  let leverageManager = getLeverageManager()
  if (!leverageManager) {
    return
  }

  let leverageToken = new LeverageToken(event.params.proxy)
  let leverageTokenContract = LeverageTokenContract.bind(event.params.proxy)

  leverageToken.leverageManager = leverageManager.id
  leverageToken.name = leverageTokenContract.name()
  leverageToken.symbol = leverageTokenContract.symbol()
  leverageToken.lendingAdapter = lendingAdapter.id
  leverageToken.rebalanceAdapter = Address.zero()
  leverageToken.managementFee = BigInt.zero()
  leverageToken.mintTreasuryActionFee = BigInt.zero()
  leverageToken.redeemTreasuryActionFee = BigInt.zero()
  leverageToken.mintTokenActionFee = BigInt.zero()
  leverageToken.redeemTokenActionFee = BigInt.zero()
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
  leverageToken.createdTimestamp = event.block.timestamp
  leverageToken.createdBlockNumber = event.block.number
  leverageToken.save()
}