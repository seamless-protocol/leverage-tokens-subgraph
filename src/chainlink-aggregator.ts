import { Address, Bytes } from "@graphprotocol/graph-ts";
import { ChainlinkAggregator, LeverageManager, MorphoChainlinkOracleData, OraclePrice } from "../generated/schema"
import { LEVERAGE_MANAGER_ADDRESS } from "./constants/addresses";
import { AnswerUpdated as AnswerUpdatedEvent } from "../generated/templates/ChainlinkAggregator/ChainlinkAggregator";
import { OracleType } from "./constants";
import { calculateMorphoChainlinkPrice, updateLeverageTokenStatesForOracle } from "./utils";

export function handleAnswerUpdated(event: AnswerUpdatedEvent): void {
  const chainlinkAggregator = ChainlinkAggregator.load(event.address)
  if (!chainlinkAggregator) {
    return
  }

  const leverageManager = LeverageManager.load(Address.fromHexString(LEVERAGE_MANAGER_ADDRESS))
  if (!leverageManager) {
    return
  }

  chainlinkAggregator.price = event.params.current
  chainlinkAggregator.save()

  // Update prices on oracles using this ChainlinkAggregator
  const oracles = leverageManager._oracles.load()
  for (let i = 0; i < oracles.length; i++) {
    const oracle = oracles[i]

    // We need to use == here instead of ===, as === stricly compares the references, not the actual values
    if (oracle.type == OracleType.MORPHO_CHAINLINK) {
        const morphoChainlinkOracleDataId = oracle.morphoChainlinkOracleData
        if (morphoChainlinkOracleDataId === null) {
            return
        }

        const morphoChainlinkOracleData = MorphoChainlinkOracleData.load(morphoChainlinkOracleDataId)
        if (morphoChainlinkOracleData === null) {
            return
        }

        if (
            morphoChainlinkOracleData.baseAggregatorA.equals(chainlinkAggregator.id) ||
            (morphoChainlinkOracleData.baseAggregatorB !== null && (morphoChainlinkOracleData.baseAggregatorB as Bytes).equals(chainlinkAggregator.id)) ||
            (morphoChainlinkOracleData.quoteAggregatorA !== null && (morphoChainlinkOracleData.quoteAggregatorA as Bytes).equals(chainlinkAggregator.id)) ||
            (morphoChainlinkOracleData.quoteAggregatorB !== null && (morphoChainlinkOracleData.quoteAggregatorB as Bytes).equals(chainlinkAggregator.id))
        ) {
            const newOraclePrice = calculateMorphoChainlinkPrice(morphoChainlinkOracleData)

            oracle.price = newOraclePrice
            oracle.save()

            const priceUpdate = new OraclePrice(0)
            priceUpdate.oracle = oracle.id
            priceUpdate.price = newOraclePrice
            priceUpdate.timestamp = event.block.timestamp.toI64()
            priceUpdate.blockNumber = event.block.number
            priceUpdate.save()

            // Update state history for all LeverageTokens that use this oracle
            const lendingAdapters = oracle.lendingAdapters.load()
            updateLeverageTokenStatesForOracle(leverageManager, lendingAdapters, oracle, event.block)
        }
    }
  }
}