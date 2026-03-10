(function initBackground(globalScope) {
  "use strict";

  const messengerApi = globalScope.messenger || globalScope.browser;
  const configApi = globalScope.TbForwardArchiveConfig;
  const menuApi = globalScope.TbForwardArchiveMenu;
  const forwardingApi = globalScope.TbForwardArchiveForwarding;
  let currentDirectActionId = null;

  async function showNotification(title, message) {
    const notificationId = `forward-archive-${Date.now()}`;

    await messengerApi.notifications.create(notificationId, {
      type: "basic",
      title,
      message,
      iconUrl: "src/icons/action-64.svg"
    });
  }

  async function refreshActionPresentation() {
    const config = await configApi.loadConfig(messengerApi.storage.local);
    const interactionMode = menuApi.resolveInteractionMode(config.actions);

    currentDirectActionId = interactionMode.directActionId;

    await messengerApi.messageDisplayAction.setPopup({
      popup: interactionMode.popup
    });

    if (config.actions.length === 1) {
      const singleAction = config.actions[0];

      await messengerApi.messageDisplayAction.setTitle({
        title: `Forward and archive with ${singleAction.label}`
      });
      await messengerApi.messageDisplayAction.setLabel({
        label: singleAction.label
      });
      return config.actions;
    }

    await messengerApi.messageDisplayAction.setTitle({
      title: "Forward and archive"
    });
    await messengerApi.messageDisplayAction.setLabel({
      label: "Forward+Archive"
    });

    return config.actions;
  }

  async function handleConfiguredAction(actionId, tabId) {
    const config = await configApi.loadConfig(messengerApi.storage.local);
    const action = config.actions.find((entry) => entry.id === actionId);

    if (!action) {
      await showNotification(
        "Forward+Archive",
        "The selected action no longer exists. Please reopen the action chooser."
      );
      await refreshActionPresentation();
      return;
    }

    try {
      const result = await forwardingApi.executeConfiguredAction(
        messengerApi,
        tabId,
        action
      );

      if (result.forwarded) {
        await showNotification(
          "Forwarded and archived",
          `${action.label} forwarded the message to ${action.destinationEmail} and archived it.`
        );
        return;
      }

      await showNotification(
        "Archived without forwarding",
        `${action.label} archived the message because no PDF attachment was present.`
      );
    } catch (error) {
      console.error("Forward+Archive action failed", error);
      await showNotification(
        "Forwarding failed",
        `${action.label} could not forward the message, so it was not archived.`
      );
    }
  }

  messengerApi.runtime.onInstalled.addListener(() => {
    refreshActionPresentation().catch((error) => {
      console.error("Failed to refresh action state after installation", error);
    });
  });

  messengerApi.runtime.onStartup.addListener(() => {
    refreshActionPresentation().catch((error) => {
      console.error("Failed to refresh action state on startup", error);
    });
  });

  messengerApi.storage.onChanged.addListener((changes, areaName) => {
    if (
      areaName !== "local" ||
      !Object.prototype.hasOwnProperty.call(changes, configApi.STORAGE_KEY)
    ) {
      return;
    }

    refreshActionPresentation().catch((error) => {
      console.error("Failed to refresh action state after settings change", error);
    });
  });

  messengerApi.messageDisplayAction.onClicked.addListener((tab) => {
    if (!currentDirectActionId) {
      return;
    }

    const tabId = tab && (tab.id || tab.tabId);

    handleConfiguredAction(currentDirectActionId, tabId).catch((error) => {
      console.error("Unexpected direct action failure", error);
    });
  });

  messengerApi.runtime.onMessage.addListener((message) => {
    if (!message || message.type !== "executeConfiguredAction") {
      return undefined;
    }

    return handleConfiguredAction(message.actionId, message.tabId);
  });

  refreshActionPresentation().catch((error) => {
    console.error("Failed to build initial action state", error);
  });
})(typeof globalThis !== "undefined" ? globalThis : this);
