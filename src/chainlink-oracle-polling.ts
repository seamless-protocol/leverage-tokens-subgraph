import { Address, ethereum } from "@graphprotocol/graph-ts";
import { CHAINLINK_ORACLE_POLLING_ADDRESSES } from "./constants/addresses";
import { Oracle, OraclePrice } from "../generated/schema";
import { MorphoChainlinkOracleV2 as MorphoChainlinkOracleV2Contract } from "../generated/ChainlinkOraclePolling/MorphoChainlinkOracleV2"

export function handleBlock(block: ethereum.Block): void {
    for (let i = 0; i < CHAINLINK_ORACLE_POLLING_ADDRESSES.length; i++) {
        const oracleAddress = CHAINLINK_ORACLE_POLLING_ADDRESSES[i]
        let oracle = Oracle.load(Address.fromString(oracleAddress))
        if (!oracle) {
            // Uncomment this to create new oracle entities for testing without having to deploy a LeverageToken
            // oracle = new Oracle(Address.fromString(oracleAddress))
            // oracle.leverageManager = Address.fromString(LEVERAGE_MANAGER_ADDRESS)
            // oracle.type = OracleType.MORPHO_CHAINLINK
            // oracle.decimals = 6; // Dummy decimals value

            return;
        }

        const oracleContract = MorphoChainlinkOracleV2Contract.bind(Address.fromString(oracleAddress))
        const price = oracleContract.price()
        oracle.price = price
        oracle.save()

        const priceUpdate = new OraclePrice(0)
        priceUpdate.oracle = oracle.id
        priceUpdate.price = oracle.price
        priceUpdate.timestamp = block.timestamp.toI64()
        priceUpdate.save()
    }
}