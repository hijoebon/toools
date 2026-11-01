import assert from "node:assert/strict";
import test from "node:test";
import { catalogReadDecision, connectionFailureKind } from "./catalog-smoke";

test("connection failures stay as safe kinds", () => {
  assert.equal(connectionFailureKind("connection is insecure (try using `sslmode=require`)"), "insecure");
  assert.equal(connectionFailureKind("password authentication failed for user \"neondb_owner\""), "password");
  assert.equal(connectionFailureKind("channel binding required, but SSL not in use"), "channel-binding");
  assert.equal(connectionFailureKind("self-signed certificate"), "certificate");
  assert.equal(connectionFailureKind("connect ECONNREFUSED 127.0.0.1:5432"), "network");
  assert.equal(connectionFailureKind("something unexpected"), "other");
});

test("catalog smoke passes only when the known slug exists and the missing slug does not", () => {
  assert.equal(catalogReadDecision("ChatGPT", null), "pass");
  assert.equal(catalogReadDecision(null, null), "known-missing");
  assert.equal(catalogReadDecision("ChatGPT", "Missing"), "missing-present");
});
