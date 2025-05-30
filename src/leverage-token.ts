import { Address, BigInt } from "@graphprotocol/graph-ts"
import { LendingAdapter, LeverageManager, LeverageToken, LeverageTokenBalanceChange, Oracle, Position, ProfitAndLoss, User } from "../generated/schema"
import {
  Transfer as TransferEvent,
} from "../generated/templates/LeverageToken/LeverageToken"
import { getPositionStub } from "./stubs"
import { getPosition } from "./utils"
import { LeverageManager as LeverageManagerContract } from "../generated/LeverageManager/LeverageManager"
import { convertDebtToCollateral } from "./utils"
import { LeverageTokenBalanceChangeType } from "./constants"
export function handleTransfer(event: TransferEvent): void {
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

  // We have to fetch the current equity on chain due to interest accrual potentially changing the current amount of equity
  const leverageManagerContract = LeverageManagerContract.bind(Address.fromBytes(leverageToken.leverageManager))
  const leverageTokenState = leverageManagerContract.getLeverageTokenState(event.address)

  const equityInCollateral = convertDebtToCollateral(oracle, leverageTokenState.equity)
  const equityInDebt = leverageTokenState.equity

  const isBurn = event.params.to.equals(Address.zero())
  const isMint = event.params.from.equals(Address.zero())
  const isTransfer = !isBurn && !isMint

  let equityInCollateralDelta = BigInt.zero()
  let equityInDebtDelta = BigInt.zero()

  if (isMint) {
    leverageToken.totalSupply = leverageToken.totalSupply.plus(event.params.value)
  } else if (isBurn) {
    leverageToken.totalSupply = leverageToken.totalSupply.minus(event.params.value)
  } else {
    equityInCollateralDelta = calculateEquityForShares(
      event.params.value,
      equityInCollateral,
      leverageToken.totalSupply
    )
    equityInDebtDelta = calculateEquityForShares(
      event.params.value,
      equityInDebt,
      leverageToken.totalSupply
    )
  }

  if (!isMint) {
    const fromPosition = getPosition(event.params.from, Address.fromBytes(leverageToken.id))
    if (!fromPosition) {
      return
    }

    if (isTransfer) {
      const equityDepositedForSharesInCollateral = event.params.value
        .times(fromPosition.totalEquityDepositInCollateral)
        .div(fromPosition.balance)
      const equityDepositedForSharesInDebt = event.params.value
        .times(fromPosition.totalEquityDepositInDebt)
        .div(fromPosition.balance)

      // Realized pnl is calculated when LTs are transferred out from an account. The realized pnl loss is equal to the
      // current value of the shares transferred
      const realizedPnl = equityInCollateralDelta.neg()
      const pnl = new ProfitAndLoss(0)
      pnl.position = fromPosition.id
      pnl.realized = realizedPnl
      pnl.equityReceived = BigInt.zero()
      pnl.equityPaid = equityDepositedForSharesInCollateral
      pnl.timestamp = event.block.timestamp.toI64()
      pnl.blockNumber = event.block.number
      pnl.save()

      fromPosition.realizedPnl = fromPosition.realizedPnl.plus(realizedPnl) // Realized pnl is negative so this decreases
      fromPosition.totalEquityDepositInCollateral = fromPosition.totalEquityDepositInCollateral.minus(equityDepositedForSharesInCollateral);
      fromPosition.totalEquityDepositInDebt = fromPosition.totalEquityDepositInDebt.minus(equityDepositedForSharesInDebt)
      fromPosition.balance = fromPosition.balance.minus(event.params.value);
      fromPosition.save()

      const balanceChange = new LeverageTokenBalanceChange(0)
      balanceChange.position = fromPosition.id
      balanceChange.leverageToken = leverageToken.id
      balanceChange.timestamp = event.block.timestamp.toI64()
      balanceChange.blockNumber = event.block.number
      balanceChange.amount = event.params.value.neg()
      balanceChange.equityInCollateral = equityInCollateralDelta.neg()
      balanceChange.equityInDebt = equityInDebtDelta.neg()
      balanceChange.type = LeverageTokenBalanceChangeType.TRANSFER
      balanceChange.save()
    }

    if (fromPosition.balance.isZero()) {
      leverageToken.totalHolders = leverageToken.totalHolders.minus(BigInt.fromI32(1))
      leverageManager.totalHolders = leverageManager.totalHolders.minus(BigInt.fromI32(1))
    }
  }

  if (!isBurn) {
    let user = User.load(event.params.to)
    if (!user) {
      user = new User(event.params.to)
      user.save()
    }

    let toPosition = getPosition(event.params.to, Address.fromBytes(leverageToken.id))
    if (!toPosition) {
      toPosition = getPositionStub(Address.fromBytes(user.id), Address.fromBytes(leverageToken.id))
    }

    if (toPosition.balance.isZero() && event.params.value.gt(BigInt.zero())) {
      leverageToken.totalHolders = leverageToken.totalHolders.plus(BigInt.fromI32(1))
      leverageManager.totalHolders = leverageManager.totalHolders.plus(BigInt.fromI32(1))
    }

    if (isTransfer) {
      toPosition.balance = toPosition.balance.plus(event.params.value);
      toPosition.save()

      const balanceChange = new LeverageTokenBalanceChange(0)
      balanceChange.position = toPosition.id
      balanceChange.leverageToken = leverageToken.id
      balanceChange.timestamp = event.block.timestamp.toI64()
      balanceChange.blockNumber = event.block.number
      balanceChange.amount = event.params.value
      balanceChange.equityInCollateral = equityInCollateralDelta
      balanceChange.equityInDebt = equityInDebtDelta
      balanceChange.type = LeverageTokenBalanceChangeType.TRANSFER
      balanceChange.save()
    }
  }

  leverageToken.save()
  leverageManager.save()
}

function calculateEquityForShares(shares: BigInt, totalEquity: BigInt, totalSupply: BigInt): BigInt {
  return shares.times(totalEquity).div(totalSupply);
}