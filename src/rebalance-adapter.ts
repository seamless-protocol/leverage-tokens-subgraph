import {
  AuctionCreated as AuctionCreatedEvent,
  AuctionEnded as AuctionEndedEvent,
  CollateralRatiosRebalanceAdapterInitialized as CollateralRatiosRebalanceAdapterInitializedEvent,
  DutchAuctionRebalanceAdapterInitialized as DutchAuctionRebalanceAdapterInitializedEvent,
  LeverageTokenSet as LeverageTokenSetEvent,
  PreLiquidationRebalanceAdapterInitialized as PreLiquidationRebalanceAdapterInitializedEvent,
  RebalanceAdapterInitialized as RebalanceAdapterInitializedEvent,
  Take as TakeEvent,
} from "../generated/RebalanceAdapter/RebalanceAdapter"
import {
  AuctionCreated,
  AuctionEnded,
  Take,
} from "../generated/schema"

export function handleAuctionCreated(event: AuctionCreatedEvent): void {
  let entity = new AuctionCreated(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.auction_isOverCollateralized =
    event.params.auction.isOverCollateralized
  entity.auction_startTimestamp = event.params.auction.startTimestamp
  entity.auction_endTimestamp = event.params.auction.endTimestamp

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleAuctionEnded(event: AuctionEndedEvent): void {
  let entity = new AuctionEnded(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleCollateralRatiosRebalanceAdapterInitialized(
  event: CollateralRatiosRebalanceAdapterInitializedEvent,
): void {
}

export function handleDutchAuctionRebalanceAdapterInitialized(
  event: DutchAuctionRebalanceAdapterInitializedEvent,
): void {
}

export function handleLeverageTokenSet(event: LeverageTokenSetEvent): void {
}

export function handlePreLiquidationRebalanceAdapterInitialized(
  event: PreLiquidationRebalanceAdapterInitializedEvent,
): void {
}

export function handleRebalanceAdapterInitialized(
  event: RebalanceAdapterInitializedEvent,
): void {
}

export function handleTake(event: TakeEvent): void {
  let entity = new Take(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.taker = event.params.taker
  entity.amountIn = event.params.amountIn
  entity.amountOut = event.params.amountOut

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}
