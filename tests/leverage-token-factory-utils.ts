import { newMockEvent } from "matchstick-as"
import { ethereum, Address, Bytes } from "@graphprotocol/graph-ts"
import {
  BeaconProxyCreated
} from "../generated/LeverageTokenFactory/LeverageTokenFactory"

export function createBeaconProxyCreatedEvent(
  proxy: Address,
  data: Bytes,
  baseSalt: Bytes
): BeaconProxyCreated {
  let beaconProxyCreatedEvent = changetype<BeaconProxyCreated>(newMockEvent())

  beaconProxyCreatedEvent.parameters = new Array()

  beaconProxyCreatedEvent.parameters.push(
    new ethereum.EventParam("proxy", ethereum.Value.fromAddress(proxy))
  )
  beaconProxyCreatedEvent.parameters.push(
    new ethereum.EventParam("data", ethereum.Value.fromBytes(data))
  )
  beaconProxyCreatedEvent.parameters.push(
    new ethereum.EventParam("baseSalt", ethereum.Value.fromFixedBytes(baseSalt))
  )

  return beaconProxyCreatedEvent
}