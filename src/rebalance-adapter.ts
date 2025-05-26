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

export function handleAuctionCreated(event: AuctionCreatedEvent): void {
}

export function handleAuctionEnded(event: AuctionEndedEvent): void {
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
}
