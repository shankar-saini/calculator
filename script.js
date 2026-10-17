// Calculator: plain JavaScript, no eval().

var displayEl = document.getElementById("display");
var historyEl = document.getElementById("history");

var current = "0";      // number being typed (as text)
var previous = null;    // first number (as a number)
var operator = null;    // + - * /
var justEvaluated = false;

var symbols = { "+": "+", "-": "\u2212", "*": "\u00d7", "/": "\u00f7" };

// ---------- helpers ----------
function format(text) {
    // show big numbers with commas, keep a typed decimal point
    if (text === "Error") { return text; }
    var negative = text.charAt(0) === "-";
    var body = negative ? text.slice(1) : text;
    var parts = body.split(".");
    parts[0] = Number(parts[0]).toLocaleString("en-IN");
    return (negative ? "-" : "") + parts.join(".");
}

function clean(number) {
    // avoid 0.1 + 0.2 = 0.30000000000000004
    if (!isFinite(number)) { return "Error"; }
    var rounded = parseFloat(number.toPrecision(12));
    return String(rounded);
}

function update() {
    displayEl.textContent = format(current);
    if (operator !== null && previous !== null) {
        historyEl.textContent = format(String(previous)) + " " + symbols[operator];
    }
}

function calculate(a, b, op) {
    if (op === "+") { return a + b; }
    if (op === "-") { return a - b; }
    if (op === "*") { return a * b; }
    if (op === "/") { return b === 0 ? NaN : a / b; }
    return b;
}

// ---------- actions ----------
function typeNumber(digit) {
    if (current === "Error" || justEvaluated) {
        current = "0";
        justEvaluated = false;
        if (operator === null) { historyEl.textContent = ""; }
    }
    if (current.replace("-", "").replace(".", "").length >= 15) { return; }
    current = current === "0" ? digit : (current === "-0" ? "-" + digit : current + digit);
    update();
}

function typeDot() {
    if (current === "Error" || justEvaluated) { current = "0"; justEvaluated = false; }
    if (current.indexOf(".") === -1) { current = current + "."; }
    update();
}

function chooseOperator(op) {
    if (current === "Error") { return; }
    if (operator !== null && previous !== null && !justEvaluated && current !== "") {
        // chain: 2 + 3 + ... calculates 2 + 3 first
        var result = calculate(previous, parseFloat(current), operator);
        previous = result;
        if (!isFinite(result)) { showError(); return; }
    } else {
        previous = parseFloat(current);
    }
    operator = op;
    justEvaluated = false;
    current = "0";
    historyEl.textContent = format(clean(previous)) + " " + symbols[op];
    displayEl.textContent = format(clean(previous));
    markOperator(op);
}

function markOperator(op) {
    var ops = document.querySelectorAll(".key.op");
    for (var i = 0; i < ops.length; i++) {
        ops[i].classList.toggle("active", ops[i].dataset.op === op);
    }
}

function showError() {
    current = "Error";
    previous = null;
    operator = null;
    historyEl.textContent = "Cannot divide by zero";
    markOperator(null);
    update();
}

function equals() {
    if (operator === null || previous === null || current === "Error") { return; }
    var a = previous;
    var b = parseFloat(current);
    var result = calculate(a, b, operator);
    if (!isFinite(result)) { showError(); return; }
    historyEl.textContent = format(clean(a)) + " " + symbols[operator] + " " + format(clean(b)) + " =";
    current = clean(result);
    previous = null;
    operator = null;
    justEvaluated = true;
    markOperator(null);
    displayEl.textContent = format(current);
}

function clearAll() {
    current = "0";
    previous = null;
    operator = null;
    justEvaluated = false;
    historyEl.textContent = "";
    markOperator(null);
    update();
}

function deleteLast() {
    if (current === "Error" || justEvaluated) { clearAll(); return; }
    current = current.length > 1 && !(current.length === 2 && current.charAt(0) === "-") ? current.slice(0, -1) : "0";
    update();
}

function percent() {
    if (current === "Error") { return; }
    current = clean(parseFloat(current) / 100);
    update();
}

function changeSign() {
    if (current === "Error" || current === "0") { return; }
    current = current.charAt(0) === "-" ? current.slice(1) : "-" + current;
    update();
}

// ---------- buttons ----------
document.querySelector(".keys").addEventListener("click", function (event) {
    var btn = event.target.closest("button");
    if (!btn) { return; }

    if (btn.dataset.num !== undefined) { typeNumber(btn.dataset.num); }
    else if (btn.dataset.op) { chooseOperator(btn.dataset.op); }
    else if (btn.dataset.action === "dot") { typeDot(); }
    else if (btn.dataset.action === "equals") { equals(); }
    else if (btn.dataset.action === "clear") { clearAll(); }
    else if (btn.dataset.action === "delete") { deleteLast(); }
    else if (btn.dataset.action === "percent") { percent(); }
    else if (btn.dataset.action === "sign") { changeSign(); }
});

// ---------- keyboard ----------
document.addEventListener("keydown", function (event) {
    if (document.querySelector("dialog[open]")) { return; }   // the "more projects" pop-up is open
    var k = event.key;
    if (event.ctrlKey || event.metaKey || event.altKey) { return; }

    if (k >= "0" && k <= "9") { typeNumber(k); }
    else if (k === ".") { typeDot(); }
    else if (k === "+" || k === "-" || k === "*" || k === "/") { event.preventDefault(); chooseOperator(k); }
    else if (k === "%") { percent(); }
    else if (k === "Enter" || k === "=") { event.preventDefault(); equals(); }
    else if (k === "Backspace") { deleteLast(); }
    else if (k === "Escape") { clearAll(); }
});

update();
