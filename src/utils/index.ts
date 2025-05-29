import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts";
import { ChainlinkAggregator, MorphoChainlinkOracleData, Oracle, Position } from "../../generated/schema";
import { MORPHO_ORACLE_PRICE_SCALE_STRING } from "../constants";

export function getPosition(
    user: Address,
    leverageToken: Address
): Position | null {
    const positionId = user
        .toHexString()
        .concat("-")
        .concat(leverageToken.toHexString());

    return Position.load(positionId);
}

/**
 * Mimics the logic of the MorphoChainlinkOracleV2.price() function
 * e.g. https://basescan.deth.net/address/0xFEa2D58cEfCb9fcb597723c6bAE66fFE4193aFE4
 */
export function calculateMorphoChainlinkPrice(
    morphoChainlinkOracleData: MorphoChainlinkOracleData
): BigInt {
    // TODO: If the vault is not the zero address, we need to fetch the asset amount from the vault
    const baseVaultAssets = BigInt.fromI32(1)
    const quoteVaultAssets = BigInt.fromI32(1)

    const baseAggregatorA = ChainlinkAggregator.load(morphoChainlinkOracleData.baseAggregatorA)

    const baseAggregatorB = morphoChainlinkOracleData.baseAggregatorB ? ChainlinkAggregator.load(morphoChainlinkOracleData.baseAggregatorB as Bytes) : null
    const quoteAggregatorA = morphoChainlinkOracleData.quoteAggregatorA ? ChainlinkAggregator.load(morphoChainlinkOracleData.quoteAggregatorA as Bytes) : null
    const quoteAggregatorB = morphoChainlinkOracleData.quoteAggregatorB ? ChainlinkAggregator.load(morphoChainlinkOracleData.quoteAggregatorB as Bytes) : null

    const basePriceA = baseAggregatorA ? baseAggregatorA.price : BigInt.fromI32(0)
    const basePriceB = baseAggregatorB ? baseAggregatorB.price : BigInt.fromI32(1)
    const quotePriceA = quoteAggregatorA ? quoteAggregatorA.price : BigInt.fromI32(1)
    const quotePriceB = quoteAggregatorB ? quoteAggregatorB.price : BigInt.fromI32(1)

    const numerator = morphoChainlinkOracleData.scaleFactor.times(baseVaultAssets).times(basePriceA).times(basePriceB)
    const denominator = quoteVaultAssets.times(quotePriceA).times(quotePriceB)

    return numerator.div(denominator)
}

export function convertCollateralToDebt(
    oracle: Oracle,
    collateral: BigInt
): BigInt {
    const morphoChainlinkOracleData = oracle.morphoChainlinkOracleData.load()

    // TODO: Handle other oracle types
    if (morphoChainlinkOracleData.length == 1) {
        const price = calculateMorphoChainlinkPrice(morphoChainlinkOracleData[0])
        return collateral.times(price).div(BigInt.fromString(MORPHO_ORACLE_PRICE_SCALE_STRING))
    }

    return BigInt.zero()
}

export function convertDebtToCollateral(
    oracle: Oracle,
    debt: BigInt
): BigInt {
    const morphoChainlinkOracleData = oracle.morphoChainlinkOracleData.load()

    // TODO: Handle other oracle types
    if (morphoChainlinkOracleData.length == 1) {
        const price = calculateMorphoChainlinkPrice(morphoChainlinkOracleData[0])

        const numerator = debt.times(BigInt.fromString(MORPHO_ORACLE_PRICE_SCALE_STRING));
        const remainder = numerator.mod(price);
        const quotient = numerator.div(price);
        return remainder.isZero() ? quotient : quotient.plus(BigInt.fromI32(1)); // Rounding up
    }

    return BigInt.zero()
}