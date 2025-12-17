import {
    Address,
    BigInt,
    Bytes,
    ethereum,
    log,
} from "@graphprotocol/graph-ts";
import {
    ETHDistributed as ETHDistributedEvent,
} from "../generated/Lido/Lido";
import { ChainlinkAggregator, LeverageManager, MorphoChainlinkOracleData, Oracle, OraclePrice } from "../generated/schema";
import { LEVERAGE_MANAGER_ADDRESS, MORPHO_CHAINLINK_ORACLE_V2_WSTETH_STETH_ADDRESS } from "./constants/addresses";
import { WAD_STRING } from "./constants";
import { calculateMorphoChainlinkPrice, updateLeverageTokenStatesForOracle } from "./utils";

const TOKEN_REBASED_TOPIC = Bytes.fromHexString("0xff08c3ef606d198e316ef5b822193c489965899eb4e3c248cea1a4626c3eda50");

export function handleETHDistributed(event: ETHDistributedEvent): void {
    const receipt = event.receipt as ethereum.TransactionReceipt;

    let tokenRebasedEventValues: ethereum.Tuple = new ethereum.Tuple();

    for (let i = 0; i < receipt.logs.length; i++) {
        const name = receipt.logs[i].topics[0]
        if (name.equals(TOKEN_REBASED_TOPIC)) {
            tokenRebasedEventValues = ethereum.decode(
                '(uint256,uint256,uint256,uint256,uint256,uint256)',
                receipt.logs[i].data
            )!.toTuple()
        }
    }


    if (tokenRebasedEventValues.length == 0) {
        log.warning(
            "Event TokenRebased not found when ETHDistributed! block: {} txHash: {} logIdx: {} ",
            [
                event.block.number.toString(),
                event.transaction.hash.toHexString(),
                event.logIndex.toString(),
            ]
        );
        return;
    }

    const totalPooledEth = tokenRebasedEventValues[4].toBigInt();
    const totalShares = tokenRebasedEventValues[3].toBigInt();

    updateWstETHOraclePrice(totalPooledEth, totalShares, event.block);
}

function updateWstETHOraclePrice(totalPooledEth: BigInt, totalShares: BigInt, block: ethereum.Block): void {
    const wstETHOracle = Oracle.load(Address.fromString(MORPHO_CHAINLINK_ORACLE_V2_WSTETH_STETH_ADDRESS));
    if (!wstETHOracle) {
        return;
    }

    const morphoChainlinkOracleData = MorphoChainlinkOracleData.load(wstETHOracle.morphoChainlinkOracleData as Bytes);
    if (!morphoChainlinkOracleData) {
        return;
    }

    const feed = ChainlinkAggregator.load(morphoChainlinkOracleData.baseAggregatorA)
    if (!feed) {
        return;
    }

    feed.price = BigInt.fromString(WAD_STRING).times(totalPooledEth).div(totalShares)
    feed.save();

    wstETHOracle.price = calculateMorphoChainlinkPrice(morphoChainlinkOracleData)
    wstETHOracle.save()

    // Add price update as well for the oracle
    const priceUpdate = new OraclePrice(0)
    priceUpdate.oracle = wstETHOracle.id
    priceUpdate.price = wstETHOracle.price
    priceUpdate.timestamp = block.timestamp.toI64()
    priceUpdate.blockNumber = block.number
    priceUpdate.save()

    // Update state history for all LeverageTokens that use this oracle
    const leverageManager = LeverageManager.load(Address.fromHexString(LEVERAGE_MANAGER_ADDRESS))
    if (!leverageManager) {
        return
    }

    const lendingAdapters = wstETHOracle.lendingAdapters.load()
    updateLeverageTokenStatesForOracle(leverageManager, lendingAdapters, wstETHOracle, block)
}