import { Address, BigInt } from "@graphprotocol/graph-ts"
import { Balance, LendingAdapter, LeverageManager, LeverageToken, Oracle, Position, ProfitAndLoss, User } from "../generated/schema"
import {
  Transfer as TransferEvent,
} from "../generated/templates/LeverageToken/LeverageToken"
import { getPositionStub } from "./stubs"
import { getPosition } from "./utils"
import { LeverageManager as LeverageManagerContract } from "../generated/LeverageManager/LeverageManager"
import { convertDebtToCollateral } from "./utils"
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
      // Realized pnl is calculated when LTs are transferred out from an account. To calculate
      // the realized pnl on the transfer, we calculate the difference between the equity value of the LT shares,
      // and the equity the user paid for the shares
      const equityPaidForSharesInCollateral = event.params.value
        .times(fromPosition.equityPaidInCollateral)
        .div(fromPosition.balance)
      const equityPaidForSharesInDebt = event.params.value
        .times(fromPosition.equityPaidInDebt)
        .div(fromPosition.balance)
      const realizedEquityInCollateral = equityInCollateralDelta.minus(equityPaidForSharesInCollateral)
      updatePnl(event, fromPosition, realizedEquityInCollateral, equityInCollateralDelta, equityPaidForSharesInCollateral)
      fromPosition.totalPnl = fromPosition.totalPnl.plus(realizedEquityInCollateral)

      fromPosition.equityPaidInCollateral = fromPosition.equityPaidInCollateral.minus(equityPaidForSharesInCollateral);
      fromPosition.equityPaidInDebt = fromPosition.equityPaidInDebt.minus(equityPaidForSharesInDebt)
      fromPosition.balance = fromPosition.balance.minus(event.params.value);
      fromPosition.save()

      const balance = new Balance(0)
      balance.position = fromPosition.id
      balance.timestamp = event.block.timestamp.toI64()
      balance.blockNumber = event.block.number
      balance.amount = event.params.value.neg()
      balance.equityInCollateral = equityInCollateralDelta.neg()
      balance.equityInDebt = equityInDebtDelta.neg()
      balance.save()
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
      toPosition.equityPaidInCollateral = toPosition.equityPaidInCollateral.plus(equityInCollateralDelta);
      toPosition.equityPaidInDebt = toPosition.equityPaidInDebt.plus(equityInDebtDelta);
      toPosition.balance = toPosition.balance.plus(event.params.value);
      toPosition.save()

      const balance = new Balance(0)
      balance.position = toPosition.id
      balance.timestamp = event.block.timestamp.toI64()
      balance.blockNumber = event.block.number
      balance.amount = event.params.value
      balance.equityInCollateral = equityInCollateralDelta
      balance.equityInDebt = equityInDebtDelta
      balance.save()
    }
  }

  leverageToken.save()
  leverageManager.save()
}

function calculateEquityForShares(shares: BigInt, totalEquity: BigInt, totalSupply: BigInt): BigInt {
  return shares.times(totalEquity).div(totalSupply);
}

function updatePnl(
  event: TransferEvent,
  position: Position,
  realizedEquityInCollateral: BigInt,
  equityReceivedInCollateral: BigInt,
  equityPaidInCollateral: BigInt
): void {
  const pnl = new ProfitAndLoss(0)
  pnl.position = position.id
  pnl.realized = realizedEquityInCollateral
  pnl.equityReceived = equityReceivedInCollateral
  pnl.equityPaid = equityPaidInCollateral
  pnl.timestamp = event.block.timestamp.toI64()
  pnl.blockNumber = event.block.number
  pnl.save()
}