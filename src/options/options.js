(function initOptionsPage(globalScope) {
  "use strict";

  const messengerApi = globalScope.messenger || globalScope.browser;
  const configApi = globalScope.TbForwardArchiveConfig;
  const form = document.getElementById("config-form");
  const actionsList = document.getElementById("actions-list");
  const addActionButton = document.getElementById("add-action-button");
  const actionTemplate = document.getElementById("action-template");
  const statusMessage = document.getElementById("status-message");
  let draftActions = [];

  function setStatus(message, isError) {
    statusMessage.textContent = message || "";
    statusMessage.classList.toggle("status-message--error", Boolean(isError));
  }

  function buildActionCard(action, index) {
    const fragment = actionTemplate.content.cloneNode(true);
    const card = fragment.querySelector(".action-card");
    const title = fragment.querySelector(".action-card__title");
    const labelInput = fragment.querySelector('input[name="label"]');
    const destinationInput = fragment.querySelector(
      'input[name="destinationEmail"]'
    );
    const requirePdfInput = fragment.querySelector(
      'input[name="requirePdfAttachment"]'
    );
    const removeButton = fragment.querySelector(".remove-action-button");

    title.textContent = `Action ${index + 1}`;
    card.dataset.index = String(index);
    labelInput.value = action.label || "";
    destinationInput.value = action.destinationEmail || "";
    requirePdfInput.checked = Boolean(action.requirePdfAttachment);

    labelInput.addEventListener("input", (event) => {
      draftActions[index].label = event.target.value;
    });

    destinationInput.addEventListener("input", (event) => {
      draftActions[index].destinationEmail = event.target.value;
    });

    requirePdfInput.addEventListener("change", (event) => {
      draftActions[index].requirePdfAttachment = event.target.checked;
    });

    removeButton.addEventListener("click", () => {
      draftActions.splice(index, 1);
      render();
    });

    return fragment;
  }

  function render() {
    actionsList.textContent = "";

    if (draftActions.length === 0) {
      const emptyState = document.createElement("p");
      emptyState.textContent =
        "No actions configured yet. Add one to populate the message header menu.";
      actionsList.appendChild(emptyState);
      return;
    }

    draftActions.forEach((action, index) => {
      actionsList.appendChild(buildActionCard(action, index));
    });
  }

  async function load() {
    const config = await configApi.loadConfig(messengerApi.storage.local);
    draftActions = config.actions.length
      ? config.actions.map((action) => ({ ...action }))
      : [];

    render();
  }

  addActionButton.addEventListener("click", () => {
    draftActions.push(configApi.createEmptyAction(draftActions.length));
    render();
    setStatus("");
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
      const saved = await configApi.saveConfig(
        messengerApi.storage.local,
        draftActions
      );

      draftActions = saved.actions.map((action) => ({ ...action }));
      render();
      setStatus("Settings saved.");
    } catch (error) {
      setStatus(error.message || "Failed to save settings.", true);
    }
  });

  load().catch((error) => {
    console.error("Failed to load extension settings", error);
    setStatus("Failed to load saved settings.", true);
  });
})(typeof globalThis !== "undefined" ? globalThis : this);
