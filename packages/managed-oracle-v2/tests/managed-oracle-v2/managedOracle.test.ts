import { describe, test, clearStore, assert, log, afterEach, beforeEach, dataSourceMock } from "matchstick-as/assembly/index";
import { handleCustomLivenessSet, handleCustomBondSet, handleRoleGranted, handleRoleRevoked } from "../../src/mappings/managedOracleV2";
import { handleOptimisticProposePrice, handleOptimisticRequestPrice } from "../../src/mappings/optimisticOracleV2";
import { createCustomBondIdFromEvent } from "../../src/utils/helpers/managedOracleV2";
import { createOptimisticPriceRequestId } from "../../src/utils/helpers/optimisticOracle";
import {
  createCustomLivenessSetEvent,
  createCustomBondSetEvent,
  createProposePriceEvent,
  createRequestPriceEvent,
  createRoleGrantedEvent,
  createRoleRevokedEvent,
  mockGetState,
  mockGetRequestNewABI,
  mockGetRequestNewABIReverts,
  mockGetRequestLegacyABI,
  mockGetRequestLegacyABIReverts,
  State,
  RESOLVER_ROLE,
} from "./utils";
import { CustomLiveness, CustomBond, OptimisticPriceRequest, Resolver, ResolverHistory } from "../../generated/schema";
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

    const requestId = createOptimisticPriceRequestId(
      Bytes.fromHexString(identifierHex) as Bytes,
      BigInt.fromI32(timestamp),
      Bytes.fromHexString(ancillaryData) as Bytes
    );

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

    const requestId = createOptimisticPriceRequestId(
      Bytes.fromHexString(identifierHex) as Bytes,
      BigInt.fromI32(timestamp),
      Bytes.fromHexString(ancillaryData) as Bytes
    );

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

    const requestId = createOptimisticPriceRequestId(
      Bytes.fromHexString(identifierHex) as Bytes,
      BigInt.fromI32(timestamp),
      Bytes.fromHexString(ancillaryData) as Bytes
    );

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

