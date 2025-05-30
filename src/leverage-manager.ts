import {
  LendingAdapter,
  LeverageManager,
  LeverageToken,
  LeverageManagerAssetStats,
  User,
  LeverageTokenState,
  Oracle,
  MorphoChainlinkOracleData,
  ChainlinkAggregator,
  ProfitAndLoss,
  LeverageTokenBalanceChange,
  OraclePrice
} from "../generated/schema"
import {
  LeverageManagerInitialized as LeverageManagerInitializedEvent,
  LeverageTokenCreated as LeverageTokenCreatedEvent,
  ManagementFeeCharged as ManagementFeeChargedEvent,
  Mint as MintEvent,
  Rebalance as RebalanceEvent,
  Redeem as RedeemEvent
} from "../generated/LeverageManager/LeverageManager"
import { ChainlinkAggregator as ChainlinkAggregatorContract } from "../generated/LeverageManager/ChainlinkAggregator"
import { ChainlinkEACAggregatorProxy as ChainlinkEACAggregatorProxyContract } from "../generated/LeverageManager/ChainlinkEACAggregatorProxy"
import { LeverageManager as LeverageManagerContract } from "../generated/LeverageManager/LeverageManager"
import { LeverageToken as LeverageTokenTemplate } from "../generated/templates"
import { ChainlinkAggregator as ChainlinkAggregatorTemplate } from "../generated/templates"
import { MorphoLendingAdapter as MorphoLendingAdapterContract } from "../generated/LeverageManager/MorphoLendingAdapter"
import { MorphoChainlinkOracleV2 as MorphoChainlinkOracleV2Contract } from "../generated/LeverageManager/MorphoChainlinkOracleV2"
import { Address, BigInt } from "@graphprotocol/graph-ts"
import { LendingAdapterType, LeverageTokenBalanceChangeType, MAX_UINT256_STRING, MORPHO_ORACLE_PRICE_DECIMALS, OracleType } from "./constants"
import { getLeverageManagerStub, getPositionStub } from "./stubs"
import { calculateMorphoChainlinkPrice, convertCollateralToDebt, convertDebtToCollateral, getPosition } from "./utils"

export function handleLeverageManagerInitialized(
  event: LeverageManagerInitializedEvent
): void {
  let leverageManager = LeverageManager.load(event.address)
  if (!leverageManager) {
    leverageManager = getLeverageManagerStub(event.address)
  }

  leverageManager.save()
}

export function handleLeverageTokenCreated(
  event: LeverageTokenCreatedEvent
): void {
  let leverageManager = LeverageManager.load(event.address)
  if (!leverageManager) {
    return
  }

  leverageManager.leverageTokensCount = leverageManager.leverageTokensCount.plus(BigInt.fromI32(1))
  leverageManager.save()

  let lendingAdapter = LendingAdapter.load(event.params.config.lendingAdapter)
  if (!lendingAdapter) {
    lendingAdapter = initLendingAdapter(event, leverageManager)
  }

  LeverageTokenTemplate.create(event.params.token)
  const leverageToken = new LeverageToken(event.params.token)

  leverageToken.leverageManager = leverageManager.id

  leverageToken.createdTimestamp = event.block.timestamp
  leverageToken.createdBlockNumber = event.block.number

  leverageToken.lendingAdapter = lendingAdapter.id
  leverageToken.rebalanceAdapter = event.params.config.rebalanceAdapter

  // ======== Boilerplate values ========

  // Default to max uint256, like the protocol does for an empty LeverageToken
  leverageToken.collateralRatio = BigInt.fromString(MAX_UINT256_STRING);

  leverageToken.totalCollateral = BigInt.zero()
  leverageToken.totalCollateralInDebt = BigInt.zero()

  leverageToken.totalSupply = BigInt.zero()
  leverageToken.totalHolders = BigInt.zero()

  leverageToken.totalMintTokenActionFees = BigInt.zero()
  leverageToken.totalRedeemTokenActionFees = BigInt.zero()
  leverageToken.totalMintTreasuryFees = BigInt.zero()
  leverageToken.totalRedeemTreasuryFees = BigInt.zero()
  leverageToken.totalManagementFees = BigInt.zero()

  // ======== End of boilerplate values ========

  leverageToken.save()

  initLeverageManagerAssetStats(Address.fromBytes(leverageManager.id), Address.fromBytes(lendingAdapter.collateralAsset))
  initLeverageManagerAssetStats(Address.fromBytes(leverageManager.id), Address.fromBytes(lendingAdapter.debtAsset))
}

