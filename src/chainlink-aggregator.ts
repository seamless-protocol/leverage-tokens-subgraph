import { ChainlinkAggregator, ChainlinkAggregatorPrice } from "../generated/schema"
import { AnswerUpdated as AnswerUpdatedEvent } from "../generated/templates/ChainlinkAggregator/ChainlinkAggregator";

export function handleAnswerUpdated(event: AnswerUpdatedEvent): void {
  const chainlinkAggregator = ChainlinkAggregator.load(event.address)
  if (!chainlinkAggregator) {
    return
  }

  chainlinkAggregator.price = event.params.current
  chainlinkAggregator.save()

  const priceUpdate = new ChainlinkAggregatorPrice(0)
  priceUpdate.chainlinkAggregator = chainlinkAggregator.id
  priceUpdate.price = event.params.current
  priceUpdate.roundId = event.params.roundId
  priceUpdate.timestamp = event.block.timestamp.toI64()
  priceUpdate.save()
}