describe("Resolver Tracking", () => {
  afterEach(() => {
    clearStore();
  });

  test("handleRoleGranted creates Resolver entity when RESOLVER_ROLE is granted", () => {
    const resolverAddress = "0x1234567890123456789012345678901234567890";
    const sender = "0x9A8f92a830A5cB89a3816e3D267CB7791c16b04D";

    const roleGrantedEvent = createRoleGrantedEvent(RESOLVER_ROLE, resolverAddress, sender);
    handleRoleGranted(roleGrantedEvent);

    const resolver = Resolver.load(resolverAddress.toLowerCase());

    assert.assertTrue(resolver !== null, "Resolver entity should be created");

    if (resolver === null) {
      return;
    }

    assert.assertTrue(resolver.isActive, "Resolver should be active");
    assert.bytesEquals(
      resolver.address,
      Address.fromString(resolverAddress),
      "Resolver address should match"
    );
    assert.assertTrue(resolver.addedAt !== null, "addedAt should be set");
    assert.assertTrue(resolver.addedTx !== null, "addedTx should be set");

    log.info("Created Resolver entity: {}", [resolver.id]);
    log.info("isActive: {}", [resolver.isActive.toString()]);
  });

  test("handleRoleGranted creates ResolverHistory entry", () => {
    const resolverAddress = "0x1234567890123456789012345678901234567890";
    const sender = "0x9A8f92a830A5cB89a3816e3D267CB7791c16b04D";

    const roleGrantedEvent = createRoleGrantedEvent(RESOLVER_ROLE, resolverAddress, sender);
    handleRoleGranted(roleGrantedEvent);

    const historyId = roleGrantedEvent.transaction.hash.toHexString() + "-" + roleGrantedEvent.logIndex.toString();
    const history = ResolverHistory.load(historyId);

    assert.assertTrue(history !== null, "ResolverHistory entity should be created");

    if (history === null) {
      return;
    }

    assert.stringEquals(history.action, "added", "Action should be 'added'");
    assert.bytesEquals(
      history.resolver,
      Address.fromString(resolverAddress),
      "Resolver address should match"
    );

    log.info("Created ResolverHistory entity: {}", [history.id]);
    log.info("action: {}", [history.action]);
  });

  test("handleRoleRevoked updates Resolver entity to inactive", () => {
    const resolverAddress = "0x1234567890123456789012345678901234567890";
    const sender = "0x9A8f92a830A5cB89a3816e3D267CB7791c16b04D";

    // First grant the role
    const roleGrantedEvent = createRoleGrantedEvent(RESOLVER_ROLE, resolverAddress, sender);
    handleRoleGranted(roleGrantedEvent);

    // Then revoke the role
    const roleRevokedEvent = createRoleRevokedEvent(RESOLVER_ROLE, resolverAddress, sender);
    handleRoleRevoked(roleRevokedEvent);

    const resolver = Resolver.load(resolverAddress.toLowerCase());

    assert.assertTrue(resolver !== null, "Resolver entity should exist");

    if (resolver === null) {
      return;
    }

    assert.assertTrue(!resolver.isActive, "Resolver should be inactive after revocation");
    assert.assertTrue(resolver.removedAt !== null, "removedAt should be set");
    assert.assertTrue(resolver.removedTx !== null, "removedTx should be set");

    log.info("Updated Resolver entity: {}", [resolver.id]);
    log.info("isActive: {}", [resolver.isActive.toString()]);
  });

  test("handleRoleGranted ignores non-RESOLVER_ROLE events", () => {
    const resolverAddress = "0x1234567890123456789012345678901234567890";
    const sender = "0x9A8f92a830A5cB89a3816e3D267CB7791c16b04D";
    // Some other role hash (not RESOLVER_ROLE)
    const otherRole = Bytes.fromHexString("0x0000000000000000000000000000000000000000000000000000000000000001");

    const roleGrantedEvent = createRoleGrantedEvent(otherRole, resolverAddress, sender);
    handleRoleGranted(roleGrantedEvent);

    const resolver = Resolver.load(resolverAddress.toLowerCase());

    assert.assertTrue(resolver === null, "Resolver entity should NOT be created for non-RESOLVER_ROLE");

    log.info("Correctly ignored non-RESOLVER_ROLE event", []);
  });

  test("handleRoleRevoked creates ResolverHistory entry", () => {
    const resolverAddress = "0x1234567890123456789012345678901234567890";
    const sender = "0x9A8f92a830A5cB89a3816e3D267CB7791c16b04D";

    // First grant the role
    const roleGrantedEvent = createRoleGrantedEvent(RESOLVER_ROLE, resolverAddress, sender);
    handleRoleGranted(roleGrantedEvent);

    // Then revoke the role
    const roleRevokedEvent = createRoleRevokedEvent(RESOLVER_ROLE, resolverAddress, sender);
    handleRoleRevoked(roleRevokedEvent);

    const historyId = roleRevokedEvent.transaction.hash.toHexString() + "-" + roleRevokedEvent.logIndex.toString();
    const history = ResolverHistory.load(historyId);

    assert.assertTrue(history !== null, "ResolverHistory entity should be created for revocation");

    if (history === null) {
      return;
    }

    assert.stringEquals(history.action, "removed", "Action should be 'removed'");

    log.info("Created ResolverHistory entity for revocation: {}", [history.id]);
    log.info("action: {}", [history.action]);
  });
});

