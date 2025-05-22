import {
  AccrueInterest as AccrueInterestEvent,
  Borrow as BorrowEvent,
  CreateMarket as CreateMarketEvent,
  EnableIrm as EnableIrmEvent,
  EnableLltv as EnableLltvEvent,
  FlashLoan as FlashLoanEvent,
  IncrementNonce as IncrementNonceEvent,
  Liquidate as LiquidateEvent,
  Repay as RepayEvent,
  SetAuthorization as SetAuthorizationEvent,
  SetFee as SetFeeEvent,
  SetFeeRecipient as SetFeeRecipientEvent,
  SetOwner as SetOwnerEvent,
  Supply as SupplyEvent,
  SupplyCollateral as SupplyCollateralEvent,
  Withdraw as WithdrawEvent,
  WithdrawCollateral as WithdrawCollateralEvent,
} from "../generated/MorphoBlue/MorphoBlue"
import {
  Liquidate
} from "../generated/schema"

export function handleAccrueInterest(event: AccrueInterestEvent): void {
}

export function handleBorrow(event: BorrowEvent): void {
}

export function handleCreateMarket(event: CreateMarketEvent): void {
}

export function handleEnableIrm(event: EnableIrmEvent): void {
}

export function handleEnableLltv(event: EnableLltvEvent): void {
}

export function handleFlashLoan(event: FlashLoanEvent): void {
}

export function handleIncrementNonce(event: IncrementNonceEvent): void {
}

export function handleLiquidate(event: LiquidateEvent): void {
  let entity = new Liquidate(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.internal_id = event.params.id
  entity.caller = event.params.caller
  entity.borrower = event.params.borrower
  entity.repaidAssets = event.params.repaidAssets
  entity.repaidShares = event.params.repaidShares
  entity.seizedAssets = event.params.seizedAssets
  entity.badDebtAssets = event.params.badDebtAssets
  entity.badDebtShares = event.params.badDebtShares

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleRepay(event: RepayEvent): void {
}

export function handleSetAuthorization(event: SetAuthorizationEvent): void {
}

export function handleSetFee(event: SetFeeEvent): void {
}

export function handleSetFeeRecipient(event: SetFeeRecipientEvent): void {
}

export function handleSetOwner(event: SetOwnerEvent): void {
}

export function handleSupply(event: SupplyEvent): void {
}

export function handleSupplyCollateral(event: SupplyCollateralEvent): void {
}

export function handleWithdraw(event: WithdrawEvent): void {
}

export function handleWithdrawCollateral(event: WithdrawCollateralEvent): void {
}
