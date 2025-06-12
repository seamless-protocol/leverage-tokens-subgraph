import { Address, BigInt } from "@graphprotocol/graph-ts"
import { LendingAdapter, LeverageManager, LeverageToken, LeverageTokenBalanceChange, Oracle, User } from "../generated/schema"
import {
  Transfer as TransferEvent,
} from "../generated/templates/LeverageToken/LeverageToken"
import { getPositionStub } from "./stubs"
import { convertToEquity, getPosition } from "./utils"
import { LeverageManager as LeverageManagerContract } from "../generated/LeverageManager/LeverageManager"
import { convertDebtToCollateral } from "./utils"
import { LeverageTokenBalanceChangeType } from "./constants"

export function handleTransfer(event: TransferEvent): void {
  const isBurn = event.params.to.equals(Address.zero())
  const isMint = event.params.from.equals(Address.zero())
  const isTransfer = !isBurn && !isMint

  // handleMint and handleRedeem in leverage-manager.ts updates data for mints and redeems, so we only handle transfers here
  if (isTransfer) {
    const leverageToken = LeverageToken.load(event.address)
    if (!leverageToken) {
      return
    }

    const leverageManager = LeverageManager.load(leverageToken.leverageManager)
    if (!leverageManager) {
      return
    }

    const lendingAdapter = LendingAdapter.load(leverageToken.lendingAdapter)
    if (!lendingAdapter) {
      return
    }

    const oracle = Oracle.load(lendingAdapter.oracle)
    if (!oracle) {
      return
    }

    const fromPosition = getPosition(event.params.from, Address.fromBytes(leverageToken.id))
    if (!fromPosition) {
      return
    }

    // We have to fetch the current equity on chain due to interest accrual potentially changing the current amount of equity
    const leverageManagerContract = LeverageManagerContract.bind(Address.fromBytes(leverageToken.leverageManager))
    const leverageTokenState = leverageManagerContract.getLeverageTokenState(event.address)

    const equityInCollateral = convertDebtToCollateral(oracle, leverageTokenState.equity)
    const equityInDebt = leverageTokenState.equity

    const shares = event.params.value

    // The equity value of the shares is calculated pro-rata based on the total supply of shares
    const equityInCollateralDelta = convertToEquity(
      shares,
      equityInCollateral,
      leverageToken.totalSupply
    )
    const equityInDebtDelta = convertToEquity(
      shares,
      equityInDebt,
      leverageToken.totalSupply,
    )

    // The equity deposited for the shares is calculated pro-rata based on the fromPosition's balance of shares and their current equity deposited
    const equityDepositedForSharesInCollateral = convertToEquity(shares, fromPosition.totalEquityDepositedInCollateral, fromPosition.balance)
    const equityDepositedForSharesInDebt = convertToEquity(shares, fromPosition.totalEquityDepositedInDebt, fromPosition.balance)

    // The total equity deposited by the user is decreased by the equity deposited for the shares transferred
    // This is because the shares are transferred out, so the pnl for them is now realized
    fromPosition.totalEquityDepositedInCollateral = fromPosition.totalEquityDepositedInCollateral.minus(equityDepositedForSharesInCollateral);
    fromPosition.totalEquityDepositedInDebt = fromPosition.totalEquityDepositedInDebt.minus(equityDepositedForSharesInDebt)
    fromPosition.balance = fromPosition.balance.minus(shares);
    fromPosition.save()

    const fromBalanceChange = new LeverageTokenBalanceChange(0)
    fromBalanceChange.position = fromPosition.id
    fromBalanceChange.leverageToken = leverageToken.id
    fromBalanceChange.timestamp = event.block.timestamp.toI64()
    fromBalanceChange.blockNumber = event.block.number
    fromBalanceChange.amount = fromPosition.balance
    fromBalanceChange.amountDelta = shares.neg()
    fromBalanceChange.equityInCollateral = equityInCollateralDelta.neg()
    fromBalanceChange.equityInDebt = equityInDebtDelta.neg()
    fromBalanceChange.equityDepositedInCollateral = equityDepositedForSharesInCollateral.neg()
    fromBalanceChange.equityDepositedInDebt = equityDepositedForSharesInDebt.neg()
    fromBalanceChange.type = LeverageTokenBalanceChangeType.TRANSFER
    fromBalanceChange.save()

    if (fromPosition.balance.isZero()) {
      leverageToken.totalHolders = leverageToken.totalHolders.minus(BigInt.fromI32(1))
      leverageManager.totalHolders = leverageManager.totalHolders.minus(BigInt.fromI32(1))
    }

    let toUser = User.load(event.params.to)
    if (!toUser) {
      toUser = new User(event.params.to)
      toUser.save()
    }

    let toPosition = getPosition(event.params.to, Address.fromBytes(leverageToken.id))
    if (!toPosition) {
      toPosition = getPositionStub(Address.fromBytes(toUser.id), Address.fromBytes(leverageToken.id))
    }

    if (toPosition.balance.isZero() && shares.gt(BigInt.zero())) {
      leverageToken.totalHolders = leverageToken.totalHolders.plus(BigInt.fromI32(1))
      leverageManager.totalHolders = leverageManager.totalHolders.plus(BigInt.fromI32(1))
    }

    // The receiver of the shares has their total equity deposited increased by the value of the shares at the time they are received
    toPosition.totalEquityDepositedInCollateral = toPosition.totalEquityDepositedInCollateral.plus(equityInCollateralDelta)
    toPosition.totalEquityDepositedInDebt = toPosition.totalEquityDepositedInDebt.plus(equityInDebtDelta)
    toPosition.balance = toPosition.balance.plus(shares);
    toPosition.save()

    const toBalanceChange = new LeverageTokenBalanceChange(0)
    toBalanceChange.position = toPosition.id
    toBalanceChange.leverageToken = leverageToken.id
    toBalanceChange.timestamp = event.block.timestamp.toI64()
    toBalanceChange.blockNumber = event.block.number
    toBalanceChange.amount = toPosition.balance
    toBalanceChange.amountDelta = shares
    toBalanceChange.equityInCollateral = equityInCollateralDelta
    toBalanceChange.equityInDebt = equityInDebtDelta
    toBalanceChange.equityDepositedInCollateral = equityInCollateralDelta
    toBalanceChange.equityDepositedInDebt = equityInDebtDelta
    toBalanceChange.type = LeverageTokenBalanceChangeType.TRANSFER
    toBalanceChange.save()

    leverageToken.save()
    leverageManager.save()
  }
}