import { describe, test, clearStore, afterAll, assert, log, afterEach } from "matchstick-as/assembly/index";
import { handleCustomLivenessSet, handleCustomBondSet } from "../../src/mappings/managedOracleV2";
import { handleOptimisticProposePrice, handleOptimisticRequestPrice } from "../../src/mappings/optimisticOracleV2";
import {
  createCustomLivenessSetEvent,
  createCustomBondSetEvent,
  createProposePriceEvent,
  createRequestPriceEvent,
  mockGetState,
  State,
} from "./utils";
import { CustomLiveness, CustomBond, OptimisticPriceRequest } from "../../generated/schema";
import { BigInt, Bytes, Address } from "@graphprotocol/graph-ts";

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/developer/matchstick/#tests-structure-0-5-0

namespace Constants {
  export const managedRequestId = "0x8aed060a05dfbb279705824d8b544fc58a63ebc4a1c26380cbd90297c0a7e33c";
  export const requester = "0x9A8f92a830A5cB89a3816e3D267CB7791c16b04D";
  export const identifierHex = "0x00000000000000000000000000000000005945535f4f525f4e4f5f5155455259"; //  "YES_OR_NO_QUERY"
  export const identifierString = "YES_OR_NO_QUERY";
  export const ancillaryData = "0x5945535f4f525f4e4f5f5155455259";
  export const currency = "0x9b4A302A548c7e313c2b74C461db7b84d3074A84";
  export const customBond = 2000000;
  export const customLiveness = 1757286231;
  export const reward = 1000000;
  export const finalFee = 500000;
  export const timestamp = 1757284669;
  export const customLiveness_2 = 123456;
  export const customBond_2 = 3000000;
  export const currency_2 = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
}

