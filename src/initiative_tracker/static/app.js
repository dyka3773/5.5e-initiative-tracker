const body = document.getElementById("combatant-body");
const rowTemplate = document.getElementById("row-template");
const addRowButton = document.getElementById("add-row-btn");
const sortButton = document.getElementById("sort-btn");
const clearButton = document.getElementById("clear-btn");
const INITIAL_ROWS = 5;

function createRow() {
  return rowTemplate.content.firstElementChild.cloneNode(true);
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

function rollD20() {
  return Math.floor(Math.random() * 20) + 1;
}

body.addEventListener("click", (event) => {
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

addRowButton.addEventListener("click", addRow);
sortButton.addEventListener("click", sortRowsByInitiative);
clearButton.addEventListener("click", clearTable);

addInitialRows();
