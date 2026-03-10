(function initMenuModule(globalScope) {
  "use strict";

  const POPUP_PATH = "src/popup/popup.html";

  function resolveInteractionMode(actions) {
    const actionCount = Array.isArray(actions) ? actions.length : 0;

    if (actionCount === 1) {
      return {
        mode: "direct",
        popup: "",
        directActionId: actions[0].id
      };
    }

    return {
      mode: "popup",
      popup: POPUP_PATH,
      directActionId: null
    };
  }

  function formatActionLabel(action) {
    if (!action) {
      return "";
    }

    return action.requirePdfAttachment
      ? `${action.label} (PDF required)`
      : action.label;
  }

  const api = {
    POPUP_PATH,
    resolveInteractionMode,
    formatActionLabel
  };

  globalScope.TbForwardArchiveMenu = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
