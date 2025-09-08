import {
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll,
  assert,
  log,
  createMockedFunction,
} from "matchstick-as/assembly/index";
import { handleCustomLivenessSet, handleCustomBondSet } from "../../src/mappings/managedOracleV2";
import { handleOptimisticRequestPrice } from "../../src/mappings/optimisticOracleV2";
import {
  createCustomLivenessSetEvent,
  createCustomBondSetEvent,
  createRequestPriceEvent,
  mockGetState,
  State,
} from "./utils";
import { CustomLiveness, CustomBond, OptimisticPriceRequest } from "../../generated/schema";
import { BigInt, Bytes, Address } from "@graphprotocol/graph-ts";

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/developer/matchstick/#tests-structure-0-5-0

describe("CustomLiveness Handler Tests", () => {
  afterAll(() => {
    clearStore();
  });

  test("handleCustomLivenessSet creates CustomLiveness entity correctly", () => {
    const timestamp = 1757284669;
    const identifier = "0x00000000000000000000000000000000005945535f4f525f4e4f5f5155455259"; // YES_OR_NO_QUERY
    const currency = "0x9b4A302A548c7e313c2b74C461db7b84d3074A84";
    const bond = 1000000;
    const ancillaryData = "0x5945535f4f525f4e4f5f5155455259";
    const requester = "0x9A8f92a830A5cB89a3816e3D267CB7791c16b04D";
    const customLiveness = 1757286231;
    const managedRequestId = "0x8aed060a05dfbb279705824d8b544fc58a63ebc4a1c26380cbd90297c0a7e33c";
    // Create test event
    const customLivenessEvent = createCustomLivenessSetEvent(
      managedRequestId,
      requester,
      identifier,
      ancillaryData,
      customLiveness
    );

    // Call the handler
    handleCustomLivenessSet(customLivenessEvent);

    // Create the expected managedRequestId (this should match the logic in the handler)
    const managedRequestIdActual = customLivenessEvent.params.managedRequestId.toHexString();

    // Load the created entity
    const customLivenessEntity = CustomLiveness.load(managedRequestIdActual);

    // Assert the entity was created
    assert.assertTrue(customLivenessEntity !== null, "CustomLiveness entity should be created");

    if (customLivenessEntity === null) {
      return;
    }
    // Assert the entity properties
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

    // Print the entity for debugging
    log.info("Created CustomLiveness entity: {}", [customLivenessEntity.id]);
    log.info("Requester: {}", [customLivenessEntity.requester.toHexString()]);
    log.info("Identifier: {}", [customLivenessEntity.identifier]);
    log.info("Ancillary Data: {}", [customLivenessEntity.ancillaryData]);
    log.info("Custom Liveness: {}", [customLivenessEntity.customLiveness.toString()]);
  });
});

describe("CustomBond Handler Tests", () => {
  afterAll(() => {
    clearStore();
  });

  test("handleCustomBondSet creates CustomBond entity correctly", () => {
    const managedRequestId = "0x8aed060a05dfbb279705824d8b544fc58a63ebc4a1c26380cbd90297c0a7e33c";
    const requester = "0x9A8f92a830A5cB89a3816e3D267CB7791c16b04D";
    const identifier = "0x00000000000000000000000000000000005945535f4f525f4e4f5f5155455259"; // YES_OR_NO_QUERY
    const ancillaryData = "0x5945535f4f525f4e4f5f5155455259";
    const currency = "0x9b4A302A548c7e313c2b74C461db7b84d3074A84";
    const customBond = 2000000;

    // Create test event
    const customBondEvent = createCustomBondSetEvent(
      managedRequestId,
      requester,
      identifier,
      ancillaryData,
      currency,
      customBond
    );

    // Call the handler
    handleCustomBondSet(customBondEvent);

    // Create the expected managedRequestId (this should match the logic in the handler)
    const managedRequestIdActual = customBondEvent.params.managedRequestId.toHexString();

    // Load the created entity
    const customBondEntity = CustomBond.load(managedRequestIdActual);

    // Assert the entity was created
    assert.assertTrue(customBondEntity !== null, "CustomBond entity should be created");

    if (customBondEntity === null) {
      return;
    }

    // Assert the entity properties
    assert.addressEquals(
      Address.fromBytes(customBondEntity.requester),
      Address.fromString(requester),
      "Requester should match"
    );
    assert.stringEquals(customBondEntity.identifier, "YES_OR_NO_QUERY", "Identifier should match");
    assert.bytesEquals(
      Bytes.fromHexString(customBondEntity.ancillaryData),
      Bytes.fromHexString(ancillaryData),
      "Ancillary data should match"
    );
    assert.bigIntEquals(customBondEntity.customBond, BigInt.fromI32(customBond), "Custom bond should match");

    // Print the entity for debugging
    log.info("Created CustomBond entity: {}", [customBondEntity.id]);
    log.info("Requester: {}", [customBondEntity.requester.toHexString()]);
    log.info("Identifier: {}", [customBondEntity.identifier]);
    log.info("Ancillary Data: {}", [customBondEntity.ancillaryData]);
    log.info("Custom Bond: {}", [customBondEntity.customBond.toString()]);
  });
});

