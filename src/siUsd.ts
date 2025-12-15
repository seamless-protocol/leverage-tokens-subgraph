import { Address, BigInt, ethereum, log } from "@graphprotocol/graph-ts"
import { Deposit as DepositEvent, Withdraw as WithdrawEvent, VaultProfit as VaultProfitEvent, VaultLoss as VaultLossEvent } from "../generated/siUSD/siUSD"
import { Oracle, OraclePrice, siUsd, siUsdEpochReward, iUSDFixedPriceOracle } from "../generated/schema"
import { IUSD_FIXED_PRICE_ORACLE_ADDRESS, LEVERAGE_MANAGER_ADDRESS, MORPHO_CHAINLINK_ORACLE_V2_SIUSD_USDC_ADDRESS, SIUSD_ADDRESS } from "./constants/addresses"
import { OracleType } from "./constants"
import { getTotalAssets } from "./utils/siUsd"
import { Transfer as TransferEvent } from "../generated/iUSD/ERC20"
import { PriceSet as IUSDFixedPriceOraclePriceSetEvent } from "../generated/iUSDFixedPriceOracle/iUSDFixedPriceOracle"

// Immutables from 0xd2cC46b9B2D761502eF933320ecf0268EC0dfa6d on Ethereum L1 (siUSD-USDC Oracle)
const SIUSD_USDC_ORACLE_BASE_VAULT_CONVERSION_FACTOR = BigInt.fromString("100000000")
const SIUSD_USDC_ORACLE_SCALE_FACTOR = BigInt.fromString("10000000000")
const USDC_ORACLE_QUOTE_FEED_1_PRICE = BigInt.fromString("1000000000000")
const IUSD_FIXED_PRICE_ORACLE_DEPLOYMENT_PRICE = BigInt.fromString("1000000000000000000")

export function handleDeposit(event: DepositEvent): void {
    let _siUSD = siUsd.load(event.address)
    if (!_siUSD) {
        _siUSD = new siUsd(event.address)
        _siUSD.totalAssets = BigInt.zero()
        _siUSD.totalShares = BigInt.zero()
    }

    _siUSD.totalShares = _siUSD.totalShares.plus(event.params.shares)
    _siUSD.save()
}

export function handleWithdraw(event: WithdrawEvent): void {
    let _siUSD = siUsd.load(event.address)
    if (!_siUSD) {
        return
    }

    _siUSD.totalShares = _siUSD.totalShares.minus(event.params.shares)
    _siUSD.save();
}

export function handleVaultProfit(event: VaultProfitEvent): void {
    let _siUSD = siUsd.load(event.address)
    if (!_siUSD) {
        return
    }

    let epoch = event.params.epoch
    let epochReward = siUsdEpochReward.load(epoch.toString())
    if (!epochReward) {
        epochReward = new siUsdEpochReward(epoch.toString())
        epochReward.siUSD = _siUSD.id
        epochReward.rewards = BigInt.zero()
    }

    epochReward.rewards = epochReward.rewards.plus(event.params.assets)
    epochReward.save()
}

export function handleVaultLoss(event: VaultLossEvent): void {
    let epoch = event.params.epoch
    if (epoch.isZero()) {
        return
    }

    let epochReward = siUsdEpochReward.load(epoch.toString())
    if (!epochReward) {
        return
    }

    epochReward.rewards = epochReward.rewards.gt(event.params.assets) ? epochReward.rewards.minus(event.params.assets) : BigInt.zero()
    epochReward.save()
}

export function handleIUSDTransfer(event: TransferEvent): void {
    if (event.params.from.notEqual(Address.fromString(SIUSD_ADDRESS)) && event.params.to.notEqual(Address.fromString(SIUSD_ADDRESS))) {
        return
    }

    let _siUSD = siUsd.load(Address.fromString(SIUSD_ADDRESS))
    if (!_siUSD) {
        _siUSD = new siUsd(Address.fromString(SIUSD_ADDRESS))
        _siUSD.totalAssets = BigInt.zero()
        _siUSD.totalShares = BigInt.zero()
    }

    _siUSD.totalAssets = event.params.to.equals(Address.fromString(SIUSD_ADDRESS)) ? _siUSD.totalAssets.plus(event.params.value) : _siUSD.totalAssets.minus(event.params.value)
    _siUSD.save()
}

export function handleBlock(block: ethereum.Block): void {
    let _siUSD = siUsd.load(Address.fromString(SIUSD_ADDRESS))
    if (!_siUSD) {
        return
    }

    let siUsdUsdcOracle = Oracle.load(Address.fromString(MORPHO_CHAINLINK_ORACLE_V2_SIUSD_USDC_ADDRESS))
    if (!siUsdUsdcOracle) {
        siUsdUsdcOracle = new Oracle(Address.fromString(MORPHO_CHAINLINK_ORACLE_V2_SIUSD_USDC_ADDRESS))
        siUsdUsdcOracle.leverageManager = Address.fromString(LEVERAGE_MANAGER_ADDRESS)
        siUsdUsdcOracle.type = OracleType.MORPHO_CHAINLINK
        siUsdUsdcOracle.decimals = 24 // 36 + 6 (USDC decimals) - 18 (siUSD decimals)
    }

    let totalAssets = getTotalAssets(_siUSD.totalAssets, block.timestamp)
    let baseVaultPrice = SIUSD_USDC_ORACLE_BASE_VAULT_CONVERSION_FACTOR.times(totalAssets.plus(BigInt.fromI32(1))).div(_siUSD.totalShares.plus(BigInt.fromI32(1)))

    let _iUSDFixedPriceOracle = iUSDFixedPriceOracle.load(Address.fromString(IUSD_FIXED_PRICE_ORACLE_ADDRESS))
    if (!_iUSDFixedPriceOracle) {
        _iUSDFixedPriceOracle = new iUSDFixedPriceOracle(Address.fromString(IUSD_FIXED_PRICE_ORACLE_ADDRESS))
        _iUSDFixedPriceOracle.price = IUSD_FIXED_PRICE_ORACLE_DEPLOYMENT_PRICE // Deployment price
        _iUSDFixedPriceOracle.save()
    }

    siUsdUsdcOracle.price = baseVaultPrice.times(SIUSD_USDC_ORACLE_SCALE_FACTOR).times(_iUSDFixedPriceOracle.price).div(USDC_ORACLE_QUOTE_FEED_1_PRICE)
    siUsdUsdcOracle.save()

    let priceUpdate = new OraclePrice(0)
    priceUpdate.oracle = siUsdUsdcOracle.id
    priceUpdate.price = siUsdUsdcOracle.price
    priceUpdate.timestamp = block.timestamp.toI64()
    priceUpdate.blockNumber = block.number
    priceUpdate.save()
}

export function handleIUSDFixedPriceOraclePriceSet(event: IUSDFixedPriceOraclePriceSetEvent): void {
    let _iUSDFixedPriceOracle = iUSDFixedPriceOracle.load(event.address)
    if (!_iUSDFixedPriceOracle) {
        _iUSDFixedPriceOracle = new iUSDFixedPriceOracle(event.address)
    }

    _iUSDFixedPriceOracle.price = event.params.price
    _iUSDFixedPriceOracle.save()
}