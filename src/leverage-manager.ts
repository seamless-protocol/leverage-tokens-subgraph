import {
  LendingAdapter,
  LeverageManager,
  LeverageToken,
  LeverageManagerAssetStats,
  User,
  Mint,
  LeverageTokenEquity,
  Redeem,
  Oracle,
  MorphoChainlinkOracleData,
  ChainlinkAggregator,
  Balance,
  ProfitAndLoss,
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
import { LendingAdapterType, MAX_UINT256_STRING, OracleType } from "./constants"
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

  // The equity paid fields are running totals of the equity paid for the balance of the position, without any pnl
  // considered. They are updated on mints, redeems, and transfers (not price changes or rebalances).
  position.equityPaidInCollateral = position.equityPaidInCollateral.plus(equityAddedInCollateral)
  position.equityPaidInDebt = position.equityPaidInDebt.plus(equityAddedInDebt)
  position.save()

  // The id for timeseries is autogenerated; even if we set it to a real value, it is silently overwritten
  const mint = new Mint(0)
  mint.position = position.id
  mint.leverageToken = leverageToken.id
  mint.amount = event.params.actionData.shares
  mint.equityInCollateral = equityAddedInCollateral
  mint.equityInDebt = equityAddedInDebt
  mint.tokenActionFee = event.params.actionData.tokenFee
  mint.treasuryActionFee = event.params.actionData.treasuryFee
  mint.timestamp = event.block.timestamp.toI64()
  mint.blockNumber = event.block.number
  mint.save()

  leverageToken.totalCollateral = leverageToken.totalCollateral.plus(event.params.actionData.collateral)
  leverageToken.totalCollateralInDebt = convertCollateralToDebt(oracle, leverageToken.totalCollateral)
  leverageToken.totalMintTokenActionFees = leverageToken.totalMintTokenActionFees.plus(mint.tokenActionFee)
  leverageToken.totalMintTreasuryFees = leverageToken.totalMintTreasuryFees.plus(mint.treasuryActionFee)
  leverageToken.collateralRatio = leverageTokenState.collateralRatio
  leverageToken.save()

  const balanceUpdate = new Balance(0)
  balanceUpdate.position = position.id
  balanceUpdate.amount = event.params.actionData.shares
  balanceUpdate.equityInCollateral = mint.equityInCollateral
  balanceUpdate.equityInDebt = mint.equityInDebt
  balanceUpdate.timestamp = event.block.timestamp.toI64()
  balanceUpdate.blockNumber = event.block.number
  balanceUpdate.save()

  // The id for timeseries is autogenerated; even if we set it to a real value, it is silently overwritten
  const leverageTokenEquityUpdate = new LeverageTokenEquity(0)
  leverageTokenEquityUpdate.leverageToken = leverageToken.id
  leverageTokenEquityUpdate.totalCollateral = leverageToken.totalCollateral
  leverageTokenEquityUpdate.totalDebt = leverageTokenState.debt
  leverageTokenEquityUpdate.totalEquityInCollateral = convertDebtToCollateral(oracle, leverageTokenState.equity)
  leverageTokenEquityUpdate.totalEquityInDebt = leverageTokenState.equity
  leverageTokenEquityUpdate.collateralRatio = leverageTokenState.collateralRatio
  leverageTokenEquityUpdate.timestamp = event.block.timestamp.toI64()
  leverageTokenEquityUpdate.blockNumber = event.block.number
  leverageTokenEquityUpdate.save()

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

  const equityPaidForSharesInCollateral = event.params.actionData.shares.times(position.equityPaidInCollateral).div(position.balance)
  const equityPaidForSharesInDebt = event.params.actionData.shares.times(position.equityPaidInDebt).div(position.balance)

  // The id for timeseries is autogenerated; even if we set it to a real value, it is silently overwritten
  const redeem = new Redeem(0)
  redeem.position = position.id
  redeem.leverageToken = leverageToken.id
  redeem.amount = event.params.actionData.shares
  redeem.equityInCollateral = equityRemovedInCollateral
  redeem.equityInDebt = equityRemovedInDebt
  redeem.tokenActionFee = event.params.actionData.tokenFee
  redeem.treasuryActionFee = event.params.actionData.treasuryFee
  redeem.timestamp = event.block.timestamp.toI64()
  redeem.blockNumber = event.block.number
  redeem.save()

  leverageToken.totalCollateral = leverageToken.totalCollateral.minus(event.params.actionData.collateral)
  leverageToken.totalCollateralInDebt = convertCollateralToDebt(oracle, leverageToken.totalCollateral)
  leverageToken.totalRedeemTokenActionFees = leverageToken.totalRedeemTokenActionFees.plus(redeem.tokenActionFee)
  leverageToken.totalRedeemTreasuryFees = leverageToken.totalRedeemTreasuryFees.plus(redeem.treasuryActionFee)
  leverageToken.collateralRatio = leverageTokenState.collateralRatio
  leverageToken.save()

  // Realized pnl is calculated when LTs are redeemed. To calculate the realized pnl on the redeem, we calculate the
  // difference between the equity value of the LT shares, and the equity the user paid for the shares
  const pnl = new ProfitAndLoss(0)
  pnl.position = position.id
  pnl.realized = redeem.equityInCollateral.minus(equityPaidForSharesInCollateral)
  pnl.equityReceived = redeem.equityInCollateral
  pnl.equityPaid = equityPaidForSharesInCollateral
  pnl.timestamp = redeem.timestamp
  pnl.blockNumber = redeem.blockNumber
  pnl.save()

  position.balance = position.balance.minus(redeem.amount)
  position.equityPaidInCollateral = position.equityPaidInCollateral.minus(equityPaidForSharesInCollateral)
  position.equityPaidInDebt = position.equityPaidInDebt.minus(equityPaidForSharesInDebt)
  position.totalPnl = position.totalPnl.plus(pnl.realized)
  position.save()

  // The id for timeseries is autogenerated; even if we set it to a real value, it is silently overwritten
  const balanceUpdate = new Balance(0)
  balanceUpdate.position = position.id
  balanceUpdate.amount = redeem.amount.neg()
  balanceUpdate.equityInCollateral = redeem.equityInCollateral.neg()
  balanceUpdate.equityInDebt = redeem.equityInDebt.neg()
  balanceUpdate.timestamp = redeem.timestamp
  balanceUpdate.blockNumber = redeem.blockNumber
  balanceUpdate.save()

  // The id for timeseries is autogenerated; even if we set it to a real value, it is silently overwritten
  const leverageTokenEquityUpdate = new LeverageTokenEquity(0)
  leverageTokenEquityUpdate.leverageToken = leverageToken.id
  leverageTokenEquityUpdate.totalCollateral = leverageToken.totalCollateral
  leverageTokenEquityUpdate.totalDebt = leverageTokenState.debt
  leverageTokenEquityUpdate.totalEquityInCollateral = convertDebtToCollateral(oracle, leverageTokenState.equity)
  leverageTokenEquityUpdate.totalEquityInDebt = leverageTokenState.equity
  leverageTokenEquityUpdate.collateralRatio = leverageTokenState.collateralRatio
  leverageTokenEquityUpdate.timestamp = redeem.timestamp
  leverageTokenEquityUpdate.blockNumber = redeem.blockNumber
  leverageTokenEquityUpdate.save()

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

          aggregator.price = latestRoundData.getAnswer()
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