import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts"
import { PriceSet as PriceSetEvent } from "../generated/RlpPriceStorage/RlpPriceStorage"
import { ChainlinkAggregator, MorphoChainlinkOracleData, Oracle, OraclePrice } from "../generated/schema"
import { MORPHO_CHAINLINK_ORACLE_V2_RLP_USDC_ADDRESS } from "./constants/addresses"
import { calculateMorphoChainlinkPrice } from "./utils"

export function handlePriceSet(event: PriceSetEvent): void {
    let rlpUsdcOracle = Oracle.load(Address.fromString(MORPHO_CHAINLINK_ORACLE_V2_RLP_USDC_ADDRESS))
    if (!rlpUsdcOracle) {
        return;
    }

    const morphoChainlinkOracleData = MorphoChainlinkOracleData.load(rlpUsdcOracle.morphoChainlinkOracleData as Bytes);
    if (!morphoChainlinkOracleData) {
        return;
    }

    const feed = ChainlinkAggregator.load(morphoChainlinkOracleData.baseAggregatorA)
    if (!feed) {
        return;
    }

    // Mimicking scaling down performed by the oracle's BASE_FEED_1 contract (RlpPriceAggregatorV3Interface)
    // https://etherscan.io/address/0xAdb2c15Fde49D1A4294740aCb650de94184E66b2#code
    feed.price = event.params.price.div(BigInt.fromI32(10).pow(10))
    feed.save();

    rlpUsdcOracle.price = calculateMorphoChainlinkPrice(morphoChainlinkOracleData)
    rlpUsdcOracle.save()

    const priceUpdate = new OraclePrice(0)
    priceUpdate.oracle = rlpUsdcOracle.id
    priceUpdate.price = rlpUsdcOracle.price
    priceUpdate.timestamp = event.block.timestamp.toI64()
    priceUpdate.save()
}