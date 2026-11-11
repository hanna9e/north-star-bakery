/* ==========================================================
   North Star Bakery - storage.js
   Shared helpers for the pre-order list saved in localStorage.
   Loaded on products.html and contact.html.
   ========================================================== */

const STORAGE_KEYS = {
    preorderList: "northStarPreorderList",
    menuFilter: "northStarMenuFilter"
};

// Every item a customer can add to their pre-order list.
const MENU_ITEMS = [
    { id: "signature-loaf", name: "Signature Loaf", category: "bread", price: 11.00 },
    { id: "country-sourdough", name: "Country Sourdough", category: "bread", price: 8.00 },
    { id: "seeded-rye", name: "Seeded Rye", category: "bread", price: 9.00 },
    { id: "whole-wheat", name: "Whole Wheat Sandwich Loaf", category: "bread", price: 6.50 },
    { id: "butter-croissant", name: "Butter Croissant", category: "pastry", price: 3.75 },
    { id: "cinnamon-roll", name: "Cinnamon Roll", category: "pastry", price: 4.50 },
    { id: "brown-butter-cookie", name: "Brown Butter Cookie", category: "pastry", price: 2.50 },
    { id: "seasonal-danish", name: "Seasonal Fruit Danish", category: "pastry", price: 4.25 },
    { id: "cupcake", name: "Vanilla or Chocolate Cupcake", category: "cake", price: 3.50 },
    { id: "layer-cake", name: "8-inch Layer Cake", category: "cake", price: 42.00 },
    { id: "pastry-tray", name: "Morning Pastry Tray (serves 12)", category: "tray", price: 35.00 },
    { id: "cookie-tray", name: "Cookie Tray (serves 20)", category: "tray", price: 48.00 }
];

/* Reads the saved list. It's stored as an object of item id -> quantity,
   for example { "cinnamon-roll": 4 }. */
function loadPreorderList() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.preorderList));
        return saved && typeof saved === "object" ? saved : {};
    } catch (error) {
        return {};
    }
}

function savePreorderList(list) {
    try {
        localStorage.setItem(STORAGE_KEYS.preorderList, JSON.stringify(list));
    } catch (error) {
        // Storage can be blocked in private browsing. The page still works without it.
    }
}

function clearPreorderList() {
    try {
        localStorage.removeItem(STORAGE_KEYS.preorderList);
    } catch (error) {
        // Nothing to clear.
    }
}

function findMenuItem(id) {
    return MENU_ITEMS.find(function (item) {
        return item.id === id;
    });
}

function formatPrice(amount) {
    return "$" + amount.toFixed(2);
}

/* Turns the saved list into an array of { item, quantity } entries,
   skipping anything that's no longer on the menu. */
function getListEntries(list) {
    return Object.keys(list)
        .map(function (id) {
            return { item: findMenuItem(id), quantity: list[id] };
        })
        .filter(function (entry) {
            return entry.item && entry.quantity > 0;
        });
}

function calculateListTotal(entries) {
    return entries.reduce(function (total, entry) {
        return total + entry.item.price * entry.quantity;
    }, 0);
}
