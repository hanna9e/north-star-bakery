/* ==========================================================
   North Star Bakery - contact-form.js
   JavaScript validation for the pre-order form, plus filling
   in the saved pre-order list from the Products page.
   ========================================================== */

const CLOSED_DAY = 1;          // Monday (Sunday = 0)
const CAKE_NOTICE_DAYS = 3;    // custom cakes need 72 hours
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_PATTERN = /^\d{3}-\d{3}-\d{4}$/;

/* Each field id maps to a function that returns an error
   message, or an empty string when the value is fine. */
const VALIDATION_RULES = {
    "name": function (value) {
        if (value === "") return "Please enter your name so we know whose order it is.";
        if (value.length < 2) return "Your name needs at least 2 characters.";
        return "";
    },
    "email": function (value) {
        if (value === "") return "Please enter your email so we can confirm your order.";
        if (!EMAIL_PATTERN.test(value)) return "Enter an email like name@example.com.";
        return "";
    },
    "phone": function (value) {
        if (value !== "" && !PHONE_PATTERN.test(value)) return "Use the format 555-555-0142, or leave this blank.";
        return "";
    },
    "request-type": function (value) {
        if (value === "") return "Choose what kind of request this is.";
        return "";
    },
    "pickup-date": validatePickupDate,
    "item-details": function (value) {
        if (value === "") return "Tell us what you'd like to order.";
        if (value.length < 10) return "Add a little more detail (at least 10 characters), like items and quantities.";
        return "";
    }
};

/* ---------- Date helpers ---------- */

// Builds a local date from "YYYY-MM-DD". new Date("YYYY-MM-DD") is read as UTC,
// which shows up as the day before here in Eastern time.
function parseLocalDate(value) {
    const parts = value.split("-").map(Number);
    return new Date(parts[0], parts[1] - 1, parts[2]);
}

function getToday() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function addDays(date, days) {
    const copy = new Date(date);
    copy.setDate(copy.getDate() + days);
    return copy;
}

function toInputValue(date) {
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return date.getFullYear() + "-" + month + "-" + day;
}

function validatePickupDate(value) {
    if (value === "") return "Pick a date to collect your order.";

    const pickup = parseLocalDate(value);
    const tomorrow = addDays(getToday(), 1);
    const requestType = document.getElementById("request-type").value;

    if (pickup < tomorrow) return "Pickup needs to be tomorrow or later so we have time to bake.";
    if (pickup.getDay() === CLOSED_DAY) return "We're closed on Mondays. Please choose another day.";
    if (requestType === "custom-cake" && pickup < addDays(getToday(), CAKE_NOTICE_DAYS)) {
        return "Custom cakes need at least 3 days' notice. Choose a later date.";
    }
    return "";
}

/* ---------- Showing and clearing errors ---------- */
function showError(field, message) {
    const errorElement = document.getElementById(field.id + "-error");
    errorElement.textContent = message;
    field.setAttribute("aria-invalid", message ? "true" : "false");
    field.classList.toggle("is-invalid", message !== "");
}

function validateField(field) {
    const rule = VALIDATION_RULES[field.id];
    if (!rule) return true;
    const message = rule(field.value.trim());
    showError(field, message);
    return message === "";
}

function validateForm(form) {
    let firstInvalid = null;

    Object.keys(VALIDATION_RULES).forEach(function (id) {
        const field = form.elements[id];
        const isValid = validateField(field);
        if (!isValid && !firstInvalid) {
            firstInvalid = field;
        }
    });

    if (firstInvalid) {
        firstInvalid.focus();
        return false;
    }
    return true;
}

/* ---------- Pre-filling from the saved list ---------- */
function buildListText(entries) {
    const lines = entries.map(function (entry) {
        return entry.quantity + " x " + entry.item.name;
    });
    lines.push("Estimated total: " + formatPrice(calculateListTotal(entries)));
    return lines.join("\n");
}

function prefillFromSavedList(form) {
    const entries = getListEntries(loadPreorderList());
    const details = form.elements["item-details"];

    if (entries.length === 0 || details.value.trim() !== "") return;

    details.value = buildListText(entries);
    form.elements["request-type"].value = "pre-order";
    document.getElementById("prefill-note").hidden = false;
}

/* ---------- Submitting ---------- */
function showConfirmation(form) {
    const name = form.elements["name"].value.trim().split(" ")[0];
    const date = parseLocalDate(form.elements["pickup-date"].value);
    const confirmation = document.getElementById("form-confirmation");

    confirmation.textContent = "Thanks, " + name + "! We got your request for pickup on " +
        date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }) +
        ". We'll email you within one business day.";
    confirmation.hidden = false;
    confirmation.focus();
}

function handleSubmit(event) {
    const form = event.target;
    event.preventDefault();

    if (!validateForm(form)) return;

    // There's no server yet, so a valid request shows a confirmation instead of posting.
    showConfirmation(form);
    clearPreorderList();
    form.reset();
    document.getElementById("prefill-note").hidden = true;
}

function setUpLiveValidation(form) {
    Object.keys(VALIDATION_RULES).forEach(function (id) {
        const field = form.elements[id];

        // Check a field when the user leaves it. Skip this when focus is moving to the
        // submit button: an error appearing here pushes the button down mid-click,
        // so the click misses. The submit handler checks every field anyway.
        field.addEventListener("blur", function (event) {
            const goingToSubmit = event.relatedTarget && event.relatedTarget.type === "submit";
            if (goingToSubmit) return;
            if (field.value.trim() !== "" || field.getAttribute("aria-invalid") === "true") {
                validateField(field);
            }
        });

        // Once a field shows an error, clear it as soon as it's fixed.
        field.addEventListener("input", function () {
            if (field.getAttribute("aria-invalid") === "true") {
                validateField(field);
            }
        });
    });

    // The cake rule depends on the request type, so recheck the date when it changes.
    form.elements["request-type"].addEventListener("change", function () {
        const dateField = form.elements["pickup-date"];
        if (dateField.value !== "") validateField(dateField);
    });
}

function initContactForm() {
    const form = document.getElementById("preorder-form");

    // JavaScript handles validation now, so turn off the browser's popups.
    form.noValidate = true;
    form.elements["pickup-date"].min = toInputValue(addDays(getToday(), 1));

    prefillFromSavedList(form);
    setUpLiveValidation(form);
    form.addEventListener("submit", handleSubmit);
}

document.addEventListener("DOMContentLoaded", initContactForm);