describe("Managed OOv2", () => {
  afterEach(() => {
    clearStore();
  });

  test("handleCustomLivenessSet creates CustomLiveness entity correctly", () => {
    const customLivenessEvent = createCustomLivenessSetEvent(
      Constants.managedRequestId,
      Constants.requester,
      Constants.identifierHex,
      Constants.ancillaryData,
      Constants.customLiveness
    );

    handleCustomLivenessSet(customLivenessEvent);

    const managedRequestIdActual = customLivenessEvent.params.managedRequestId.toHexString();

    const customLivenessEntity = CustomLiveness.load(managedRequestIdActual);

    assert.assertTrue(customLivenessEntity !== null, "CustomLiveness entity should be created");

    if (customLivenessEntity === null) {
      return;
    }

    assert.addressEquals(
      Address.fromBytes(customLivenessEntity.requester),
      Address.fromString(Constants.requester),
      "Requester should match"
    );
    assert.stringEquals(customLivenessEntity.identifier, "YES_OR_NO_QUERY", "Identifier should match");
    assert.bytesEquals(
      Bytes.fromHexString(customLivenessEntity.ancillaryData),
      Bytes.fromHexString(Constants.ancillaryData),
      "Ancillary data should match"
    );
    assert.bigIntEquals(
      customLivenessEntity.customLiveness,
      BigInt.fromI32(Constants.customLiveness),
      "Custom liveness should match"
    );

    log.info("Created CustomLiveness entity: {}", [customLivenessEntity.id]);
    log.info("Requester: {}", [customLivenessEntity.requester.toHexString()]);
    log.info("Identifier: {}", [customLivenessEntity.identifier]);
    log.info("Ancillary Data: {}", [customLivenessEntity.ancillaryData]);
    log.info("Custom Liveness: {}", [customLivenessEntity.customLiveness.toString()]);
  });

  test("handleCustomBondSet creates CustomBond entity correctly", () => {
    const customBondEvent = createCustomBondSetEvent(
      Constants.managedRequestId,
      Constants.requester,
      Constants.identifierHex,
      Constants.ancillaryData,
      Constants.currency,
      Constants.customBond
    );

    handleCustomBondSet(customBondEvent);

    const managedRequestIdActual = customBondEvent.params.managedRequestId.toHexString();

    const customBondEntity = CustomBond.load(managedRequestIdActual);

    assert.assertTrue(customBondEntity !== null, "CustomBond entity should be created");

    if (customBondEntity === null) {
      return;
    }

    assert.addressEquals(
      Address.fromBytes(customBondEntity.requester),
      Address.fromString(Constants.requester),
      "Requester should match"
    );
    assert.stringEquals(customBondEntity.identifier, Constants.identifierString, "Identifier should match");
    assert.bytesEquals(
      Bytes.fromHexString(customBondEntity.ancillaryData),
      Bytes.fromHexString(Constants.ancillaryData),
      "Ancillary data should match"
    );
    assert.bigIntEquals(customBondEntity.customBond, BigInt.fromI32(Constants.customBond), "Custom bond should match");

    log.info("Created CustomBond entity: {}", [customBondEntity.id]);
    log.info("Requester: {}", [customBondEntity.requester.toHexString()]);
    log.info("Identifier: {}", [customBondEntity.identifier]);
    log.info("Ancillary Data: {}", [customBondEntity.ancillaryData]);
    log.info("Custom Bond: {}", [customBondEntity.customBond.toString()]);
  });

  test("Custom bond and liveness are applied to RequestPrice entity at REQUEST time", () => {
    mockGetState(
      Constants.requester,
      Constants.identifierHex,
      Constants.timestamp,
      Constants.ancillaryData,
      State.Requested
    );
    // Step 1: Set custom liveness
    const customLivenessEvent = createCustomLivenessSetEvent(
      Constants.managedRequestId,
      Constants.requester,
      Constants.identifierHex,
      Constants.ancillaryData,
      Constants.customLiveness
    );
    handleCustomLivenessSet(customLivenessEvent);

    // Step 2: Set custom bond
    const customBondEvent = createCustomBondSetEvent(
      Constants.managedRequestId,
      Constants.requester,
      Constants.identifierHex,
      Constants.ancillaryData,
      Constants.currency,
      Constants.customBond
    );
    handleCustomBondSet(customBondEvent);

    // Step 3: Create RequestPrice event
    const requestPriceEvent = createRequestPriceEvent(
      Constants.requester,
      Constants.identifierHex,
      Constants.timestamp,
      Constants.ancillaryData,
      Constants.currency,
      Constants.reward,
      Constants.finalFee
    );
    handleOptimisticRequestPrice(requestPriceEvent);

    const requestId = Constants.identifierString
      .concat("-")
      .concat(Constants.timestamp.toString())
      .concat("-")
      .concat(Constants.ancillaryData);

    const priceRequestEntity = OptimisticPriceRequest.load(requestId);

    assert.assertTrue(priceRequestEntity !== null, "OptimisticPriceRequest entity should be created");

    if (priceRequestEntity === null) {
      return;
    }

    assert.stringEquals(priceRequestEntity.identifier, Constants.identifierString, "Identifier should match");
    assert.bigIntEquals(priceRequestEntity.time, BigInt.fromI32(Constants.timestamp), "Timestamp should match");
    assert.bytesEquals(
      Bytes.fromHexString(priceRequestEntity.ancillaryData),
      Bytes.fromHexString(Constants.ancillaryData),
      "Ancillary data should match"
    );
    assert.addressEquals(
      Address.fromBytes(priceRequestEntity.requester),
      Address.fromString(Constants.requester),
      "Requester should match"
    );
    assert.addressEquals(
      Address.fromBytes(priceRequestEntity.currency),
      Address.fromString(Constants.currency),
      "Currency should match"
    );
    assert.bigIntEquals(priceRequestEntity.reward, BigInt.fromI32(Constants.reward), "Reward should match");
    assert.bigIntEquals(priceRequestEntity.finalFee, BigInt.fromI32(Constants.finalFee), "Final fee should match");

    // Assert custom values are applied
    assert.bigIntEquals(
      priceRequestEntity.customLiveness!,
      BigInt.fromI32(Constants.customLiveness),
      "Custom liveness should be applied to RequestPrice"
    );
    assert.bigIntEquals(
      priceRequestEntity.bond!,
      BigInt.fromI32(Constants.customBond),
      "Custom bond should be applied to RequestPrice"
    );

    log.info("Created OptimisticPriceRequest entity: {}", [priceRequestEntity.id]);
    log.info("Custom Liveness: {}", [priceRequestEntity.customLiveness!.toString()]);
    log.info("Custom Bond: {}", [priceRequestEntity.bond!.toString()]);
    log.info("Custom Bond Currency: {}", [priceRequestEntity.currency!.toHexString()]);
    log.info("State: {}", [priceRequestEntity.state!]);
  });

  test("Custom bond and liveness are applied to RequestPrice entity at PROPOSE time", () => {
    mockGetState(
      Constants.requester,
      Constants.identifierHex,
      Constants.timestamp,
      Constants.ancillaryData,
      State.Requested
    );
    // Step 1: Create RequestPrice event
    const requestPriceEvent = createRequestPriceEvent(
      Constants.requester,
      Constants.identifierHex,
      Constants.timestamp,
      Constants.ancillaryData,
      Constants.currency,
      Constants.reward,
      Constants.finalFee
    );
    handleOptimisticRequestPrice(requestPriceEvent);

    // Step 2: Set custom liveness
    const customLivenessEvent = createCustomLivenessSetEvent(
      Constants.managedRequestId,
      Constants.requester,
      Constants.identifierHex,
      Constants.ancillaryData,
      Constants.customLiveness
    );
    handleCustomLivenessSet(customLivenessEvent);
    // Step 3: Set custom bond
    const customBondEvent = createCustomBondSetEvent(
      Constants.managedRequestId,
      Constants.requester,
      Constants.identifierHex,
      Constants.ancillaryData,
      Constants.currency_2,
      Constants.customBond_2
    );
    handleCustomBondSet(customBondEvent);

    mockGetState(
      Constants.requester,
      Constants.identifierHex,
      Constants.timestamp,
      Constants.ancillaryData,
      State.Proposed
    );

    // Step 4: Create ProposePrice event
    const proposePriceEvent = createProposePriceEvent(
      Constants.requester,
      Constants.requester,
      Constants.identifierHex,
      Constants.timestamp,
      Constants.ancillaryData,
      1,
      Constants.timestamp + 3600,
      Constants.currency
    );
    handleOptimisticProposePrice(proposePriceEvent);

    const requestId = Constants.identifierString
      .concat("-")
      .concat(Constants.timestamp.toString())
      .concat("-")
      .concat(Constants.ancillaryData);

    const priceRequestEntity = OptimisticPriceRequest.load(requestId);

    assert.assertTrue(priceRequestEntity !== null, "OptimisticPriceRequest entity should be created");

    if (priceRequestEntity === null) {
      return;
    }

    // Assert custom values are applied
    assert.addressEquals(
      Address.fromBytes(priceRequestEntity.currency),
      Address.fromString(Constants.currency_2),
      "Currency should match"
    );

    assert.bigIntEquals(
      priceRequestEntity.bond!,
      BigInt.fromI32(Constants.customBond_2),
      "Custom bond should be applied to RequestPrice"
    );

    assert.bigIntEquals(
      priceRequestEntity.customLiveness!,
      BigInt.fromI32(Constants.customLiveness),
      "Custom liveness should be applied to RequestPrice"
    );

    log.info("Created OptimisticPriceRequest entity: {}", [priceRequestEntity.id]);
    log.info("Custom Liveness: {}", [priceRequestEntity.customLiveness!.toString()]);
    log.info("State: {}", [priceRequestEntity.state!]);
    log.info("Custom Bond: {}", [priceRequestEntity.bond!.toString()]);
    log.info("Custom Bond Currency: {}", [priceRequestEntity.currency!.toHexString()]);
  });
});
