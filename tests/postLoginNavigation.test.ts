import assert from "node:assert/strict";

import {
  DEFAULT_POST_LOGIN_NAV,
  getPostLoginNavigation,
} from "../src/appNavigation.ts";

const runTest = (name: string, fn: () => void) => {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
};

runTest("Post-login navigation always opens accounting review requisitions", () => {
  assert.deepEqual(getPostLoginNavigation(), {
    activeTab: "ACCOUNTING",
    activeSubTab: "Review Requisitions",
  });
  assert.deepEqual(DEFAULT_POST_LOGIN_NAV, getPostLoginNavigation());
});
