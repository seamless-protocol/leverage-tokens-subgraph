import { Address, BigInt } from "@graphprotocol/graph-ts"
import { LeverageManager, LeverageToken, Position, User } from "../generated/schema"
import {
  Transfer as TransferEvent,
} from "../generated/templates/LeverageToken/LeverageToken"
import { getPositionStub } from "./stubs"

export function handleTransfer(event: TransferEvent): void {
  const leverageToken = LeverageToken.load(event.address)
  if (!leverageToken) {
    return
  }

  const leverageManager = LeverageManager.load(leverageToken.leverageManager)
  if (!leverageManager) {
    return
  }

  if (event.params.from.equals(Address.zero())) {
    leverageToken.totalSupply = leverageToken.totalSupply.plus(event.params.value)
  } else if (event.params.to.equals(Address.zero())) {
    leverageToken.totalSupply = leverageToken.totalSupply.minus(event.params.value)
  }

  if (event.params.from.notEqual(Address.zero())) {
    const fromPositionId = event.params.from.toHexString().concat("-").concat(leverageToken.id.toHexString())
    let fromPosition = Position.load(fromPositionId)
    if (!fromPosition) {
      return
    }

    fromPosition.balance = fromPosition.balance.minus(event.params.value)
    fromPosition.save()

    if (fromPosition.balance.isZero()) {
      leverageToken.totalHolders = leverageToken.totalHolders.minus(BigInt.fromI32(1))
      leverageManager.totalHolders = leverageManager.totalHolders.minus(BigInt.fromI32(1))
    }
  }

  if (event.params.to.notEqual(Address.zero())) {
    let user = User.load(event.params.to)
    if (!user) {
      user = new User(event.params.to)
      user.save()
    }

    const toPositionId = event.params.to.toHexString().concat("-").concat(leverageToken.id.toHexString())
    let toPosition = Position.load(toPositionId)
    if (!toPosition) {
      toPosition = getPositionStub(Address.fromBytes(user.id), Address.fromBytes(leverageToken.id))
    }

    if (toPosition.balance.isZero() && event.params.value.gt(BigInt.zero())) {
      leverageToken.totalHolders = leverageToken.totalHolders.plus(BigInt.fromI32(1))
      leverageManager.totalHolders = leverageManager.totalHolders.plus(BigInt.fromI32(1))
    }

    toPosition.balance = toPosition.balance.plus(event.params.value)
    toPosition.save()
  }

  leverageToken.save()
  leverageManager.save()
}
