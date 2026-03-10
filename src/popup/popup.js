(function initPopup(globalScope) {
  "use strict";

  const messengerApi = globalScope.messenger || globalScope.browser;
  const configApi = globalScope.TbForwardArchiveConfig;
  const actionsContainer = document.getElementById("actions-container");
  const openSettingsButton = document.getElementById("open-settings-button");
  const statusMessage = document.getElementById("status-message");

  function setStatus(message) {
    statusMessage.textContent = message || "";
  }

  function describeAction(action) {
    return action.requirePdfAttachment
      ? `${action.label} (PDF required)`
      : action.label;
  }

  function renderEmptyState() {
    const emptyState = document.createElement("div");
    const message = document.createElement("p");

    emptyState.className = "popup__empty-state";
    message.className = "popup__hint";
    message.textContent =
      "No actions are configured yet. Open the add-on preferences to add one.";

    emptyState.appendChild(message);
    actionsContainer.appendChild(emptyState);
  }

  async function executeAction(actionId) {
    setStatus("");

    try {
      await messengerApi.runtime.sendMessage({
        type: "executeConfiguredAction",
        actionId
      });
      globalScope.close();
    } catch (error) {
      setStatus(error.message || "Failed to execute the selected action.");
    }
  }

  function renderActions(actions) {
    actionsContainer.textContent = "";

    if (actions.length === 0) {
      renderEmptyState();
      return;
    }

    actions.forEach((action) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = describeAction(action);
      button.addEventListener("click", () => {
        executeAction(action.id).catch((error) => {
          setStatus(error.message || "Failed to execute the selected action.");
        });
      });
      actionsContainer.appendChild(button);
    });
  }

  async function init() {
    const config = await configApi.loadConfig(messengerApi.storage.local);
    renderActions(config.actions);
  }

  openSettingsButton.addEventListener("click", async () => {
    setStatus("");

    try {
      await messengerApi.runtime.openOptionsPage();
      globalScope.close();
    } catch (error) {
      setStatus(error.message || "Failed to open settings.");
    }
  });

  init().catch((error) => {
    console.error("Failed to initialize the popup", error);
    setStatus("Failed to load actions.");
  });
})(typeof globalThis !== "undefined" ? globalThis : this);
