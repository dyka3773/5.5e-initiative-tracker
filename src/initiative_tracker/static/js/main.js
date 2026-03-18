import { createTableController } from "./initiativeTable.js";

const body = document.getElementById("combatant-body");
const rowTemplate = document.getElementById("row-template");
const addRowButton = document.getElementById("add-row-btn");
const sortButton = document.getElementById("sort-btn");
const clearButton = document.getElementById("clear-btn");

function rollD20() {
  return Math.floor(Math.random() * 20) + 1;
}

function setupRollActions(bodyNode) {
  bodyNode.addEventListener("click", (event) => {
    const target = event.target;

    if (!(target instanceof HTMLElement) || !target.classList.contains("roll-btn")) {
      return;
    }

    const row = target.closest("tr");
    const initiativeInput = row?.querySelector(".initiative-input");

    if (initiativeInput instanceof HTMLInputElement) {
      initiativeInput.value = String(rollD20());
      initiativeInput.dispatchEvent(new Event("input", { bubbles: true }));
    }
  });
}

if (
  body instanceof HTMLTableSectionElement &&
  rowTemplate instanceof HTMLTemplateElement &&
  addRowButton instanceof HTMLButtonElement &&
  sortButton instanceof HTMLButtonElement &&
  clearButton instanceof HTMLButtonElement
) {
  const table = createTableController(body, rowTemplate);
  setupRollActions(body);

  addRowButton.addEventListener("click", table.addRow);
  sortButton.addEventListener("click", table.sortRowsByInitiative);
  clearButton.addEventListener("click", table.clearTable);

  table.addInitialRows();
}
