import { MIN_SEARCH_LENGTH, SEARCH_DEBOUNCE_MS } from "./constants.js";
import { fetchMonster, searchMonstersByName } from "./monsterApi.js";
import { debounce } from "./utils.js";

function formatRollButtonLabel(modifier) {
  if (modifier > 0) {
    return `d20+${modifier}`;
  }

  if (modifier < 0) {
    return `d20${modifier}`;
  }

  return "d20";
}

function updateRollButton(rollButton, modifier) {
  rollButton.dataset.modifier = String(modifier);
  rollButton.textContent = formatRollButtonLabel(modifier);
  rollButton.setAttribute("aria-label", `Roll ${formatRollButtonLabel(modifier)}`);
}

function hideSuggestionList(state) {
  state.items = [];
  state.selectedIndex = -1;
  state.list.innerHTML = "";
  state.list.classList.add("hidden");
  state.input.setAttribute("aria-expanded", "false");
}

function showSuggestionList(state) {
  state.list.classList.remove("hidden");
  state.input.setAttribute("aria-expanded", "true");
}

function updateSuggestionDirection(state) {
  const card = state.input.closest(".tracker-card");
  if (!(card instanceof HTMLElement)) {
    state.list.classList.remove("open-up");
    return;
  }

  const inputRect = state.input.getBoundingClientRect();
  const cardRect = card.getBoundingClientRect();
  const estimatedHeight = Math.min(state.items.length, 4) * 36 + 16;
  const gap = 8;
  const spaceBelow = cardRect.bottom - inputRect.bottom;
  const spaceAbove = inputRect.top - cardRect.top;
  const shouldOpenUp = spaceBelow < estimatedHeight + gap && spaceAbove > spaceBelow;

  state.list.classList.toggle("open-up", shouldOpenUp);
}

function selectSuggestionAtIndex(state, index) {
  if (!state.items.length) {
    return;
  }

  state.selectedIndex = Math.max(0, Math.min(index, state.items.length - 1));

  Array.from(state.list.querySelectorAll("button")).forEach((button, buttonIndex) => {
    const isSelected = buttonIndex === state.selectedIndex;
    button.classList.toggle("selected", isSelected);
    button.setAttribute("aria-selected", String(isSelected));
  });
}

function renderSuggestions(state) {
  state.list.innerHTML = "";

  if (!state.items.length) {
    hideSuggestionList(state);
    return;
  }

  state.items.forEach((monster) => {
    const item = document.createElement("li");
    item.setAttribute("role", "option");

    const button = document.createElement("button");
    button.type = "button";
    button.textContent = monster.name;
    button.className = "monster-suggestion-btn";
    button.dataset.index = monster.index;
    button.setAttribute("aria-selected", "false");

    button.addEventListener("mousedown", (event) => {
      event.preventDefault();
    });

    button.addEventListener("click", () => {
      state.applyMonster(monster);
    });

    item.appendChild(button);
    state.list.appendChild(item);
  });

  updateSuggestionDirection(state);
  showSuggestionList(state);
  selectSuggestionAtIndex(state, 0);
}

export function setupMonsterAutocomplete(row) {
  const nameInput = row.querySelector(".name-input");
  const hpInput = row.querySelector(".hp-input");
  const acInput = row.querySelector(".ac-input");
  const nameCell = row.querySelector(".name-cell");
  const initiativeInput = row.querySelector(".initiative-input");
  const rollButton = row.querySelector(".roll-btn");

  if (!(nameInput instanceof HTMLInputElement) || !(hpInput instanceof HTMLInputElement) || !(acInput instanceof HTMLInputElement) || !(nameCell instanceof HTMLTableCellElement) || !(initiativeInput instanceof HTMLInputElement) || !(rollButton instanceof HTMLButtonElement)) {
    return;
  }

  updateRollButton(rollButton, 0);

  const list = document.createElement("ul");
  list.className = "monster-suggestions hidden";
  list.setAttribute("role", "listbox");
  nameCell.appendChild(list);

  nameInput.setAttribute("aria-autocomplete", "list");
  nameInput.setAttribute("aria-expanded", "false");

  const state = {
    input: nameInput,
    list,
    items: [],
    selectedIndex: -1,
    latestRequestId: 0,
    applyMonster: async (monster) => {
      try {
        const details = await fetchMonster(monster.index);
        nameInput.value = details.name || monster.name || nameInput.value;

        if (Number.isFinite(details.hit_points)) {
          hpInput.value = String(details.hit_points);
        }

        if (Number.isFinite(details.armor_class)) {
          acInput.value = String(details.armor_class);
        }

        const modifier = Number.isFinite(details.initiative_modifier)
          ? details.initiative_modifier
          : 0;
        initiativeInput.value = "0";
        updateRollButton(rollButton, modifier);
      } catch (error) {
        // Keep the current row state if the API call fails.
      }

      hideSuggestionList(state);
    },
  };

  const runSearch = debounce(async () => {
    const query = nameInput.value.trim();
    if (query.length < MIN_SEARCH_LENGTH) {
      hideSuggestionList(state);
      return;
    }

    const requestId = state.latestRequestId + 1;
    state.latestRequestId = requestId;

    try {
      const results = await searchMonstersByName(query);
      if (requestId !== state.latestRequestId) {
        return;
      }

      state.items = results;
      renderSuggestions(state);
    } catch (error) {
      if (requestId === state.latestRequestId) {
        hideSuggestionList(state);
      }
    }
  }, SEARCH_DEBOUNCE_MS);

  nameInput.addEventListener("input", runSearch);

  nameInput.addEventListener("keydown", (event) => {
    if (state.list.classList.contains("hidden") || !state.items.length) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      selectSuggestionAtIndex(state, state.selectedIndex + 1);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      selectSuggestionAtIndex(state, state.selectedIndex - 1);
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const chosenMonster = state.items[state.selectedIndex] || state.items[0];
      if (chosenMonster) {
        state.applyMonster(chosenMonster);
      }
      return;
    }

    if (event.key === "Escape") {
      hideSuggestionList(state);
    }
  });

  nameInput.addEventListener("blur", () => {
    window.setTimeout(() => {
      hideSuggestionList(state);
    }, 120);
  });
}