describe("Comprehensive Custom Settings and RequestPrice Tests", () => {
  afterAll(() => {
    clearStore();
  });

  test("Custom bond and liveness are applied to RequestPrice entity", () => {
    // Test data
    const timestamp = 1757284669;
    const identifier = "0x00000000000000000000000000000000005945535f4f525f4e4f5f5155455259"; // YES_OR_NO_QUERY
    const currency = "0x9b4A302A548c7e313c2b74C461db7b84d3074A84";
    const ancillaryData = "0x5945535f4f525f4e4f5f5155455259";
    const requester = "0x9A8f92a830A5cB89a3816e3D267CB7791c16b04D";
    const customLiveness = 1757286231;
    const customBond = 2000000;
    const reward = 1000000;
    const finalFee = 500000;

    // Calculate managedRequestId (same logic as in the handlers)
    const managedRequestId = "0x8aed060a05dfbb279705824d8b544fc58a63ebc4a1c26380cbd90297c0a7e33c";

    mockGetState(requester, identifier, timestamp, ancillaryData, State.Requested);
    // Step 1: Set custom liveness
    const customLivenessEvent = createCustomLivenessSetEvent(
      managedRequestId,
      requester,
      identifier,
      ancillaryData,
      customLiveness
    );
    handleCustomLivenessSet(customLivenessEvent);

    // Step 2: Set custom bond
    const customBondEvent = createCustomBondSetEvent(
      managedRequestId,
      requester,
      identifier,
      ancillaryData,
      currency,
      customBond
    );
    handleCustomBondSet(customBondEvent);

    // Step 3: Create RequestPrice event
    const requestPriceEvent = createRequestPriceEvent(
      requester,
      identifier,
      timestamp,
      ancillaryData,
      currency,
      reward,
      finalFee
    );
    handleOptimisticRequestPrice(requestPriceEvent);

    // Step 4: Verify that the RequestPrice entity has the custom values applied
    // The mapping code uses event.params.identifier.toString() which returns "YES_OR_NO_QUERY"
    const requestId = "YES_OR_NO_QUERY".concat("-").concat(timestamp.toString()).concat("-").concat(ancillaryData);

    const priceRequestEntity = OptimisticPriceRequest.load(requestId);

    // Assert the entity was created
    assert.assertTrue(priceRequestEntity !== null, "OptimisticPriceRequest entity should be created");

    if (priceRequestEntity === null) {
      return;
    }

    // Assert basic RequestPrice properties
    assert.stringEquals(priceRequestEntity.identifier, "YES_OR_NO_QUERY", "Identifier should match");
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
    assert.bigIntEquals(
      priceRequestEntity.bond!,
      BigInt.fromI32(customBond),
      "Custom bond should be applied to RequestPrice"
    );

    // Print the entity for debugging
    log.info("Created OptimisticPriceRequest entity: {}", [priceRequestEntity.id]);
    log.info("Custom Liveness: {}", [priceRequestEntity.customLiveness!.toString()]);
    log.info("Custom Bond: {}", [priceRequestEntity.bond!.toString()]);
    log.info("State: {}", [priceRequestEntity.state!]);
  });
});
