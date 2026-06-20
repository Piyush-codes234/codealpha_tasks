const API_URL = 'http://localhost:5000/api';

// --- STATE MANAGEMENT ---
let cart = JSON.parse(localStorage.getItem('cart')) || [];
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user'));

// Update UI based on Auth State
function updateNav() {
    const authLinks = document.getElementById('auth-links');
    if (!authLinks) return;
    
    if (token) {
        authLinks.innerHTML = `
            <span>Welcome, ${user.name}</span>
            <a href="#" onclick="logout()">Logout</a>
            <a href="cart.html">Cart (<span id="cart-count">${cart.length}</span>)</a>
        `;
    } else {
        authLinks.innerHTML = `
            <a href="login.html">Login</a>
            <a href="register.html">Register</a>
            <a href="cart.html">Cart (<span id="cart-count">${cart.length}</span>)</a>
        `;
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    const count = document.getElementById('cart-count');
    if (count) count.innerText = cart.length;
}

// --- PRODUCT LOGIC ---
async function loadProducts() {
    try {
        const res = await fetch(`${API_URL}/products`);
        const products = await res.json();
        const grid = document.getElementById('product-grid');
        
        if (products.length === 0) {
            grid.innerHTML = `<button class="btn" onclick="seedDatabase()">No products found. Click to generate dummy data.</button>`;
            return;
        }

        grid.innerHTML = products.map(p => `
            <div class="card">
                <img src="${p.image}" alt="${p.name}">
                <div class="card-content">
                    <h3 class="card-title">${p.name}</h3>
                    <p class="card-price">$${p.price.toFixed(2)}</p>
                    <a href="product.html?id=${p._id}" class="btn btn-outline" style="margin-bottom: 0.5rem;">View Details</a>
                    <button class="btn" onclick="addToCart('${p._id}', '${p.name}', ${p.price})">Add to Cart</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error("Failed to load products", error);
    }
}

async function loadSingleProduct() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    if (!id) return window.location.href = 'index.html';

    const res = await fetch(`${API_URL}/products/${id}`);
    const product = await res.json();
    
    document.getElementById('product-detail').innerHTML = `
        <div style="display: flex; gap: 3rem; background: #fff; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <img src="${product.image}" alt="${product.name}" style="width: 50%; max-width: 400px; border-radius: 8px;">
            <div>
                <h1 style="margin-bottom: 1rem;">${product.name}</h1>
                <p style="color: #64748b; margin-bottom: 2rem; line-height: 1.6;">${product.description}</p>
                <h2 style="color: #2563eb; margin-bottom: 2rem;">$${product.price.toFixed(2)}</h2>
                <button class="btn" onclick="addToCart('${product._id}', '${product.name}', ${product.price})">Add to Cart</button>
            </div>
        </div>
    `;
}

// --- CART & CHECKOUT LOGIC ---
function addToCart(id, name, price) {
    const existing = cart.find(item => item.product === id);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ product: id, name, price, quantity: 1 });
    }
    saveCart();
    alert(`${name} added to cart!`);
}

function loadCart() {
    const cartContainer = document.getElementById('cart-items');
    if (cart.length === 0) {
        cartContainer.innerHTML = '<p>Your cart is empty.</p>';
        document.getElementById('checkout-section').style.display = 'none';
        return;
    }

    let total = 0;
    cartContainer.innerHTML = cart.map(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        return `
            <div class="cart-item">
                <div>
                    <h4>${item.name}</h4>
                    <small>$${item.price} x ${item.quantity}</small>
                </div>
                <h4>$${itemTotal.toFixed(2)}</h4>
            </div>
        `;
    }).join('');

    document.getElementById('cart-total').innerText = `$${total.toFixed(2)}`;
    document.getElementById('checkout-btn').dataset.total = total;
}

async function checkout() {
    if (!token) {
        alert('Please login to complete your order.');
        window.location.href = 'login.html';
        return;
    }

    const totalAmount = document.getElementById('checkout-btn').dataset.total;
    
    // Format cart for backend Order schema
    const orderProducts = cart.map(item => ({ product: item.product, quantity: item.quantity }));

    try {
        const res = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ products: orderProducts, totalAmount })
        });

        if (res.ok) {
            alert('Payment Successful! Order Placed.');
            cart = [];
            saveCart();
            window.location.href = 'index.html';
        } else {
            const data = await res.json();
            alert(data.error || 'Checkout failed.');
        }
    } catch (err) {
        console.error(err);
    }
}

// Utility to create dummy products
async function seedDatabase() {
    await fetch(`${API_URL}/seed`, { method: 'POST' });
    window.location.reload();
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    updateNav();
    if (document.getElementById('product-grid')) loadProducts();
    if (document.getElementById('product-detail')) loadSingleProduct();
    if (document.getElementById('cart-items')) loadCart();
});