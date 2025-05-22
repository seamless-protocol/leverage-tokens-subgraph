import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { BigInt, Address, Bytes } from "@graphprotocol/graph-ts"
import { DefaultManagementFeeAtCreationSet as DefaultManagementFeeAtCreationSetEvent } from "../generated/LeverageManager/LeverageManager"
import { handleDefaultManagementFeeAtCreationSet } from "../src/leverage-manager"
import { createDefaultManagementFeeAtCreationSetEvent } from "./leverage-manager-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/developer/matchstick/#tests-structure-0-5-0

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let fee = BigInt.fromI32(234)
    let newDefaultManagementFeeAtCreationSetEvent =
      createDefaultManagementFeeAtCreationSetEvent(fee)
    handleDefaultManagementFeeAtCreationSet(
      newDefaultManagementFeeAtCreationSetEvent
    )
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/developer/matchstick/#write-a-unit-test

  test("DefaultManagementFeeAtCreationSet created and stored", () => {
    assert.entityCount("DefaultManagementFeeAtCreationSet", 1)

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "DefaultManagementFeeAtCreationSet",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "fee",
      "234"
    )

    // More assert options:
    // https://thegraph.com/docs/en/developer/matchstick/#asserts
  })
})
