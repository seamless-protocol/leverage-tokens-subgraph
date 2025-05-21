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
  AccrueInterest,
  Borrow,
  CreateMarket,
  EnableIrm,
  EnableLltv,
  FlashLoan,
  IncrementNonce,
  Liquidate,
  Repay,
  SetAuthorization,
  SetFee,
  SetFeeRecipient,
  SetOwner,
  Supply,
  SupplyCollateral,
  Withdraw,
  WithdrawCollateral,
} from "../generated/schema"

export function handleAccrueInterest(event: AccrueInterestEvent): void {
  let entity = new AccrueInterest(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.internal_id = event.params.id
  entity.prevBorrowRate = event.params.prevBorrowRate
  entity.interest = event.params.interest
  entity.feeShares = event.params.feeShares

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleBorrow(event: BorrowEvent): void {
  let entity = new Borrow(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.internal_id = event.params.id
  entity.caller = event.params.caller
  entity.onBehalf = event.params.onBehalf
  entity.receiver = event.params.receiver
  entity.assets = event.params.assets
  entity.shares = event.params.shares

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleCreateMarket(event: CreateMarketEvent): void {
  let entity = new CreateMarket(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.internal_id = event.params.id
  entity.marketParams_loanToken = event.params.marketParams.loanToken
  entity.marketParams_collateralToken =
    event.params.marketParams.collateralToken
  entity.marketParams_oracle = event.params.marketParams.oracle
  entity.marketParams_irm = event.params.marketParams.irm
  entity.marketParams_lltv = event.params.marketParams.lltv

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleEnableIrm(event: EnableIrmEvent): void {
  let entity = new EnableIrm(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.irm = event.params.irm

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleEnableLltv(event: EnableLltvEvent): void {
  let entity = new EnableLltv(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.lltv = event.params.lltv

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleFlashLoan(event: FlashLoanEvent): void {
  let entity = new FlashLoan(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.caller = event.params.caller
  entity.token = event.params.token
  entity.assets = event.params.assets

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleIncrementNonce(event: IncrementNonceEvent): void {
  let entity = new IncrementNonce(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.caller = event.params.caller
  entity.authorizer = event.params.authorizer
  entity.usedNonce = event.params.usedNonce

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
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
  let entity = new Repay(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.internal_id = event.params.id
  entity.caller = event.params.caller
  entity.onBehalf = event.params.onBehalf
  entity.assets = event.params.assets
  entity.shares = event.params.shares

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleSetAuthorization(event: SetAuthorizationEvent): void {
  let entity = new SetAuthorization(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.caller = event.params.caller
  entity.authorizer = event.params.authorizer
  entity.authorized = event.params.authorized
  entity.newIsAuthorized = event.params.newIsAuthorized

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleSetFee(event: SetFeeEvent): void {
  let entity = new SetFee(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.internal_id = event.params.id
  entity.newFee = event.params.newFee

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleSetFeeRecipient(event: SetFeeRecipientEvent): void {
  let entity = new SetFeeRecipient(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.newFeeRecipient = event.params.newFeeRecipient

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleSetOwner(event: SetOwnerEvent): void {
  let entity = new SetOwner(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.newOwner = event.params.newOwner

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleSupply(event: SupplyEvent): void {
  let entity = new Supply(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.internal_id = event.params.id
  entity.caller = event.params.caller
  entity.onBehalf = event.params.onBehalf
  entity.assets = event.params.assets
  entity.shares = event.params.shares

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleSupplyCollateral(event: SupplyCollateralEvent): void {
  let entity = new SupplyCollateral(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.internal_id = event.params.id
  entity.caller = event.params.caller
  entity.onBehalf = event.params.onBehalf
  entity.assets = event.params.assets

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleWithdraw(event: WithdrawEvent): void {
  let entity = new Withdraw(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.internal_id = event.params.id
  entity.caller = event.params.caller
  entity.onBehalf = event.params.onBehalf
  entity.receiver = event.params.receiver
  entity.assets = event.params.assets
  entity.shares = event.params.shares

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleWithdrawCollateral(event: WithdrawCollateralEvent): void {
  let entity = new WithdrawCollateral(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.internal_id = event.params.id
  entity.caller = event.params.caller
  entity.onBehalf = event.params.onBehalf
  entity.receiver = event.params.receiver
  entity.assets = event.params.assets

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}
