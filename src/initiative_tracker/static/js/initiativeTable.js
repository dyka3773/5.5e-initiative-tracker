import { INITIAL_ROWS } from "./constants.js";
import { setupMonsterAutocomplete } from "./monsterAutocomplete.js";

export function createTableController(body, rowTemplate) {
  function createRow() {
    const row = rowTemplate.content.firstElementChild.cloneNode(true);
    setupMonsterAutocomplete(row);
    return row;
  }

  function addRow() {
    body.appendChild(createRow());
  }

  function addInitialRows() {
    for (let index = 0; index < INITIAL_ROWS; index += 1) {
      addRow();
    }
  }

  function clearTable() {
    body.innerHTML = "";
    addInitialRows();
  }

  function extractInitiativeValue(row) {
    const input = row.querySelector(".initiative-input");
    const value = Number.parseInt(input.value, 10);
    return Number.isNaN(value) ? Number.NEGATIVE_INFINITY : value;
  }

  function sortRowsByInitiative() {
    const rows = Array.from(body.querySelectorAll("tr"));
    rows.sort((left, right) => extractInitiativeValue(right) - extractInitiativeValue(left));
    rows.forEach((row) => body.appendChild(row));
  }

  return {
    addInitialRows,
    addRow,
    clearTable,
    sortRowsByInitiative,
  };
}
