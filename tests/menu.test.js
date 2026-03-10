const test = require("node:test");
const assert = require("node:assert/strict");

const menu = require("../src/lib/menu.js");

test("resolveInteractionMode uses popup when no actions exist", () => {
  const mode = menu.resolveInteractionMode([]);

  assert.equal(mode.mode, "popup");
  assert.equal(mode.popup, menu.POPUP_PATH);
  assert.equal(mode.directActionId, null);
});

test("resolveInteractionMode executes directly for exactly one action", () => {
  const mode = menu.resolveInteractionMode([
    {
      id: "finance",
      label: "Finance",
      destinationEmail: "finance@example.com"
    }
  ]);

  assert.equal(mode.mode, "direct");
  assert.equal(mode.popup, "");
  assert.equal(mode.directActionId, "finance");
});

test("resolveInteractionMode uses popup for multiple actions", () => {
  const mode = menu.resolveInteractionMode([
    { id: "finance", label: "Finance", destinationEmail: "finance@example.com" },
    { id: "sales", label: "Sales", destinationEmail: "sales@example.com" }
  ]);

  assert.equal(mode.mode, "popup");
  assert.equal(mode.popup, menu.POPUP_PATH);
  assert.equal(mode.directActionId, null);
});

test("formatActionLabel notes PDF-only actions", () => {
  assert.equal(
    menu.formatActionLabel({
      label: "Finance",
      requirePdfAttachment: true
    }),
    "Finance (PDF required)"
  );
  assert.equal(
    menu.formatActionLabel({
      label: "Sales",
      requirePdfAttachment: false
    }),
    "Sales"
  );
});
