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

renderCart();