export function handleManagementFeeCharged(
  event: ManagementFeeChargedEvent
): void {
}

export function handleMint(event: MintEvent): void {
  const leverageManager = LeverageManager.load(event.address)
  if (!leverageManager) {
    return
  }
  const leverageManagerContract = LeverageManagerContract.bind(event.address)

  const leverageToken = LeverageToken.load(event.params.token)
  if (!leverageToken) {
    return
  }

  const lendingAdapter = LendingAdapter.load(leverageToken.lendingAdapter)
  if (!lendingAdapter) {
    return
  }

  const oracle = Oracle.load(lendingAdapter.oracle)
  if (!oracle) {
    return
  }

  const leverageManagerCollateralAssetStats = LeverageManagerAssetStats.load(lendingAdapter.collateralAsset)
  if (!leverageManagerCollateralAssetStats) {
    return
  }

  const user = User.load(event.params.sender)
  if (!user) {
    return
  }

  const leverageTokenState = leverageManagerContract.getLeverageTokenState(event.params.token)

  const equityAddedInCollateral = event.params.actionData.equity
  const equityAddedInDebt = convertCollateralToDebt(oracle, equityAddedInCollateral)

  let position = getPosition(event.params.sender, Address.fromBytes(leverageToken.id))
  if (!position) {
    position = getPositionStub(event.params.sender, Address.fromBytes(leverageToken.id))
  }
  position.balance = position.balance.plus(event.params.actionData.shares)

  // The total equity deposit fields are running totals of the equity deposited for the balance of the position.
  // They are updated on mints, redeems, and transfers.
  position.totalEquityDepositedInCollateral = position.totalEquityDepositedInCollateral.plus(equityAddedInCollateral)
  position.totalEquityDepositedInDebt = position.totalEquityDepositedInDebt.plus(equityAddedInDebt)
  position.save()

  leverageToken.totalCollateral = leverageToken.totalCollateral.plus(event.params.actionData.collateral)
  leverageToken.totalCollateralInDebt = convertCollateralToDebt(oracle, leverageToken.totalCollateral)
  leverageToken.totalMintTokenActionFees = leverageToken.totalMintTokenActionFees.plus(event.params.actionData.tokenFee)
  leverageToken.totalMintTreasuryFees = leverageToken.totalMintTreasuryFees.plus(event.params.actionData.treasuryFee)
  leverageToken.collateralRatio = leverageTokenState.collateralRatio
  leverageToken.save()

  const balanceUpdate = new LeverageTokenBalanceChange(0)
  balanceUpdate.position = position.id
  balanceUpdate.leverageToken = leverageToken.id
  balanceUpdate.amount = event.params.actionData.shares
  balanceUpdate.equityInCollateral = equityAddedInCollateral
  balanceUpdate.equityInDebt = equityAddedInDebt
  balanceUpdate.timestamp = event.block.timestamp.toI64()
  balanceUpdate.blockNumber = event.block.number
  balanceUpdate.type = LeverageTokenBalanceChangeType.MINT
  balanceUpdate.save()

  // The id for timeseries is autogenerated; even if we set it to a real value, it is silently overwritten
  const leverageTokenStateUpdate = new LeverageTokenState(0)
  leverageTokenStateUpdate.leverageToken = leverageToken.id
  leverageTokenStateUpdate.totalCollateral = leverageToken.totalCollateral
  leverageTokenStateUpdate.totalDebt = leverageTokenState.debt
  leverageTokenStateUpdate.totalEquityInCollateral = convertDebtToCollateral(oracle, leverageTokenState.equity)
  leverageTokenStateUpdate.totalEquityInDebt = leverageTokenState.equity
  leverageTokenStateUpdate.collateralRatio = leverageTokenState.collateralRatio
  leverageTokenStateUpdate.timestamp = event.block.timestamp.toI64()
  leverageTokenStateUpdate.blockNumber = event.block.number
  leverageTokenStateUpdate.save()

  leverageManagerCollateralAssetStats.totalCollateral = leverageManagerCollateralAssetStats.totalCollateral.plus(
    event.params.actionData.collateral
  )
  leverageManagerCollateralAssetStats.save()
}

