import { Address, ethereum } from "@graphprotocol/graph-ts"
import { Deposit as DepositEvent, Withdraw as WithdrawEvent, VaultProfit as VaultProfitEvent, VaultLoss as VaultLossEvent } from "../generated/siUSD/siUSD"
import { Oracle, OraclePrice } from "../generated/schema"
import { MorphoChainlinkOracleV2 as MorphoChainlinkOracleV2Contract } from "../generated/siUSD/MorphoChainlinkOracleV2"
import { LEVERAGE_MANAGER_ADDRESS, MORPHO_CHAINLINK_ORACLE_V2_SIUSD_USDC_ADDRESS } from "./constants/addresses"
import { OracleType } from "./constants"

export function handleDeposit(event: DepositEvent): void {
    handleVaultAssetsChange(event)
}

export function handleWithdraw(event: WithdrawEvent): void {
    handleVaultAssetsChange(event)
}

export function handleVaultProfit(event: VaultProfitEvent): void {
    handleVaultAssetsChange(event)
}

export function handleVaultLoss(event: VaultLossEvent): void {
    handleVaultAssetsChange(event)
}

function handleVaultAssetsChange(event: ethereum.Event): void {
    let siUsdOracle = Oracle.load(Address.fromString(MORPHO_CHAINLINK_ORACLE_V2_SIUSD_USDC_ADDRESS))
    if (!siUsdOracle) {
        // Uncomment this to create new oracle entities for testing without having to deploy a LeverageToken
        // siUsdOracle = new Oracle(Address.fromString(MORPHO_CHAINLINK_ORACLE_V2_SIUSD_USDC_ADDRESS))
        // siUsdOracle.leverageManager = Address.fromString(LEVERAGE_MANAGER_ADDRESS)
        // siUsdOracle.type = OracleType.MORPHO_CHAINLINK
        // siUsdOracle.decimals = 6; // Dummy decimals value

        return
    }

    const oracleContract = MorphoChainlinkOracleV2Contract.bind(Address.fromString(MORPHO_CHAINLINK_ORACLE_V2_SIUSD_USDC_ADDRESS))

    // Fetch the price directly from the oracle
    const price = oracleContract.price()
    siUsdOracle.price = price
    siUsdOracle.save()

    const priceUpdate = new OraclePrice(0)
    priceUpdate.oracle = siUsdOracle.id
    priceUpdate.price = siUsdOracle.price
    priceUpdate.timestamp = event.block.timestamp.toI64()
    priceUpdate.save()
}