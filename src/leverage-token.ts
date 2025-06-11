import { Address, BigInt } from "@graphprotocol/graph-ts"
import { LendingAdapter, LeverageManager, LeverageToken, LeverageTokenBalanceChange, Oracle, ProfitAndLoss, User } from "../generated/schema"
import {
  Transfer as TransferEvent,
} from "../generated/templates/LeverageToken/LeverageToken"
import { getPositionStub } from "./stubs"
import { convertToEquity, getPosition } from "./utils"
import { LeverageManager as LeverageManagerContract } from "../generated/LeverageManager/LeverageManager"
import { convertDebtToCollateral } from "./utils"
import { LeverageTokenBalanceChangeType } from "./constants"
import { LEVERAGE_MANAGER_ADDRESS, LEVERAGE_ROUTER_ADDRESS } from "./constants/addresses"

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
  const isLeverageRouterMint = event.params.from == Address.fromString(LEVERAGE_ROUTER_ADDRESS) && event.params.to != Address.fromString(LEVERAGE_MANAGER_ADDRESS)
  const isLeverageRouterRedeem = event.params.to == Address.fromString(LEVERAGE_ROUTER_ADDRESS) && event.params.from != Address.fromString(LEVERAGE_MANAGER_ADDRESS)
  const isTransfer = !isBurn && !isMint

  let equityInCollateralDelta = BigInt.zero()
  let equityInDebtDelta = BigInt.zero()

  const shares = event.params.value

  if (isMint) {
    leverageToken.totalSupply = leverageToken.totalSupply.plus(shares)
  } else if (isBurn) {
    leverageToken.totalSupply = leverageToken.totalSupply.minus(shares)
  } else {
    equityInCollateralDelta = convertToEquity(
      shares,
      equityInCollateral,
      leverageToken.totalSupply
    )
    equityInDebtDelta = convertToEquity(
      shares,
      equityInDebt,
      leverageToken.totalSupply,
    )
  }

  if (isTransfer) {
    const fromPosition = getPosition(event.params.from, Address.fromBytes(leverageToken.id))
    if (!fromPosition) {
      return
    }

    const equityDepositedForSharesInCollateral = convertToEquity(shares, fromPosition.totalEquityDepositedInCollateral, fromPosition.balance)
    const equityDepositedForSharesInDebt = convertToEquity(shares, fromPosition.totalEquityDepositedInDebt, fromPosition.balance)

    if (!isLeverageRouterMint && !isLeverageRouterRedeem) {
      // Realized pnl is calculated when LTs are transferred out from an account. The realized pnl loss is equal to the
      // amount the user deposited for the shares transferred out, based on the average amount they deposited for their
      // total balance of shares
      const realizedPnlInCollateral = equityDepositedForSharesInCollateral.neg()
      const realizedPnlInDebt = equityDepositedForSharesInDebt.neg()
      const pnl = new ProfitAndLoss(0)
      pnl.position = fromPosition.id
      pnl.realizedInCollateral = realizedPnlInCollateral
      pnl.realizedInDebt = realizedPnlInDebt
      pnl.equityReceivedInCollateral = BigInt.zero()
      pnl.equityReceivedInDebt = BigInt.zero()
      pnl.equityDepositedInCollateral = equityDepositedForSharesInCollateral
      pnl.equityDepositedInDebt = equityDepositedForSharesInDebt
      pnl.timestamp = event.block.timestamp.toI64()
      pnl.blockNumber = event.block.number
      pnl.save()

      // Realized pnl is negative so this decreases
      fromPosition.realizedPnlInCollateral = fromPosition.realizedPnlInCollateral.plus(realizedPnlInCollateral)
      fromPosition.realizedPnlInDebt = fromPosition.realizedPnlInDebt.plus(realizedPnlInDebt)
      // The total equity deposited by the user is decreased by the equity deposited for the shares transferred
      // This is because the shares are transferred out, and the pnl for them is now realized
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
      toBalanceChange.type = LeverageTokenBalanceChangeType.TRANSFER
      toBalanceChange.save()
    } else if (isLeverageRouterMint) {
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

      toPosition.balance = toPosition.balance.plus(shares);
      toPosition.totalEquityDepositedInCollateral = toPosition.totalEquityDepositedInCollateral.plus(equityInCollateralDelta)
      toPosition.totalEquityDepositedInDebt = toPosition.totalEquityDepositedInDebt.plus(equityInDebtDelta)
      toPosition.save()

      const balanceChange = new LeverageTokenBalanceChange(0)
      balanceChange.position = toPosition.id
      balanceChange.leverageToken = leverageToken.id
      balanceChange.timestamp = event.block.timestamp.toI64()
      balanceChange.blockNumber = event.block.number
      balanceChange.amount = toPosition.balance
      balanceChange.amountDelta = shares
      balanceChange.equityInCollateral = equityInCollateralDelta
      balanceChange.equityInDebt = equityInDebtDelta
      balanceChange.type = LeverageTokenBalanceChangeType.MINT
      balanceChange.save()
    } else if (isLeverageRouterRedeem) {
      let fromUser = User.load(event.params.from)
      if (!fromUser) {
        return
      }

      let fromPosition = getPosition(event.params.from, Address.fromBytes(leverageToken.id))
      if (!fromPosition) {
        return
      }

      const pnl = new ProfitAndLoss(0)
      pnl.position = fromPosition.id
      pnl.realizedInCollateral = equityInCollateralDelta.minus(equityDepositedForSharesInCollateral)
      pnl.realizedInDebt = equityInDebtDelta.minus(equityDepositedForSharesInDebt)
      pnl.equityReceivedInCollateral = equityInCollateralDelta
      pnl.equityReceivedInDebt = equityInDebtDelta
      pnl.equityDepositedInCollateral = equityDepositedForSharesInCollateral
      pnl.equityDepositedInDebt = equityDepositedForSharesInDebt
      pnl.timestamp = event.block.timestamp.toI64()
      pnl.blockNumber = event.block.number
      pnl.save()

      fromPosition.totalEquityDepositedInCollateral = fromPosition.totalEquityDepositedInCollateral.minus(equityDepositedForSharesInCollateral)
      fromPosition.totalEquityDepositedInDebt = fromPosition.totalEquityDepositedInDebt.minus(equityDepositedForSharesInDebt)
      fromPosition.realizedPnlInCollateral = fromPosition.realizedPnlInCollateral.plus(pnl.realizedInCollateral)
      fromPosition.realizedPnlInDebt = fromPosition.realizedPnlInDebt.plus(pnl.realizedInDebt)
      fromPosition.balance = fromPosition.balance.minus(shares)
      fromPosition.save()

      if (fromPosition.balance.minus(shares).isZero()) {
        leverageToken.totalHolders = leverageToken.totalHolders.minus(BigInt.fromI32(1))
        leverageManager.totalHolders = leverageManager.totalHolders.minus(BigInt.fromI32(1))
      }

      const balanceChange = new LeverageTokenBalanceChange(0)
      balanceChange.position = fromPosition.id
      balanceChange.leverageToken = leverageToken.id
      balanceChange.timestamp = event.block.timestamp.toI64()
      balanceChange.blockNumber = event.block.number
      balanceChange.amount = fromPosition.balance
      balanceChange.amountDelta = shares.neg()
      balanceChange.equityInCollateral = equityInCollateralDelta.neg()
      balanceChange.equityInDebt = equityInDebtDelta.neg()
      balanceChange.type = LeverageTokenBalanceChangeType.REDEEM
      balanceChange.save()
    }
  }

  leverageToken.save()
  leverageManager.save()
}