describe("Dual-ABI getRequest fallback (L2 chains)", () => {
  // Common test variables
  const requester = "0x9A8f92a830A5cB89a3816e3D267CB7791c16b04D";
  const identifierHex = "0x00000000000000000000000000000000005945535f4f525f4e4f5f5155455259";
  const ancillaryData = "0x5945535f4f525f4e4f5f5155455259";
  const currency = "0x9b4A302A548c7e313c2b74C461db7b84d3074A84";
  const reward = 1000000;
  const finalFee = 500000;
  const timestamp = 1757284669;
  const mockBond = 5000000;
  const mockCustomLiveness = 7200;

  beforeEach(() => {
    // Set network to matic (Polygon) so the getRequest branch is exercised
    dataSourceMock.setNetwork("matic");
  });

  afterEach(() => {
    clearStore();
    dataSourceMock.resetValues();
  });

  test("New ABI getRequest succeeds - populates bond, eventBased, customLiveness from contract", () => {
    mockGetState(requester, identifierHex, timestamp, ancillaryData, State.Requested);
    mockGetRequestNewABI(requester, identifierHex, timestamp, ancillaryData, mockBond, true, mockCustomLiveness);

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

    const requestId = createOptimisticPriceRequestId(
      Bytes.fromHexString(identifierHex) as Bytes,
      BigInt.fromI32(timestamp),
      Bytes.fromHexString(ancillaryData) as Bytes
    );

    const entity = OptimisticPriceRequest.load(requestId);
    assert.assertTrue(entity !== null, "Entity should be created");
    if (entity === null) return;

    assert.bigIntEquals(entity.bond!, BigInt.fromI32(mockBond), "Bond should be populated from new ABI getRequest");
    assert.assertTrue(entity.eventBased!, "eventBased should be true from new ABI getRequest");
    assert.bigIntEquals(
      entity.customLiveness!,
      BigInt.fromI32(mockCustomLiveness),
      "customLiveness should be populated from new ABI getRequest"
    );
  });

  test("Legacy ABI fallback when new ABI reverts - populates bond, eventBased, customLiveness", () => {
    mockGetState(requester, identifierHex, timestamp, ancillaryData, State.Requested);
    // New ABI reverts (e.g. contract from opt-in-early-resolution without proposalTime)
    mockGetRequestNewABIReverts(requester, identifierHex, timestamp, ancillaryData);
    // Legacy ABI succeeds
    mockGetRequestLegacyABI(requester, identifierHex, timestamp, ancillaryData, mockBond, true, mockCustomLiveness);

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

    const requestId = createOptimisticPriceRequestId(
      Bytes.fromHexString(identifierHex) as Bytes,
      BigInt.fromI32(timestamp),
      Bytes.fromHexString(ancillaryData) as Bytes
    );

    const entity = OptimisticPriceRequest.load(requestId);
    assert.assertTrue(entity !== null, "Entity should be created");
    if (entity === null) return;

    assert.bigIntEquals(entity.bond!, BigInt.fromI32(mockBond), "Bond should be populated from legacy ABI fallback");
    assert.assertTrue(entity.eventBased!, "eventBased should be true from legacy ABI fallback");
    assert.bigIntEquals(
      entity.customLiveness!,
      BigInt.fromI32(mockCustomLiveness),
      "customLiveness should be populated from legacy ABI fallback"
    );
  });

  test("Both ABIs fail - request created without contract-derived settings", () => {
    mockGetState(requester, identifierHex, timestamp, ancillaryData, State.Requested);
    // Both ABIs revert
    mockGetRequestNewABIReverts(requester, identifierHex, timestamp, ancillaryData);
    mockGetRequestLegacyABIReverts(requester, identifierHex, timestamp, ancillaryData);

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

    const requestId = createOptimisticPriceRequestId(
      Bytes.fromHexString(identifierHex) as Bytes,
      BigInt.fromI32(timestamp),
      Bytes.fromHexString(ancillaryData) as Bytes
    );

    const entity = OptimisticPriceRequest.load(requestId);
    assert.assertTrue(entity !== null, "Entity should still be created even when both ABIs fail");
    if (entity === null) return;

    // Basic event data should still be populated
    assert.addressEquals(
      Address.fromBytes(entity.requester),
      Address.fromString(requester),
      "Requester should still be set from event params"
    );
    assert.bigIntEquals(entity.reward, BigInt.fromI32(reward), "Reward should still be set from event params");

    // Contract-derived settings should be null (not populated)
    assert.assertTrue(entity.bond === null, "Bond should be null when both ABIs fail");
    assert.assertTrue(entity.eventBased === null, "eventBased should be null when both ABIs fail");
    assert.assertTrue(entity.customLiveness === null, "customLiveness should be null when both ABIs fail");
  });

  test("Custom bond/liveness entities override contract getRequest values", () => {
    const managedRequestId = "0x8aed060a05dfbb279705824d8b544fc58a63ebc4a1c26380cbd90297c0a7e33c";
    const customBondAmount = 9999999;
    const customLivenessAmount = 86400;

    mockGetState(requester, identifierHex, timestamp, ancillaryData, State.Requested);
    // Contract returns some values via getRequest
    mockGetRequestNewABI(requester, identifierHex, timestamp, ancillaryData, mockBond, false, mockCustomLiveness);

    // Set custom bond and liveness entities BEFORE the request
    const customBondEvent = createCustomBondSetEvent(
      managedRequestId,
      requester,
      identifierHex,
      ancillaryData,
      currency,
      customBondAmount
    );
    handleCustomBondSet(customBondEvent);

    const customLivenessEvent = createCustomLivenessSetEvent(
      managedRequestId,
      requester,
      identifierHex,
      ancillaryData,
      customLivenessAmount
    );
    handleCustomLivenessSet(customLivenessEvent);

    // Now fire the RequestPrice event
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

    const requestId = createOptimisticPriceRequestId(
      Bytes.fromHexString(identifierHex) as Bytes,
      BigInt.fromI32(timestamp),
      Bytes.fromHexString(ancillaryData) as Bytes
    );

    const entity = OptimisticPriceRequest.load(requestId);
    assert.assertTrue(entity !== null, "Entity should be created");
    if (entity === null) return;

    // Custom bond entity should override the getRequest value
    assert.bigIntEquals(
      entity.bond!,
      BigInt.fromI32(customBondAmount),
      "Custom bond entity should override contract getRequest bond"
    );
    // Custom liveness entity should override the getRequest value
    assert.bigIntEquals(
      entity.customLiveness!,
      BigInt.fromI32(customLivenessAmount),
      "Custom liveness entity should override contract getRequest customLiveness"
    );
  });
});
