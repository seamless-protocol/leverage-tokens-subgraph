import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { BigInt, Address } from "@graphprotocol/graph-ts"
import { AuctionCreated } from "../generated/schema"
import { AuctionCreated as AuctionCreatedEvent } from "../generated/RebalanceAdapter/RebalanceAdapter"
import { handleAuctionCreated } from "../src/rebalance-adapter"
import { createAuctionCreatedEvent } from "./rebalance-adapter-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/developer/matchstick/#tests-structure-0-5-0

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let auction = "ethereum.Tuple Not implemented"
    let newAuctionCreatedEvent = createAuctionCreatedEvent(auction)
    handleAuctionCreated(newAuctionCreatedEvent)
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/developer/matchstick/#write-a-unit-test

  test("AuctionCreated created and stored", () => {
    assert.entityCount("AuctionCreated", 1)

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "AuctionCreated",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "auction",
      "ethereum.Tuple Not implemented"
    )

    // More assert options:
    // https://thegraph.com/docs/en/developer/matchstick/#asserts
  })
})
