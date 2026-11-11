/* ==========================================================
   North Star Bakery - preorder-list.js
   Products page feature: filter the menu by category and
   build a pre-order list that is remembered with localStorage.
   ========================================================== */

// Filter buttons and the label each one shows.
const CATEGORY_FILTERS = [
    { value: "all", label: "Everything" },
    { value: "bread", label: "Breads" },
    { value: "pastry", label: "Pastries" },
    { value: "cake", label: "Cakes" },
    { value: "tray", label: "Event Trays" }
];

let preorderList = loadPreorderList();
let activeFilter = loadSavedFilter();

function loadSavedFilter() {
    try {
        const saved = localStorage.getItem(STORAGE_KEYS.menuFilter);
        const isValid = CATEGORY_FILTERS.some(function (filter) {
            return filter.value === saved;
        });
        return isValid ? saved : "all";
    } catch (error) {
        return "all";
    }
}

function saveFilter(value) {
    try {
        localStorage.setItem(STORAGE_KEYS.menuFilter, value);
    } catch (error) {
        // Not critical. The filter just resets next visit.
    }
}

/* ---------- Filter buttons ---------- */
function renderFilterButtons() {
    const container = document.getElementById("menu-filters");
    container.innerHTML = "";

    CATEGORY_FILTERS.forEach(function (filter) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "filter-button";
        button.textContent = filter.label;
        button.setAttribute("aria-pressed", filter.value === activeFilter ? "true" : "false");
        button.addEventListener("click", function () {
            setFilter(filter.value);
        });
        container.appendChild(button);
    });
}

function setFilter(value) {
    activeFilter = value;
    saveFilter(value);
    renderFilterButtons();
    renderMenu();
}

/* ---------- Menu items ---------- */
function getFilteredItems() {
    if (activeFilter === "all") {
        return MENU_ITEMS;
    }
    return MENU_ITEMS.filter(function (item) {
        return item.category === activeFilter;
    });
}

function renderMenu() {
    const menu = document.getElementById("menu-items");
    const items = getFilteredItems();
    menu.innerHTML = "";

    items.forEach(function (item) {
        const li = document.createElement("li");
        li.className = "menu-item";

        const details = document.createElement("span");
        details.innerHTML = "<strong></strong><br>";
        details.querySelector("strong").textContent = item.name;
        details.appendChild(document.createTextNode(formatPrice(item.price)));

        const button = document.createElement("button");
        button.type = "button";
        button.className = "add-button";
        button.textContent = "Add";
        button.setAttribute("aria-label", "Add " + item.name + " to my pre-order list");
        button.addEventListener("click", function () {
            addToList(item.id);
        });

        li.appendChild(details);
        li.appendChild(button);
        menu.appendChild(li);
    });

    document.getElementById("menu-count").textContent =
        "Showing " + items.length + " item" + (items.length === 1 ? "" : "s");
}

/* ---------- Pre-order list ---------- */
function addToList(id) {
    preorderList[id] = (preorderList[id] || 0) + 1;
    updateList("Added " + findMenuItem(id).name + ".");
}

function changeQuantity(id, amount) {
    const newQuantity = (preorderList[id] || 0) + amount;
    if (newQuantity <= 0) {
        removeFromList(id);
        return;
    }
    preorderList[id] = newQuantity;
    updateList(findMenuItem(id).name + " quantity is now " + newQuantity + ".");
}

function removeFromList(id) {
    const name = findMenuItem(id).name;
    delete preorderList[id];
    updateList("Removed " + name + ".");
}

function emptyList() {
    preorderList = {};
    clearPreorderList();
    renderList();
    announce("Your list is empty.");
}

// Saves, redraws, and tells screen reader users what changed.
function updateList(message) {
    savePreorderList(preorderList);
    renderList();
    announce(message);
}

function announce(message) {
    document.getElementById("list-status").textContent = message;
}

function createQuantityButton(symbol, label, onClick) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "qty-button";
    button.textContent = symbol;
    button.setAttribute("aria-label", label);
    button.addEventListener("click", onClick);
    return button;
}

function renderList() {
    const listElement = document.getElementById("my-list");
    const emptyMessage = document.getElementById("list-empty");
    const footer = document.getElementById("list-footer");
    const entries = getListEntries(preorderList);

    listElement.innerHTML = "";
    emptyMessage.hidden = entries.length > 0;
    footer.hidden = entries.length === 0;

    entries.forEach(function (entry) {
        const li = document.createElement("li");
        li.className = "list-item";

        const name = document.createElement("span");
        name.className = "list-item-name";
        name.textContent = entry.item.name;

        const controls = document.createElement("span");
        controls.className = "qty-controls";

        const quantity = document.createElement("span");
        quantity.className = "qty";
        quantity.textContent = entry.quantity;

        controls.appendChild(createQuantityButton("-", "Remove one " + entry.item.name, function () {
            changeQuantity(entry.item.id, -1);
        }));
        controls.appendChild(quantity);
        controls.appendChild(createQuantityButton("+", "Add one more " + entry.item.name, function () {
            changeQuantity(entry.item.id, 1);
        }));

        const subtotal = document.createElement("span");
        subtotal.className = "list-item-price";
        subtotal.textContent = formatPrice(entry.item.price * entry.quantity);

        li.appendChild(name);
        li.appendChild(controls);
        li.appendChild(subtotal);
        listElement.appendChild(li);
    });

    document.getElementById("list-total").textContent = formatPrice(calculateListTotal(entries));
}

/* ---------- Start ---------- */
function initPreorderFeature() {
    document.getElementById("preorder-builder").hidden = false;
    document.getElementById("clear-list").addEventListener("click", emptyList);
    renderFilterButtons();
    renderMenu();
    renderList();
}

document.addEventListener("DOMContentLoaded", initPreorderFeature);
