import { describe, test, clearStore, assert, log, afterEach } from "matchstick-as/assembly/index";
import { handleCustomLivenessSet, handleCustomBondSet } from "../../src/mappings/managedOracleV2";
import { handleOptimisticProposePrice, handleOptimisticRequestPrice } from "../../src/mappings/optimisticOracleV2";
import { createCustomBondIdFromEvent } from "../../src/utils/helpers/managedOracleV2";
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

describe("Managed OOv2", () => {
  afterEach(() => {
    clearStore();
  });

  test("handleCustomLivenessSet creates CustomLiveness entity correctly", () => {
    // Test variables
    const managedRequestId = "0x8aed060a05dfbb279705824d8b544fc58a63ebc4a1c26380cbd90297c0a7e33c";
    const requester = "0x9A8f92a830A5cB89a3816e3D267CB7791c16b04D";
    const identifierHex = "0x00000000000000000000000000000000005945535f4f525f4e4f5f5155455259"; //  "YES_OR_NO_QUERY"
    const ancillaryData = "0x5945535f4f525f4e4f5f5155455259";
    const customLiveness = 1757286231;

    const customLivenessEvent = createCustomLivenessSetEvent(
      managedRequestId,
      requester,
      identifierHex,
      ancillaryData,
      customLiveness
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
      Address.fromString(requester),
      "Requester should match"
    );
    assert.stringEquals(customLivenessEntity.identifier, "YES_OR_NO_QUERY", "Identifier should match");
    assert.bytesEquals(
      Bytes.fromHexString(customLivenessEntity.ancillaryData),
      Bytes.fromHexString(ancillaryData),
      "Ancillary data should match"
    );
    assert.bigIntEquals(
      customLivenessEntity.customLiveness,
      BigInt.fromI32(customLiveness),
      "Custom liveness should match"
    );

    log.info("Created CustomLiveness entity: {}", [customLivenessEntity.id]);
    log.info("Requester: {}", [customLivenessEntity.requester.toHexString()]);
    log.info("Identifier: {}", [customLivenessEntity.identifier]);
    log.info("Ancillary Data: {}", [customLivenessEntity.ancillaryData]);
    log.info("Custom Liveness: {}", [customLivenessEntity.customLiveness.toString()]);
  });

  test("handleCustomBondSet creates CustomBond entity correctly", () => {
    // Test variables
    const managedRequestId = "0x8aed060a05dfbb279705824d8b544fc58a63ebc4a1c26380cbd90297c0a7e33c";
    const requester = "0x9A8f92a830A5cB89a3816e3D267CB7791c16b04D";
    const identifierHex = "0x00000000000000000000000000000000005945535f4f525f4e4f5f5155455259"; //  "YES_OR_NO_QUERY"
    const identifierString = "YES_OR_NO_QUERY";
    const ancillaryData = "0x5945535f4f525f4e4f5f5155455259";
    const currency = "0x9b4A302A548c7e313c2b74C461db7b84d3074A84";
    const customBond = 2000000;

    const customBondEvent = createCustomBondSetEvent(
      managedRequestId,
      requester,
      identifierHex,
      ancillaryData,
      currency,
      customBond
    );

    handleCustomBondSet(customBondEvent);

    // Generate the same ID that the mapping function uses
    const customBondId = createCustomBondIdFromEvent(customBondEvent);

    const customBondEntity = CustomBond.load(customBondId);

    assert.assertTrue(customBondEntity !== null, "CustomBond entity should be created");

    if (customBondEntity === null) {
      return;
    }

    assert.addressEquals(
      Address.fromBytes(customBondEntity.requester),
      Address.fromString(requester),
      "Requester should match"
    );
    assert.stringEquals(customBondEntity.identifier, identifierString, "Identifier should match");
    assert.bytesEquals(
      Bytes.fromHexString(customBondEntity.ancillaryData),
      Bytes.fromHexString(ancillaryData),
      "Ancillary data should match"
    );
    assert.bigIntEquals(customBondEntity.customBond, BigInt.fromI32(customBond), "Custom bond should match");

    log.info("Created CustomBond entity: {}", [customBondEntity.id]);
    log.info("Requester: {}", [customBondEntity.requester.toHexString()]);
    log.info("Identifier: {}", [customBondEntity.identifier]);
    log.info("Ancillary Data: {}", [customBondEntity.ancillaryData]);
    log.info("Custom Bond: {}", [customBondEntity.customBond.toString()]);
  });

  test("Custom bond and liveness are applied to RequestPrice entity at REQUEST time", () => {
    // Test variables
    const managedRequestId = "0x8aed060a05dfbb279705824d8b544fc58a63ebc4a1c26380cbd90297c0a7e33c";
    const requester = "0x9A8f92a830A5cB89a3816e3D267CB7791c16b04D";
    const identifierHex = "0x00000000000000000000000000000000005945535f4f525f4e4f5f5155455259"; //  "YES_OR_NO_QUERY"
    const identifierString = "YES_OR_NO_QUERY";
    const ancillaryData = "0x5945535f4f525f4e4f5f5155455259";
    const currency = "0x9b4A302A548c7e313c2b74C461db7b84d3074A84";
    const customBond = 2000000;
    const customLiveness = 1757286231;
    const reward = 1000000;
    const finalFee = 500000;
    const timestamp = 1757284669;

    mockGetState(requester, identifierHex, timestamp, ancillaryData, State.Requested);
    // Step 1: Set custom liveness
    const customLivenessEvent = createCustomLivenessSetEvent(
      managedRequestId,
      requester,
      identifierHex,
      ancillaryData,
      customLiveness
    );
    handleCustomLivenessSet(customLivenessEvent);

    // Step 2: Set custom bond
    const customBondEvent = createCustomBondSetEvent(
      managedRequestId,
      requester,
      identifierHex,
      ancillaryData,
      currency,
      customBond
    );
    handleCustomBondSet(customBondEvent);

    // Step 3: Create RequestPrice event
    const requestPriceEvent = createRequestPriceEvent(
      requester,
      identifierHex,
      timestamp,
      ancillaryData,
      currency,
      reward,
      finalFee
    );
    handleOptimisticRequestPrice(requestPriceEvent);

    const requestId = identifierString.concat("-").concat(timestamp.toString()).concat("-").concat(ancillaryData);

    const priceRequestEntity = OptimisticPriceRequest.load(requestId);

    assert.assertTrue(priceRequestEntity !== null, "OptimisticPriceRequest entity should be created");

    if (priceRequestEntity === null) {
      return;
    }

    assert.stringEquals(priceRequestEntity.identifier, identifierString, "Identifier should match");
    assert.bigIntEquals(priceRequestEntity.time, BigInt.fromI32(timestamp), "Timestamp should match");
    assert.bytesEquals(
      Bytes.fromHexString(priceRequestEntity.ancillaryData),
      Bytes.fromHexString(ancillaryData),
      "Ancillary data should match"
    );
    assert.addressEquals(
      Address.fromBytes(priceRequestEntity.requester),
      Address.fromString(requester),
      "Requester should match"
    );
    assert.addressEquals(
      Address.fromBytes(priceRequestEntity.currency),
      Address.fromString(currency),
      "Currency should match"
    );
    assert.bigIntEquals(priceRequestEntity.reward, BigInt.fromI32(reward), "Reward should match");
    assert.bigIntEquals(priceRequestEntity.finalFee, BigInt.fromI32(finalFee), "Final fee should match");

    // Assert custom values are applied
    assert.bigIntEquals(
      priceRequestEntity.customLiveness!,
      BigInt.fromI32(customLiveness),
      "Custom liveness should be applied to RequestPrice"
    );

    // Check if bond is set
    assert.assertTrue(priceRequestEntity.bond !== null, "Bond should not be null - custom bond should be applied");
    if (priceRequestEntity.bond !== null) {
      assert.bigIntEquals(
        priceRequestEntity.bond!,
        BigInt.fromI32(customBond),
        "Custom bond should be applied to RequestPrice"
      );
    }

    log.info("Created OptimisticPriceRequest entity: {}", [priceRequestEntity.id]);
    log.info("Custom Liveness: {}", [priceRequestEntity.customLiveness!.toString()]);
    if (priceRequestEntity.bond !== null) {
      log.info("Custom Bond: {}", [priceRequestEntity.bond!.toString()]);
    }
    log.info("Custom Bond Currency: {}", [priceRequestEntity.currency!.toHexString()]);
    log.info("State: {}", [priceRequestEntity.state!]);
  });

  test("Custom bond currency mismatch - bond not applied when currencies don't match", () => {
    // Test variables
    const managedRequestId = "0x8aed060a05dfbb279705824d8b544fc58a63ebc4a1c26380cbd90297c0a7e33c";
    const requester = "0x9A8f92a830A5cB89a3816e3D267CB7791c16b04D";
    const identifierHex = "0x00000000000000000000000000000000005945535f4f525f4e4f5f5155455259"; //  "YES_OR_NO_QUERY"
    const identifierString = "YES_OR_NO_QUERY";
    const ancillaryData = "0x5945535f4f525f4e4f5f5155455259";
    const currency = "0x9b4A302A548c7e313c2b74C461db7b84d3074A84";
    const customBond = 2000000;
    const customLiveness = 1757286231;
    const reward = 1000000;
    const finalFee = 500000;
    const timestamp = 1757284669;
    const customLiveness_2 = 123456;
    const customBond_2 = 3000000;
    const currency_2 = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";

    mockGetState(requester, identifierHex, timestamp, ancillaryData, State.Requested);
    // Step 1: Create RequestPrice event
    const requestPriceEvent = createRequestPriceEvent(
      requester,
      identifierHex,
      timestamp,
      ancillaryData,
      currency,
      reward,
      finalFee
    );
    handleOptimisticRequestPrice(requestPriceEvent);

    // Step 2: Set custom liveness
    const customLivenessEvent = createCustomLivenessSetEvent(
      managedRequestId,
      requester,
      identifierHex,
      ancillaryData,
      customLiveness
    );
    handleCustomLivenessSet(customLivenessEvent);
    // Step 3: Set custom bond
    const customBondEvent = createCustomBondSetEvent(
      managedRequestId,
      requester,
      identifierHex,
      ancillaryData,
      currency_2,
      customBond_2
    );
    handleCustomBondSet(customBondEvent);

    mockGetState(requester, identifierHex, timestamp, ancillaryData, State.Proposed);

    // Step 4: Create ProposePrice event
    const proposePriceEvent = createProposePriceEvent(
      requester,
      requester,
      identifierHex,
      timestamp,
      ancillaryData,
      1,
      timestamp + 3600,
      currency // Use same currency as original request
    );
    handleOptimisticProposePrice(proposePriceEvent);

    const requestId = identifierString.concat("-").concat(timestamp.toString()).concat("-").concat(ancillaryData);

    const priceRequestEntity = OptimisticPriceRequest.load(requestId);

    assert.assertTrue(priceRequestEntity !== null, "OptimisticPriceRequest entity should be created");

    if (priceRequestEntity === null) {
      return;
    }

    // Assert custom values are applied
    assert.addressEquals(
      Address.fromBytes(priceRequestEntity.currency),
      Address.fromString(currency),
      "Currency should match original request currency"
    );

    // Check if bond is set - since custom bond was set for different currency,
    // it should NOT be applied (currency mismatch)
    assert.assertTrue(
      priceRequestEntity.bond === null,
      "Bond should be null - custom bond should NOT be applied due to currency mismatch"
    );

    assert.bigIntEquals(
      priceRequestEntity.customLiveness!,
      BigInt.fromI32(customLiveness),
      "Custom liveness should be applied to RequestPrice"
    );

    log.info("Created OptimisticPriceRequest entity: {}", [priceRequestEntity.id]);
    log.info("Custom Liveness: {}", [priceRequestEntity.customLiveness!.toString()]);
    log.info("State: {}", [priceRequestEntity.state!]);
    if (priceRequestEntity.bond !== null) {
      log.info("Custom Bond: {}", [priceRequestEntity.bond!.toString()]);
    }
    log.info("Custom Bond Currency: {}", [priceRequestEntity.currency!.toHexString()]);
  });

  test("Custom bond currency matching - only matching currency bond is applied (no currency changes)", () => {
    // Test variables
    const managedRequestId = "0x8aed060a05dfbb279705824d8b544fc58a63ebc4a1c26380cbd90297c0a7e33c";
    const requester = "0x9A8f92a830A5cB89a3816e3D267CB7791c16b04D";
    const identifierHex = "0x00000000000000000000000000000000005945535f4f525f4e4f5f5155455259"; //  "YES_OR_NO_QUERY"
    const identifierString = "YES_OR_NO_QUERY";
    const ancillaryData = "0x5945535f4f525f4e4f5f5155455259";

    // Two different currencies and bond amounts
    const currencyA = "0x9b4A302A548c7e313c2b74C461db7b84d3074A84"; // Token A
    const bondAmountA = 2000000; // Bond amount A for Token A

    const currencyB = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"; // Token B
    const bondAmountB = 3000000; // Bond amount B for Token B

    const reward = 1000000;
    const finalFee = 500000;
    const timestamp = 1757284669;

    mockGetState(requester, identifierHex, timestamp, ancillaryData, State.Requested);

    // Step 1: Set custom bond for Token A with bond amount A
    const customBondEventA = createCustomBondSetEvent(
      managedRequestId,
      requester,
      identifierHex,
      ancillaryData,
      currencyA,
      bondAmountA
    );
    handleCustomBondSet(customBondEventA);

    // Step 2: Set custom bond for Token B with bond amount B
    const customBondEventC = createCustomBondSetEvent(
      managedRequestId,
      requester,
      identifierHex,
      ancillaryData,
      currencyB,
      bondAmountB
    );
    handleCustomBondSet(customBondEventC);

    // Step 3: Create RequestPrice event with Token B as currency
    // This should only apply the custom bond for Token B (bond amount B)
    const requestPriceEvent = createRequestPriceEvent(
      requester,
      identifierHex,
      timestamp,
      ancillaryData,
      currencyB, // Using Token B as currency
      reward,
      finalFee
    );
    handleOptimisticRequestPrice(requestPriceEvent);

    const requestId = identifierString.concat("-").concat(timestamp.toString()).concat("-").concat(ancillaryData);

    const priceRequestEntity = OptimisticPriceRequest.load(requestId);

    assert.assertTrue(priceRequestEntity !== null, "OptimisticPriceRequest entity should be created");

    if (priceRequestEntity === null) {
      return;
    }

    // Verify the request was created with correct basic parameters
    assert.stringEquals(priceRequestEntity.identifier, identifierString, "Identifier should match");
    assert.bigIntEquals(priceRequestEntity.time, BigInt.fromI32(timestamp), "Timestamp should match");
    assert.bytesEquals(
      Bytes.fromHexString(priceRequestEntity.ancillaryData),
      Bytes.fromHexString(ancillaryData),
      "Ancillary data should match"
    );
    assert.addressEquals(
      Address.fromBytes(priceRequestEntity.requester),
      Address.fromString(requester),
      "Requester should match"
    );
    assert.addressEquals(
      Address.fromBytes(priceRequestEntity.currency),
      Address.fromString(currencyB),
      "Currency should be Token C"
    );
    assert.bigIntEquals(priceRequestEntity.reward, BigInt.fromI32(reward), "Reward should match");
    assert.bigIntEquals(priceRequestEntity.finalFee, BigInt.fromI32(finalFee), "Final fee should match");

    // Check if bond is null first
    assert.assertTrue(priceRequestEntity.bond !== null, "Bond should not be null - custom bond should be applied");

    if (priceRequestEntity.bond === null) {
      return;
    }

    // CRITICAL ASSERTION: Only the custom bond for Token B (bond amount B) should be applied
    // The custom bond for Token A (bond amount A) should NOT be applied
    assert.bigIntEquals(
      priceRequestEntity.bond!,
      BigInt.fromI32(bondAmountB), // Should be bond amount B (for Token B)
      "Custom bond should be bond amount B (for Token B), not bond amount A (for Token A)"
    );

    // Verify that the bond amount is NOT the amount set for Token A
    assert.assertTrue(
      !priceRequestEntity.bond!.equals(BigInt.fromI32(bondAmountA)),
      "Custom bond should NOT be bond amount A (for Token A)"
    );

    log.info("Created OptimisticPriceRequest entity: {}", [priceRequestEntity.id]);
    if (priceRequestEntity.bond !== null) {
      log.info("Applied Custom Bond: {} (should be bond amount B for Token B)", [priceRequestEntity.bond!.toString()]);
    }
    log.info("Currency: {} (should be Token B)", [priceRequestEntity.currency!.toHexString()]);
    log.info("State: {}", [priceRequestEntity.state!]);
  });
});
