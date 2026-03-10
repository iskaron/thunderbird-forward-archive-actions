(function initForwardingModule(globalScope) {
  "use strict";

  function hasPdfAttachment(attachments) {
    return (attachments || []).some((attachment) => {
      const contentType = String(attachment && attachment.contentType || "")
        .trim()
        .toLowerCase();
      const name = String(attachment && attachment.name || "")
        .trim()
        .toLowerCase();

      return contentType === "application/pdf" || name.endsWith(".pdf");
    });
  }

  async function getDisplayedMessages(messengerApi, tabId) {
    const firstPage = await messengerApi.messageDisplay.getDisplayedMessages(
      tabId
    );

    if (!firstPage) {
      return [];
    }

    const messages = Array.isArray(firstPage.messages)
      ? [...firstPage.messages]
      : [];
    let nextPageId = firstPage.id;

    while (messages.length === 0 && nextPageId) {
      const nextPage = await messengerApi.messages.continueList(nextPageId);

      if (!nextPage) {
        break;
      }

      if (Array.isArray(nextPage.messages)) {
        messages.push(...nextPage.messages);
      }

      nextPageId = nextPage.id;
    }

    return messages;
  }

  async function getDisplayedMessage(messengerApi, tabId) {
    const messages = await getDisplayedMessages(messengerApi, tabId);
    return messages[0] || null;
  }

  async function evaluateActionForMessage(messengerApi, messageId, action) {
    const attachments = await messengerApi.messages.listAttachments(messageId);
    const pdfAttached = hasPdfAttachment(attachments);

    return {
      attachments,
      pdfAttached,
      shouldForward: !action.requirePdfAttachment || pdfAttached
    };
  }

  async function forwardMessage(messengerApi, messageId, action) {
    const composeTab = await messengerApi.compose.beginForward(
      messageId,
      "forwardInline"
    );
    const composeTabId = composeTab && (composeTab.id || composeTab.tabId);

    if (typeof composeTabId !== "number") {
      throw new Error("Thunderbird did not return a compose tab id.");
    }

    await messengerApi.compose.setComposeDetails(composeTabId, {
      to: [action.destinationEmail]
    });

    const sendResult = await messengerApi.compose.sendMessage(composeTabId, {
      mode: "default"
    });

    return {
      composeTabId,
      sendResult
    };
  }

  async function archiveMessage(messengerApi, messageId) {
    await messengerApi.messages.archive([messageId]);
  }

  async function executeConfiguredAction(messengerApi, tabId, action) {
    if (!action) {
      throw new Error("The selected forwarding action does not exist.");
    }

    const message = await getDisplayedMessage(messengerApi, tabId);

    if (!message || typeof message.id !== "number") {
      throw new Error("No message is currently displayed.");
    }

    const evaluation = await evaluateActionForMessage(
      messengerApi,
      message.id,
      action
    );

    if (evaluation.shouldForward) {
      await forwardMessage(messengerApi, message.id, action);
    }

    await archiveMessage(messengerApi, message.id);

    return {
      messageId: message.id,
      forwarded: evaluation.shouldForward,
      archived: true,
      pdfAttached: evaluation.pdfAttached
    };
  }

  const api = {
    hasPdfAttachment,
    getDisplayedMessages,
    getDisplayedMessage,
    evaluateActionForMessage,
    forwardMessage,
    archiveMessage,
    executeConfiguredAction
  };

  globalScope.TbForwardArchiveForwarding = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
