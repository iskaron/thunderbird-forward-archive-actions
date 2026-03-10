(function initConfigModule(globalScope) {
  "use strict";

  const STORAGE_KEY = "forwardArchiveActions";
  const DEFAULT_CONFIG = Object.freeze({
    actions: []
  });

  function normalizeWhitespace(value) {
    return String(value || "").trim();
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeWhitespace(email));
  }

  function slugify(value) {
    const slug = normalizeWhitespace(value)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    return slug || "action";
  }

  function ensureUniqueId(candidateId, usedIds) {
    let uniqueId = candidateId;
    let suffix = 2;

    while (usedIds.has(uniqueId)) {
      uniqueId = `${candidateId}-${suffix}`;
      suffix += 1;
    }

    usedIds.add(uniqueId);
    return uniqueId;
  }

  function normalizeAction(rawAction, index, usedIds) {
    const label = normalizeWhitespace(rawAction && rawAction.label);
    const destinationEmail = normalizeWhitespace(
      rawAction && rawAction.destinationEmail
    );
    const proposedId = normalizeWhitespace(rawAction && rawAction.id);
    const baseId = proposedId || slugify(label || `action-${index + 1}`);

    return {
      id: ensureUniqueId(baseId, usedIds),
      label: label || `Action ${index + 1}`,
      destinationEmail,
      requirePdfAttachment: Boolean(
        rawAction && rawAction.requirePdfAttachment
      )
    };
  }

  function validateAction(action, index) {
    const errors = [];

    if (!normalizeWhitespace(action.label)) {
      errors.push(`Action ${index + 1}: label is required.`);
    }

    if (!isValidEmail(action.destinationEmail)) {
      errors.push(`Action ${index + 1}: destination email is invalid.`);
    }

    return errors;
  }

  function sanitizeActions(rawActions) {
    const usedIds = new Set();
    const sourceActions = Array.isArray(rawActions) ? rawActions : [];
    const normalizedActions = [];
    const errors = [];

    sourceActions.forEach((rawAction, index) => {
      const normalized = normalizeAction(rawAction, index, usedIds);
      const validationErrors = validateAction(normalized, index);

      if (validationErrors.length > 0) {
        errors.push(...validationErrors);
        return;
      }

      normalizedActions.push(normalized);
    });

    return {
      actions: normalizedActions,
      errors
    };
  }

  async function loadConfig(storageArea) {
    const result = await storageArea.get(STORAGE_KEY);
    const storedActions =
      result && Object.prototype.hasOwnProperty.call(result, STORAGE_KEY)
        ? result[STORAGE_KEY]
        : DEFAULT_CONFIG.actions;
    const sanitized = sanitizeActions(storedActions);

    return {
      actions: sanitized.actions,
      issues: sanitized.errors
    };
  }

  async function saveConfig(storageArea, rawActions) {
    const sanitized = sanitizeActions(rawActions);

    if (sanitized.errors.length > 0) {
      throw new Error(sanitized.errors.join(" "));
    }

    await storageArea.set({
      [STORAGE_KEY]: sanitized.actions
    });

    return {
      actions: sanitized.actions,
      issues: []
    };
  }

  function createEmptyAction(index) {
    return {
      id: `draft-action-${index + 1}`,
      label: "",
      destinationEmail: "",
      requirePdfAttachment: false
    };
  }

  const api = {
    STORAGE_KEY,
    DEFAULT_CONFIG,
    isValidEmail,
    normalizeAction,
    sanitizeActions,
    validateAction,
    loadConfig,
    saveConfig,
    createEmptyAction
  };

  globalScope.TbForwardArchiveConfig = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
