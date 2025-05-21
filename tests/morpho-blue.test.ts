import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { Bytes, BigInt, Address } from "@graphprotocol/graph-ts"
import { AccrueInterest } from "../generated/schema"
import { AccrueInterest as AccrueInterestEvent } from "../generated/MorphoBlue/MorphoBlue"
import { handleAccrueInterest } from "../src/morpho-blue"
import { createAccrueInterestEvent } from "./morpho-blue-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/developer/matchstick/#tests-structure-0-5-0

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let id = Bytes.fromI32(1234567890)
    let prevBorrowRate = BigInt.fromI32(234)
    let interest = BigInt.fromI32(234)
    let feeShares = BigInt.fromI32(234)
    let newAccrueInterestEvent = createAccrueInterestEvent(
      id,
      prevBorrowRate,
      interest,
      feeShares
    )
    handleAccrueInterest(newAccrueInterestEvent)
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/developer/matchstick/#write-a-unit-test

  test("AccrueInterest created and stored", () => {
    assert.entityCount("AccrueInterest", 1)

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "AccrueInterest",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "prevBorrowRate",
      "234"
    )
    assert.fieldEquals(
      "AccrueInterest",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "interest",
      "234"
    )
    assert.fieldEquals(
      "AccrueInterest",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "feeShares",
      "234"
    )

    // More assert options:
    // https://thegraph.com/docs/en/developer/matchstick/#asserts
  })
})
