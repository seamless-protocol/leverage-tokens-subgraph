import { newMockEvent } from "matchstick-as"
import { ethereum, BigInt, Address } from "@graphprotocol/graph-ts"
import {
  AuctionCreated,
  AuctionEnded,
  CollateralRatiosRebalanceAdapterInitialized,
  DutchAuctionRebalanceAdapterInitialized,
  LeverageTokenSet,
  PreLiquidationRebalanceAdapterInitialized,
  RebalanceAdapterInitialized,
  Take
} from "../generated/RebalanceAdapter/RebalanceAdapter"

export function createAuctionCreatedEvent(
  auction: ethereum.Tuple
): AuctionCreated {
  let auctionCreatedEvent = changetype<AuctionCreated>(newMockEvent())

  auctionCreatedEvent.parameters = new Array()

  auctionCreatedEvent.parameters.push(
    new ethereum.EventParam("auction", ethereum.Value.fromTuple(auction))
  )

  return auctionCreatedEvent
}

export function createAuctionEndedEvent(): AuctionEnded {
  let auctionEndedEvent = changetype<AuctionEnded>(newMockEvent())

  auctionEndedEvent.parameters = new Array()

  return auctionEndedEvent
}

export function createCollateralRatiosRebalanceAdapterInitializedEvent(
  minCollateralRatio: BigInt,
  targetCollateralRatio: BigInt,
  maxCollateralRatio: BigInt
): CollateralRatiosRebalanceAdapterInitialized {
  let collateralRatiosRebalanceAdapterInitializedEvent =
    changetype<CollateralRatiosRebalanceAdapterInitialized>(newMockEvent())

  collateralRatiosRebalanceAdapterInitializedEvent.parameters = new Array()

  collateralRatiosRebalanceAdapterInitializedEvent.parameters.push(
    new ethereum.EventParam(
      "minCollateralRatio",
      ethereum.Value.fromUnsignedBigInt(minCollateralRatio)
    )
  )
  collateralRatiosRebalanceAdapterInitializedEvent.parameters.push(
    new ethereum.EventParam(
      "targetCollateralRatio",
      ethereum.Value.fromUnsignedBigInt(targetCollateralRatio)
    )
  )
  collateralRatiosRebalanceAdapterInitializedEvent.parameters.push(
    new ethereum.EventParam(
      "maxCollateralRatio",
      ethereum.Value.fromUnsignedBigInt(maxCollateralRatio)
    )
  )

  return collateralRatiosRebalanceAdapterInitializedEvent
}

export function createDutchAuctionRebalanceAdapterInitializedEvent(
  auctionDuration: BigInt,
  initialPriceMultiplier: BigInt,
  minPriceMultiplier: BigInt
): DutchAuctionRebalanceAdapterInitialized {
  let dutchAuctionRebalanceAdapterInitializedEvent =
    changetype<DutchAuctionRebalanceAdapterInitialized>(newMockEvent())

  dutchAuctionRebalanceAdapterInitializedEvent.parameters = new Array()

  dutchAuctionRebalanceAdapterInitializedEvent.parameters.push(
    new ethereum.EventParam(
      "auctionDuration",
      ethereum.Value.fromUnsignedBigInt(auctionDuration)
    )
  )
  dutchAuctionRebalanceAdapterInitializedEvent.parameters.push(
    new ethereum.EventParam(
      "initialPriceMultiplier",
      ethereum.Value.fromUnsignedBigInt(initialPriceMultiplier)
    )
  )
  dutchAuctionRebalanceAdapterInitializedEvent.parameters.push(
    new ethereum.EventParam(
      "minPriceMultiplier",
      ethereum.Value.fromUnsignedBigInt(minPriceMultiplier)
    )
  )

  return dutchAuctionRebalanceAdapterInitializedEvent
}

export function createLeverageTokenSetEvent(
  leverageToken: Address
): LeverageTokenSet {
  let leverageTokenSetEvent = changetype<LeverageTokenSet>(newMockEvent())

  leverageTokenSetEvent.parameters = new Array()

  leverageTokenSetEvent.parameters.push(
    new ethereum.EventParam(
      "leverageToken",
      ethereum.Value.fromAddress(leverageToken)
    )
  )

  return leverageTokenSetEvent
}

export function createPreLiquidationRebalanceAdapterInitializedEvent(
  collateralRatioThreshold: BigInt,
  rebalanceReward: BigInt
): PreLiquidationRebalanceAdapterInitialized {
  let preLiquidationRebalanceAdapterInitializedEvent =
    changetype<PreLiquidationRebalanceAdapterInitialized>(newMockEvent())

  preLiquidationRebalanceAdapterInitializedEvent.parameters = new Array()

  preLiquidationRebalanceAdapterInitializedEvent.parameters.push(
    new ethereum.EventParam(
      "collateralRatioThreshold",
      ethereum.Value.fromUnsignedBigInt(collateralRatioThreshold)
    )
  )
  preLiquidationRebalanceAdapterInitializedEvent.parameters.push(
    new ethereum.EventParam(
      "rebalanceReward",
      ethereum.Value.fromUnsignedBigInt(rebalanceReward)
    )
  )

  return preLiquidationRebalanceAdapterInitializedEvent
}

export function createRebalanceAdapterInitializedEvent(
  authorizedCreator: Address,
  leverageManager: Address
): RebalanceAdapterInitialized {
  let rebalanceAdapterInitializedEvent =
    changetype<RebalanceAdapterInitialized>(newMockEvent())

  rebalanceAdapterInitializedEvent.parameters = new Array()

  rebalanceAdapterInitializedEvent.parameters.push(
    new ethereum.EventParam(
      "authorizedCreator",
      ethereum.Value.fromAddress(authorizedCreator)
    )
  )
  rebalanceAdapterInitializedEvent.parameters.push(
    new ethereum.EventParam(
      "leverageManager",
      ethereum.Value.fromAddress(leverageManager)
    )
  )

  return rebalanceAdapterInitializedEvent
}

export function createTakeEvent(
  taker: Address,
  amountIn: BigInt,
  amountOut: BigInt
): Take {
  let takeEvent = changetype<Take>(newMockEvent())

  takeEvent.parameters = new Array()

  takeEvent.parameters.push(
    new ethereum.EventParam("taker", ethereum.Value.fromAddress(taker))
  )
  takeEvent.parameters.push(
    new ethereum.EventParam(
      "amountIn",
      ethereum.Value.fromUnsignedBigInt(amountIn)
    )
  )
  takeEvent.parameters.push(
    new ethereum.EventParam(
      "amountOut",
      ethereum.Value.fromUnsignedBigInt(amountOut)
    )
  )

  return takeEvent
}