export function handleRebalance(event: RebalanceEvent): void {
}

export function handleRedeem(event: RedeemEvent): void {
  const leverageManager = LeverageManager.load(event.address)
  if (!leverageManager) {
    return
  }
  const leverageManagerContract = LeverageManagerContract.bind(event.address)

  const leverageToken = LeverageToken.load(event.params.token)
  if (!leverageToken) {
    return
  }

  const lendingAdapter = LendingAdapter.load(leverageToken.lendingAdapter)
  if (!lendingAdapter) {
    return
  }

  const oracle = Oracle.load(lendingAdapter.oracle)
  if (!oracle) {
    return
  }


  const leverageManagerCollateralAssetStats = LeverageManagerAssetStats.load(lendingAdapter.collateralAsset)
  if (!leverageManagerCollateralAssetStats) {
    return
  }

  const user = User.load(event.params.sender)
  if (!user) {
    return
  }

  let position = getPosition(event.params.sender, Address.fromBytes(leverageToken.id))
  if (!position) {
    return
  }

  const leverageTokenState = leverageManagerContract.getLeverageTokenState(event.params.token)

  const equityRemovedInCollateral = event.params.actionData.equity
  const equityRemovedInDebt = convertCollateralToDebt(oracle, equityRemovedInCollateral)

  const equityDepositedForSharesInCollateral = event.params.actionData.shares.times(position.totalEquityDepositedInCollateral).div(position.balance)
  const equityDepositedForSharesInDebt = event.params.actionData.shares.times(position.totalEquityDepositedInDebt).div(position.balance)

  leverageToken.totalCollateral = leverageToken.totalCollateral.minus(event.params.actionData.collateral)
  leverageToken.totalCollateralInDebt = convertCollateralToDebt(oracle, leverageToken.totalCollateral)
  leverageToken.totalRedeemTokenActionFees = leverageToken.totalRedeemTokenActionFees.plus(event.params.actionData.tokenFee)
  leverageToken.totalRedeemTreasuryFees = leverageToken.totalRedeemTreasuryFees.plus(event.params.actionData.treasuryFee)
  leverageToken.collateralRatio = leverageTokenState.collateralRatio
  leverageToken.save()

  // Realized pnl is calculated when LTs are redeemed. To calculate the realized pnl on the redeem, we calculate the
  // difference between the equity value of the LT shares, and the equity the user deposited for the shares
  const pnl = new ProfitAndLoss(0)
  pnl.position = position.id
  pnl.realizedInCollateral = equityRemovedInCollateral.minus(equityDepositedForSharesInCollateral)
  pnl.realizedInDebt = equityRemovedInDebt.minus(equityDepositedForSharesInDebt)
  pnl.equityReceivedInCollateral = equityRemovedInCollateral
  pnl.equityReceivedInDebt = equityRemovedInDebt
  pnl.equityDepositedInCollateral = equityDepositedForSharesInCollateral
  pnl.equityDepositedInDebt = equityDepositedForSharesInDebt
  pnl.timestamp = event.block.timestamp.toI64()
  pnl.blockNumber = event.block.number
  pnl.save()

  position.balance = position.balance.minus(event.params.actionData.shares)
  position.totalEquityDepositedInCollateral = position.totalEquityDepositedInCollateral.minus(equityDepositedForSharesInCollateral)
  position.totalEquityDepositedInDebt = position.totalEquityDepositedInDebt.minus(equityDepositedForSharesInDebt)
  position.realizedPnlInCollateral = position.realizedPnlInCollateral.plus(pnl.realizedInCollateral)
  position.realizedPnlInDebt = position.realizedPnlInDebt.plus(pnl.realizedInDebt)
  position.save()

  // The id for timeseries is autogenerated; even if we set it to a real value, it is silently overwritten
  const balanceUpdate = new LeverageTokenBalanceChange(0)
  balanceUpdate.position = position.id
  balanceUpdate.leverageToken = leverageToken.id
  balanceUpdate.amount = event.params.actionData.shares.neg()
  balanceUpdate.equityInCollateral = equityRemovedInCollateral.neg()
  balanceUpdate.equityInDebt = equityRemovedInDebt.neg()
  balanceUpdate.timestamp = event.block.timestamp.toI64()
  balanceUpdate.blockNumber = event.block.number
  balanceUpdate.type = LeverageTokenBalanceChangeType.REDEEM
  balanceUpdate.save()

  // The id for timeseries is autogenerated; even if we set it to a real value, it is silently overwritten
  const leverageTokenStateUpdate = new LeverageTokenState(0)
  leverageTokenStateUpdate.leverageToken = leverageToken.id
  leverageTokenStateUpdate.totalCollateral = leverageToken.totalCollateral
  leverageTokenStateUpdate.totalDebt = leverageTokenState.debt
  leverageTokenStateUpdate.totalEquityInCollateral = convertDebtToCollateral(oracle, leverageTokenState.equity)
  leverageTokenStateUpdate.totalEquityInDebt = leverageTokenState.equity
  leverageTokenStateUpdate.collateralRatio = leverageTokenState.collateralRatio
  leverageTokenStateUpdate.timestamp = event.block.timestamp.toI64()
  leverageTokenStateUpdate.blockNumber = event.block.number
  leverageTokenStateUpdate.save()

  leverageManagerCollateralAssetStats.totalCollateral = leverageManagerCollateralAssetStats.totalCollateral.minus(
    event.params.actionData.collateral
  )
  leverageManagerCollateralAssetStats.save()
}

