"use strict";

const products = [
  { name: "Pandesal (pack of 5)", price: 25 },
  { name: "Ensaymada", price: 20 },
  { name: "Spanish Bread", price: 15 },
  { name: "Chocolate Cupcake", price: 30 },
  { name: "Loaf Bread", price: 55 },
  { name: "Brewed Coffee (cup)", price: 25 }
];

// Each entry stores the product's array index and its quantity.
let cart = [];
let payment = null;
const issuedReferences = new Set();

function generateTransactionReference() {
  let reference;
  do {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    reference = "CB-" + Array.from(bytes, (byte) =>
      byte.toString(16).padStart(2, "0")).join("");
  } while (issuedReferences.has(reference));
  issuedReferences.add(reference);
  return reference;
}

function clearPaymentResult() {
  payment = null;
  showPaymentMessage("");
  const placeholder = document.createElement("p");
  placeholder.className = "placeholder";
  placeholder.textContent = "The receipt will appear here.";
  document.getElementById("receipt").replaceChildren(placeholder);
}

function renderReceipt(transaction) {
  const receipt = document.getElementById("receipt");
  receipt.replaceChildren();
  const reference = document.createElement("p");
  reference.textContent = `Transaction reference: ${transaction.reference}`;
  const table = document.createElement("table");
  table.className = "cart-table";
  const head = document.createElement("thead");
  const headings = document.createElement("tr");
  ["Item", "Quantity", "Unit Price", "Subtotal"].forEach((label) => {
    const cell = document.createElement("th");
    cell.scope = "col";
    cell.textContent = label;
    headings.append(cell);
  });
  head.append(headings);
  const body = document.createElement("tbody");
  transaction.items.forEach((item) => {
    const row = document.createElement("tr");
    [item.name, item.quantity, formatMoney(item.price),
      formatMoney(item.price * item.quantity)].forEach((value) => {
      const cell = document.createElement("td");
      cell.textContent = value;
      row.append(cell);
    });
    body.append(row);
  });
  table.append(head, body);
  receipt.append(reference, table);
  [
    `Total amount due: ${formatMoney(transaction.total)}`,
    `Amount paid: ${formatMoney(transaction.amountPaid)}`,
    `Change: ${formatMoney(transaction.change)}`,
    "Payment successful!"
  ].forEach((text) => {
    const line = document.createElement("p");
    line.textContent = text;
    receipt.append(line);
  });
}

function newTransaction() {
  cart = [];
  document.getElementById("cash-amount").value = "";
  renderCart(); // Clears payment state, messages, receipt, and updates total.
}

function parsePaymentAmount(rawAmount) {
  const amount = Number(rawAmount);
  if (rawAmount.trim() === "" || !Number.isFinite(amount) || amount < 0) {
    return null;
  }
  return amount;
}

function showPaymentMessage(message) {
  document.getElementById("payment-message").textContent = message;
}

function validatePayment(rawAmount, total) {
  const amount = parsePaymentAmount(rawAmount);
  if (amount === null) {
    return { valid: false, message: "Please enter a valid payment amount." };
  }
  if (amount < total) {
    return {
      valid: false,
      message: `Insufficient payment. Please enter at least ${formatMoney(total)}.`
    };
  }
  return { valid: true, amount };
}

function confirmPayment(event) {
  event.preventDefault();
  clearPaymentResult();
  const total = calculateTotal();
  const result = validatePayment(document.getElementById("cash-amount").value, total);
  if (!result.valid) {
    showPaymentMessage(result.message);
    return;
  }
  if (cart.length === 0) {
    showPaymentMessage("Please add items to the cart before paying.");
    return;
  }

  // Round the difference to cents to avoid floating-point display errors.
  const change = Math.round((result.amount - total) * 100) / 100;
  payment = {
    reference: generateTransactionReference(),
    items: cart.map((item) => ({
      ...products[item.productIndex], quantity: item.quantity
    })),
    amountPaid: result.amount, total, change
  };
  showPaymentMessage("Payment successful!");
  renderReceipt(payment);
}

function formatMoney(amount) {
  return `₱${amount.toFixed(2)}`;
}

function calculateTotal() {
  return cart.reduce((total, item) =>
    total + products[item.productIndex].price * item.quantity, 0);
}

function addToCart(productIndex) {
  const item = cart.find((entry) => entry.productIndex === productIndex);
  if (item) {
    item.quantity += 1;
  } else {
    cart.push({ productIndex, quantity: 1 });
  }
  renderCart();
}

function increaseQuantity(productIndex) {
  const item = cart.find((entry) => entry.productIndex === productIndex);
  if (item) item.quantity += 1;
  renderCart();
}

function decreaseQuantity(productIndex) {
  const item = cart.find((entry) => entry.productIndex === productIndex);
  if (item && item.quantity > 1) {
    item.quantity -= 1;
    renderCart();
  } else {
    removeFromCart(productIndex);
  }
}

function removeFromCart(productIndex) {
  cart = cart.filter((item) => item.productIndex !== productIndex);
  renderCart();
}

function renderCart() {
  clearPaymentResult();
  const cartItems = document.getElementById("cart-items");
  cartItems.replaceChildren();

  if (cart.length === 0) {
    const message = document.createElement("p");
    message.className = "placeholder";
    message.textContent = "The cart is empty.";
    cartItems.append(message);
  } else {
    const table = document.createElement("table");
    table.className = "cart-table";
    const head = document.createElement("thead");
    const headings = document.createElement("tr");
    ["Product", "Unit Price", "Quantity", "Subtotal", "Actions"].forEach((label) => {
      const heading = document.createElement("th");
      heading.scope = "col";
      heading.textContent = label;
      headings.append(heading);
    });
    head.append(headings);
    const body = document.createElement("tbody");

    cart.forEach((item) => {
      const product = products[item.productIndex];
      const row = document.createElement("tr");
      [product.name, formatMoney(product.price), item.quantity,
        formatMoney(product.price * item.quantity)].forEach((value) => {
        const cell = document.createElement("td");
        cell.textContent = value;
        row.append(cell);
      });

      const actions = document.createElement("td");
      actions.className = "cart-actions";
      [
        ["+", "Increase", increaseQuantity],
        ["−", "Decrease", decreaseQuantity],
        ["Remove", "Remove", removeFromCart]
      ].forEach(([label, action, handler]) => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = label;
        button.setAttribute("aria-label", `${action} ${product.name}`);
        button.addEventListener("click", () => handler(item.productIndex));
        actions.append(button);
      });
      row.append(actions);
      body.append(row);
    });
    table.append(head, body);
    cartItems.append(table);
  }

  document.getElementById("order-total").textContent = formatMoney(calculateTotal());
}

const productList = document.getElementById("product-list");
productList.replaceChildren();

products.forEach((product, productIndex) => {
  const row = document.createElement("div");
  row.className = "product-row";

  const name = document.createElement("span");
  name.textContent = product.name;

  const price = document.createElement("span");
  price.textContent = `₱${product.price.toFixed(2)}`;

  const button = document.createElement("button");
  button.type = "button";
  button.textContent = "Add to Cart";
  button.addEventListener("click", () => addToCart(productIndex));

  row.append(name, price, button);
  productList.append(row);
});

document.getElementById("payment-controls").addEventListener("submit", confirmPayment);
document.getElementById("cash-amount").addEventListener("input", clearPaymentResult);
document.getElementById("new-transaction").addEventListener("click", newTransaction);
renderCart();
