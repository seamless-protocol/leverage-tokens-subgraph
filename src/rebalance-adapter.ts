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
  CollateralRatiosRebalanceAdapterInitialized,
  DutchAuctionRebalanceAdapterInitialized,
  LeverageTokenSet,
  PreLiquidationRebalanceAdapterInitialized,
  RebalanceAdapterInitialized,
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
  let entity = new CollateralRatiosRebalanceAdapterInitialized(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.minCollateralRatio = event.params.minCollateralRatio
  entity.targetCollateralRatio = event.params.targetCollateralRatio
  entity.maxCollateralRatio = event.params.maxCollateralRatio

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleDutchAuctionRebalanceAdapterInitialized(
  event: DutchAuctionRebalanceAdapterInitializedEvent,
): void {
  let entity = new DutchAuctionRebalanceAdapterInitialized(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.auctionDuration = event.params.auctionDuration
  entity.initialPriceMultiplier = event.params.initialPriceMultiplier
  entity.minPriceMultiplier = event.params.minPriceMultiplier

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleLeverageTokenSet(event: LeverageTokenSetEvent): void {
  let entity = new LeverageTokenSet(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.leverageToken = event.params.leverageToken

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handlePreLiquidationRebalanceAdapterInitialized(
  event: PreLiquidationRebalanceAdapterInitializedEvent,
): void {
  let entity = new PreLiquidationRebalanceAdapterInitialized(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.collateralRatioThreshold = event.params.collateralRatioThreshold
  entity.rebalanceReward = event.params.rebalanceReward

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleRebalanceAdapterInitialized(
  event: RebalanceAdapterInitializedEvent,
): void {
  let entity = new RebalanceAdapterInitialized(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.authorizedCreator = event.params.authorizedCreator
  entity.leverageManager = event.params.leverageManager

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
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