function initLendingAdapter(event: LeverageTokenCreatedEvent, leverageManager: LeverageManager): LendingAdapter {
  const lendingAdapterAddress = event.params.config.lendingAdapter

  let lendingAdapter = new LendingAdapter(lendingAdapterAddress)

  // TODO: Determine the type of lending adapter by indexing lending adapters deployed from the morpho lending adapter factory,
  // or by try / catch querying the market id on the lending adapter contract
  lendingAdapter.type = LendingAdapterType.MORPHO
  if (lendingAdapter.type === LendingAdapterType.MORPHO) {
    const morphoLendingAdapter = MorphoLendingAdapterContract.bind(lendingAdapterAddress)

    const marketId = morphoLendingAdapter.morphoMarketId()
    const marketParams = morphoLendingAdapter.marketParams()

    lendingAdapter.morphoMarketId = marketId;
    lendingAdapter.collateralAsset = marketParams.getCollateralToken()
    lendingAdapter.debtAsset = marketParams.getLoanToken()

    const oracleAddress = marketParams.getOracle();
    let oracle = Oracle.load(oracleAddress);
    if (!oracle) {
      const morphoChainlinkOracleContract = MorphoChainlinkOracleV2Contract.bind(oracleAddress);

      oracle = new Oracle(oracleAddress);
      oracle.leverageManager = leverageManager.id
      oracle.decimals = MORPHO_ORACLE_PRICE_DECIMALS
      oracle.type = OracleType.MORPHO_CHAINLINK

      let morphoChainlinkOracleData = MorphoChainlinkOracleData.load(oracleAddress)
      if (!morphoChainlinkOracleData) {
        morphoChainlinkOracleData = new MorphoChainlinkOracleData(oracleAddress)
        morphoChainlinkOracleData.oracle = oracle.id
      }
      oracle.morphoChainlinkOracleData = morphoChainlinkOracleData.id

      // Only BASE_FEED_1 must be defined, the other feeds are optional
      const baseFeedA = ChainlinkEACAggregatorProxyContract.bind(morphoChainlinkOracleContract.BASE_FEED_1())
      const baseFeedBAddress = morphoChainlinkOracleContract.BASE_FEED_2()
      const quoteFeedAAddress = morphoChainlinkOracleContract.QUOTE_FEED_1()
      const quoteFeedBAddress = morphoChainlinkOracleContract.QUOTE_FEED_2()
      const aggregatorContracts = [
        ChainlinkAggregatorContract.bind(baseFeedA.aggregator()),
        baseFeedBAddress.notEqual(Address.zero())
          ? ChainlinkAggregatorContract.bind(ChainlinkEACAggregatorProxyContract.bind(baseFeedBAddress).aggregator())
          : null,
        quoteFeedAAddress.notEqual(Address.zero())
          ? ChainlinkAggregatorContract.bind(ChainlinkEACAggregatorProxyContract.bind(quoteFeedAAddress).aggregator())
          : null,
        quoteFeedBAddress.notEqual(Address.zero())
          ? ChainlinkAggregatorContract.bind(ChainlinkEACAggregatorProxyContract.bind(quoteFeedBAddress).aggregator())
          : null
      ]

      morphoChainlinkOracleData.baseVault = morphoChainlinkOracleContract.BASE_VAULT()
      morphoChainlinkOracleData.quoteVault = morphoChainlinkOracleContract.QUOTE_VAULT()
      morphoChainlinkOracleData.scaleFactor = morphoChainlinkOracleContract.SCALE_FACTOR()

      for (let i = 0; i < aggregatorContracts.length; i++) {
        const aggregatorContract = aggregatorContracts[i]
        if (aggregatorContract === null) {
          continue
        }

        let aggregator = ChainlinkAggregator.load(aggregatorContract._address)
        if (!aggregator) {
          ChainlinkAggregatorTemplate.create(aggregatorContract._address)
          aggregator = new ChainlinkAggregator(aggregatorContract._address)

          const latestRoundData = aggregatorContract.latestRoundData()
          const decimals = aggregatorContract.decimals()

          aggregator.price = latestRoundData.getAnswer()
          aggregator.decimals = decimals
          aggregator.save()
        }

        if (i === 0) {
          morphoChainlinkOracleData.baseAggregatorA = aggregator.id
        } else if (i === 1) {
          morphoChainlinkOracleData.baseAggregatorB = aggregator.id
        } else if (i === 2) {
          morphoChainlinkOracleData.quoteAggregatorA = aggregator.id
        } else if (i === 3) {
          morphoChainlinkOracleData.quoteAggregatorB = aggregator.id
        }
      }

      oracle.price = calculateMorphoChainlinkPrice(morphoChainlinkOracleData)
      oracle.save()

      const priceUpdate = new OraclePrice(0)
      priceUpdate.oracle = oracle.id
      priceUpdate.price = oracle.price
      priceUpdate.timestamp = event.block.timestamp.toI64()
      priceUpdate.save()

      morphoChainlinkOracleData.save()
    }

    lendingAdapter.oracle = oracle.id
  }

  lendingAdapter.save()

  return lendingAdapter
}

function initLeverageManagerAssetStats(leverageManager: Address, asset: Address): LeverageManagerAssetStats {
  let leverageManagerAssetStats = LeverageManagerAssetStats.load(asset)
  if (!leverageManagerAssetStats) {
    leverageManagerAssetStats = new LeverageManagerAssetStats(asset)
    leverageManagerAssetStats.leverageManager = leverageManager
    leverageManagerAssetStats.totalCollateral = BigInt.zero()
    leverageManagerAssetStats.save()
  }
  return leverageManagerAssetStats
}