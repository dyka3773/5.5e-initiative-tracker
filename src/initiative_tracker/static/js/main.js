import { createTableController } from "./initiativeTable.js";

const body = document.getElementById("combatant-body");
const rowTemplate = document.getElementById("row-template");
const addRowButton = document.getElementById("add-row-btn");
const sortButton = document.getElementById("sort-btn");
const clearButton = document.getElementById("clear-btn");
const clearMenuButton = document.getElementById("clear-menu-btn");
const clearMenu = document.getElementById("clear-menu");

function rollD20() {
  return Math.floor(Math.random() * 20) + 1;
}

function getInitiativeModifierFromButton(button) {
  const rawModifier = button.dataset.modifier;
  const modifier = Number.parseInt(rawModifier ?? "0", 10);
  return Number.isNaN(modifier) ? 0 : modifier;
}

function setCombatantType(row, type) {
  if (!(row instanceof HTMLTableRowElement)) {
    return;
  }

  const resolvedType = type === "pc" ? "pc" : "npc";
  row.dataset.combatantType = resolvedType;

  const toggleButton = row.querySelector("[data-type-toggle]");
  if (toggleButton instanceof HTMLButtonElement) {
    const isPc = resolvedType === "pc";
    toggleButton.setAttribute("aria-pressed", String(isPc));
    toggleButton.setAttribute(
      "aria-label",
      isPc ? "Marked as player character" : "Marked as non-player character",
    );
    const tooltipText = isPc
      ? "PC: this row is kept when you use Clear Table. Click to mark as NPC."
      : "NPC: this row is removed by Clear Table. Click to keep it.";
    toggleButton.dataset.tooltip = tooltipText;
    toggleButton.removeAttribute("title");
  }
}

function setupRollActions(bodyNode) {
  bodyNode.addEventListener("click", (event) => {
    const target = event.target;

    if (!(target instanceof Element)) {
      return;
    }

    const row = target.closest("tr");
    const toggleButton = target.closest("[data-type-toggle]");

    if (toggleButton instanceof HTMLButtonElement && row instanceof HTMLTableRowElement) {
      const nextType = row.dataset.combatantType === "pc" ? "npc" : "pc";
      setCombatantType(row, nextType);
      toggleButton.blur();
      return;
    }

    const rollButton = target.closest(".roll-btn");
    if (!(rollButton instanceof HTMLButtonElement)) {
      return;
    }

    const initiativeInput = row?.querySelector(".initiative-input");

    if (initiativeInput instanceof HTMLInputElement) {
      const rollIcon = rollButton.querySelector(".roll-btn-icon");
      if (rollIcon instanceof HTMLElement) {
        rollIcon.classList.remove("is-rolling");
        // Force layout so rapid clicks restart the animation each time.
        void rollIcon.offsetWidth;
        rollIcon.classList.add("is-rolling");
      }

      const modifier = getInitiativeModifierFromButton(rollButton);
      initiativeInput.value = String(rollD20() + modifier);
      initiativeInput.dispatchEvent(new Event("input", { bubbles: true }));
      rollButton.blur();
    }
  });

  bodyNode.addEventListener("animationend", (event) => {
    const target = event.target;
    if (target instanceof HTMLElement && target.classList.contains("roll-btn-icon")) {
      target.classList.remove("is-rolling");
    }
  });
}

if (
  body instanceof HTMLTableSectionElement &&
  rowTemplate instanceof HTMLTemplateElement &&
  addRowButton instanceof HTMLButtonElement &&
  sortButton instanceof HTMLButtonElement &&
  clearButton instanceof HTMLButtonElement &&
  clearMenuButton instanceof HTMLButtonElement &&
  clearMenu instanceof HTMLDivElement
) {
  const table = createTableController(body, rowTemplate);
  setupRollActions(body);

  function closeClearMenu() {
    clearMenu.classList.add("hidden");
    clearMenuButton.setAttribute("aria-expanded", "false");
  }

  function openClearMenu() {
    clearMenu.classList.remove("hidden");
    clearMenuButton.setAttribute("aria-expanded", "true");
  }

  function toggleClearMenu() {
    if (clearMenu.classList.contains("hidden")) {
      openClearMenu();
      return;
    }
    closeClearMenu();
  }

  addRowButton.addEventListener("click", table.addRow);
  sortButton.addEventListener("click", table.sortRowsByInitiative);
  clearButton.addEventListener("click", () => {
    table.clearTable("npcs");
    closeClearMenu();
  });
  clearMenuButton.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleClearMenu();
  });
  clearMenu.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const mode = target.getAttribute("data-clear-mode");
    if (mode === "all" || mode === "npcs" || mode === "pcs") {
      table.clearTable(mode);
      closeClearMenu();
    }
  });

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Node)) {
      return;
    }

    if (!clearMenu.contains(target) && !clearMenuButton.contains(target)) {
      closeClearMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeClearMenu();
    }
  });

  table.addInitialRows();

  body.querySelectorAll("tr").forEach((row) => {
    if (row instanceof HTMLTableRowElement) {
      setCombatantType(row, row.dataset.combatantType);
    }
  });
}
