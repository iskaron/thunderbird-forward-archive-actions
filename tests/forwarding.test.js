const test = require("node:test");
const assert = require("node:assert/strict");

const forwarding = require("../src/lib/forwarding.js");

function createMessenger(overrides = {}) {
  const calls = [];
  const messengerApi = {
    messageDisplay: {
      async getDisplayedMessages() {
        return {
          messages: [{ id: 42 }]
        };
      }
    },
    messages: {
      async continueList() {
        return {
          messages: []
        };
      },
      async listAttachments() {
        return [];
      },
      async archive(messageIds) {
        calls.push(["archive", messageIds]);
      }
    },
    compose: {
      async beginForward(messageId, forwardType) {
        calls.push(["beginForward", messageId, forwardType]);
        return { id: 99 };
      },
      async setComposeDetails(tabId, details) {
        calls.push(["setComposeDetails", tabId, details]);
      },
      async sendMessage(tabId, options) {
        calls.push(["sendMessage", tabId, options]);
        return { id: "send-result" };
      }
    }
  };

  return {
    calls,
    messengerApi: {
      ...messengerApi,
      ...overrides,
      messageDisplay: {
        ...messengerApi.messageDisplay,
        ...(overrides.messageDisplay || {})
      },
      messages: {
        ...messengerApi.messages,
        ...(overrides.messages || {})
      },
      compose: {
        ...messengerApi.compose,
        ...(overrides.compose || {})
      }
    }
  };
}

test("hasPdfAttachment matches by content type or file extension", () => {
  assert.equal(
    forwarding.hasPdfAttachment([
      { name: "invoice.PDF", contentType: "application/octet-stream" }
    ]),
    true
  );
  assert.equal(
    forwarding.hasPdfAttachment([
      { name: "notes.txt", contentType: "text/plain" }
    ]),
    false
  );
});

test("executeConfiguredAction forwards and archives when PDF requirement is met", async () => {
  const { messengerApi, calls } = createMessenger({
    messages: {
      async listAttachments() {
        return [{ name: "invoice.pdf", contentType: "application/pdf" }];
      }
    }
  });

  const result = await forwarding.executeConfiguredAction(messengerApi, 7, {
    id: "finance",
    label: "Finance",
    destinationEmail: "finance@example.com",
    requirePdfAttachment: true
  });

  assert.equal(result.forwarded, true);
  assert.deepEqual(calls, [
    ["beginForward", 42, "forwardInline"],
    ["setComposeDetails", 99, { to: ["finance@example.com"] }],
    ["sendMessage", 99, { mode: "default" }],
    ["archive", [42]]
  ]);
});

test("executeConfiguredAction archives without forwarding when PDF is missing", async () => {
  const { messengerApi, calls } = createMessenger();

  const result = await forwarding.executeConfiguredAction(messengerApi, 7, {
    id: "finance",
    label: "Finance",
    destinationEmail: "finance@example.com",
    requirePdfAttachment: true
  });

  assert.equal(result.forwarded, false);
  assert.deepEqual(calls, [["archive", [42]]]);
});

test("executeConfiguredAction does not archive when sendMessage fails", async () => {
  const { messengerApi, calls } = createMessenger({
    messages: {
      async listAttachments() {
        return [{ name: "invoice.pdf", contentType: "application/pdf" }];
      }
    },
    compose: {
      async sendMessage(tabId, options) {
        calls.push(["sendMessage", tabId, options]);
        throw new Error("smtp failure");
      }
    }
  });

  await assert.rejects(
    forwarding.executeConfiguredAction(messengerApi, 7, {
      id: "finance",
      label: "Finance",
      destinationEmail: "finance@example.com",
      requirePdfAttachment: false
    }),
    /smtp failure/
  );

  assert.deepEqual(calls, [
    ["beginForward", 42, "forwardInline"],
    ["setComposeDetails", 99, { to: ["finance@example.com"] }],
    ["sendMessage", 99, { mode: "default" }]
  ]);
});

test("getDisplayedMessages continues paged results when the first page is empty", async () => {
  const { messengerApi } = createMessenger({
    messageDisplay: {
      async getDisplayedMessages() {
        return {
          id: "page-1",
          messages: []
        };
      }
    },
    messages: {
      async continueList(listId) {
        assert.equal(listId, "page-1");
        return {
          messages: [{ id: 55 }]
        };
      }
    }
  });

  const messages = await forwarding.getDisplayedMessages(messengerApi, 9);

  assert.deepEqual(messages, [{ id: 55 }]);
});
