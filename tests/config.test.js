const test = require("node:test");
const assert = require("node:assert/strict");

const config = require("../src/lib/config.js");

test("sanitizeActions normalizes ids and retains valid actions", () => {
  const result = config.sanitizeActions([
    {
      label: "Finance",
      destinationEmail: "finance@example.com",
      requirePdfAttachment: true
    },
    {
      label: "Finance",
      destinationEmail: "backup@example.com",
      requirePdfAttachment: false
    }
  ]);

  assert.deepEqual(result.errors, []);
  assert.equal(result.actions.length, 2);
  assert.equal(result.actions[0].id, "finance");
  assert.equal(result.actions[1].id, "finance-2");
  assert.equal(result.actions[0].requirePdfAttachment, true);
});

test("saveConfig rejects invalid entries", async () => {
  const storageArea = {
    async set() {
      throw new Error("set should not be called");
    }
  };

  await assert.rejects(
    config.saveConfig(storageArea, [
      {
        label: "Invalid",
        destinationEmail: "not-an-email",
        requirePdfAttachment: false
      }
    ]),
    /destination email is invalid/
  );
});

test("loadConfig filters invalid stored actions", async () => {
  const storageArea = {
    async get() {
      return {
        [config.STORAGE_KEY]: [
          {
            label: "Ops",
            destinationEmail: "ops@example.com",
            requirePdfAttachment: false
          },
          {
            label: "",
            destinationEmail: "broken",
            requirePdfAttachment: false
          }
        ]
      };
    }
  };

  const loaded = await config.loadConfig(storageArea);

  assert.equal(loaded.actions.length, 1);
  assert.equal(loaded.actions[0].label, "Ops");
  assert.match(loaded.issues[0], /label is required|destination email is invalid/);
});
