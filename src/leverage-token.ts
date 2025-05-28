import { Address, BigInt } from "@graphprotocol/graph-ts"
import { Balance, LeverageManager, LeverageToken, Position, ProfitAndLoss, User } from "../generated/schema"
import {
  Transfer as TransferEvent,
} from "../generated/templates/LeverageToken/LeverageToken"
import { getPositionStub } from "./stubs"
import { getPosition } from "./utils"

export function handleTransfer(event: TransferEvent): void {
  const leverageToken = LeverageToken.load(event.address)
  if (!leverageToken) {
    return
  }

  const leverageManager = LeverageManager.load(leverageToken.leverageManager)
  if (!leverageManager) {
    return
  }

  const equityInCollateralDelta = leverageToken.totalSupply.gt(BigInt.zero()) ? calculateEquityForShares(event.params.value, leverageToken.totalEquityInCollateral, leverageToken.totalSupply) : BigInt.zero()
  const equityInDebtDelta = leverageToken.totalSupply.gt(BigInt.zero()) ? calculateEquityForShares(event.params.value, leverageToken.totalEquityInDebt, leverageToken.totalSupply) : BigInt.zero()

  if (event.params.from.equals(Address.zero())) {
    leverageToken.totalSupply = leverageToken.totalSupply.plus(event.params.value)
  } else if (event.params.to.equals(Address.zero())) {
    leverageToken.totalSupply = leverageToken.totalSupply.minus(event.params.value)
  }

  if (event.params.from.notEqual(Address.zero())) {
    const fromPosition = getPosition(event.params.from, Address.fromBytes(leverageToken.id))
    if (!fromPosition) {
      return
    }

    const equityPaidForSharesInCollateral = event.params.value.times(fromPosition.equityPaidInCollateral).div(fromPosition.balance)
    const realizedEquityInCollateral = equityInCollateralDelta.minus(equityPaidForSharesInCollateral)
    const pnl = new ProfitAndLoss(0)
    pnl.position = fromPosition.id
    pnl.realized = realizedEquityInCollateral
    pnl.timestamp = event.block.timestamp.toI64()
    pnl.blockNumber = event.block.number
    pnl.save()

    updatePositionEquityAndBalance(event, fromPosition, equityPaidForSharesInCollateral, equityInDebtDelta, realizedEquityInCollateral, event.params.value, false)

    if (fromPosition.balance.isZero()) {
      leverageToken.totalHolders = leverageToken.totalHolders.minus(BigInt.fromI32(1))
      leverageManager.totalHolders = leverageManager.totalHolders.minus(BigInt.fromI32(1))
    }
  }

  if (event.params.to.notEqual(Address.zero())) {
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

    updatePositionEquityAndBalance(event, toPosition, equityInCollateralDelta, equityInDebtDelta, BigInt.zero(), event.params.value, true)
  }

  leverageToken.save()
  leverageManager.save()
}

function calculateEquityForShares(shares: BigInt, totalEquity: BigInt, totalSupply: BigInt): BigInt {
  return shares.times(totalEquity).div(totalSupply);
}

function isTransfer(event: TransferEvent): boolean {
  return event.params.from.notEqual(Address.zero()) && event.params.to.notEqual(Address.zero());
}

function updatePositionEquityAndBalance(event: TransferEvent, position: Position, equityInCollateralDelta: BigInt, equityInDebtDelta: BigInt, realizedEquityInCollateral: BigInt, balanceDelta: BigInt, isIncrease: boolean): void {
  if (isTransfer(event)) {
    if (isIncrease) {
      position.equityPaidInCollateral = position.equityPaidInCollateral.plus(equityInCollateralDelta);
      position.equityPaidInDebt = position.equityPaidInDebt.plus(equityInDebtDelta);
      position.balance = position.balance.plus(balanceDelta);
    } else {
      position.equityPaidInCollateral = position.equityPaidInCollateral.minus(equityInCollateralDelta);
      position.equityPaidInDebt = position.equityPaidInDebt.minus(equityInDebtDelta);
      position.balance = position.balance.minus(balanceDelta);
    }

    const balance = new Balance(0)
    balance.position = position.id
    balance.timestamp = event.block.timestamp.toI64()
    balance.blockNumber = event.block.number
    balance.amount = isIncrease ? balanceDelta : balanceDelta.neg()
    balance.equityInCollateral = isIncrease ? equityInCollateralDelta : equityInCollateralDelta.neg()
    balance.equityInDebt = isIncrease ? equityInDebtDelta : equityInDebtDelta.neg()
    balance.save()
  }

  position.totalPnl = position.totalPnl.plus(realizedEquityInCollateral)
  position.save();
}