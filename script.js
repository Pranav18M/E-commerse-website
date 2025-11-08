let allProducts = [];
let cart = JSON.parse(localStorage.getItem('shopease-cart') || '[]');
let wishlist = JSON.parse(localStorage.getItem('shopease-wishlist') || '[]');
let currentPage = 'home';

// Utility Functions
const formatPrice = (price) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(price * 85); // Convert USD to INR approximately
};

const saveToStorage = () => {
  localStorage.setItem('shopease-cart', JSON.stringify(cart));
  localStorage.setItem('shopease-wishlist', JSON.stringify(wishlist));
  updateBadges();
};

const updateBadges = () => {
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  document.getElementById('cartCount').textContent = cartCount;
  document.getElementById('wishlistCount').textContent = wishlist.length;
};

// Toast Notifications
const showToast = (message, type = 'info') => {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  
  document.getElementById('toastContainer').appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideInRight 0.3s ease-out reverse';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
};

// Page Navigation
const showPage = (page) => {
  // Update navigation
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active');
  });
  
  const activeLink = document.querySelector(`.nav-link[onclick*="${page}"]`);
  if (activeLink) activeLink.classList.add('active');
  
  // Update pages
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(`${page}Page`).classList.add('active');
  
  currentPage = page;
  
  // Load page-specific content
  if (page === 'products') {
    loadProducts();
  } else if (page === 'wishlist') {
    renderWishlist();
  } else if (page === 'cart') {
    renderCart();
  }
  
  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
  
  // Close mobile menu
  document.getElementById('navLinks').classList.remove('show');
};

// Product Functions
const loadProducts = async () => {
  try {
    const response = await fetch("https://fakestoreapi.com/products");
    allProducts = await response.json();
    
    document.getElementById('productsLoading').style.display = 'none';
    document.getElementById('productList').style.display = 'grid';
    
    renderProducts(allProducts);
    setupFilters();
  } catch (error) {
    console.error('Error loading products:', error);
    showToast('Failed to load products', 'error');
    document.getElementById('productsLoading').style.display = 'none';
  }
};

const renderProducts = (products) => {
  const grid = document.getElementById('productList');
  
  if (products.length === 0) {
    document.getElementById('noResults').style.display = 'block';
    grid.style.display = 'none';
    return;
  }
  
  document.getElementById('noResults').style.display = 'none';
  grid.style.display = 'grid';
  
  grid.innerHTML = products.map(product => `
    <div class="product-card">
      <img src="${product.image}" alt="${product.title}" loading="lazy">
      <div class="product-info">
        <h3 class="product-title">${product.title}</h3>
        <div class="product-price">${formatPrice(product.price)}</div>
        <div class="product-rating">
          <span>⭐ ${product.rating?.rate || 4.2}</span>
          <span>•</span>
          <span>${product.rating?.count || 100} reviews</span>
        </div>
        <div class="product-actions">
          <button class="wishlist-btn ${isInWishlist(product.id) ? 'active' : ''}" 
                  onclick="toggleWishlist(${product.id})">
            ❤️
          </button>
          <button class="btn btn-primary" onclick="addToCart(${product.id})">
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  `).join('');
};

const loadFeaturedProducts = async () => {
  try {
    const response = await fetch('https://fakestoreapi.com/products?limit=6');
    const products = await response.json();
    
    // Make featured items available to cart/wishlist lookups
    allProducts = [...allProducts, ...products];
    
    const grid = document.getElementById('featuredGrid');
    grid.innerHTML = products.map(product => `
      <div class="product-card">
        <img src="${product.image}" alt="${product.title}" loading="lazy">
        <div class="product-info">
          <h3 class="product-title">${product.title}</h3>
          <div class="product-price">${formatPrice(product.price)}</div>
          <div class="product-rating">
            <span>⭐ ${product.rating?.rate || 4.2}</span>
            <span>•</span>
            <span>${product.rating?.count || 100} reviews</span>
          </div>
          <div class="product-actions">
            <button class="wishlist-btn ${isInWishlist(product.id) ? 'active' : ''}" 
                    onclick="toggleWishlist(${product.id})">
              ❤️
            </button>
            <button class="btn btn-primary" onclick="addToCart(${product.id})">
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error loading featured products:', error);
  }
};

// Cart Functions
const addToCart = (productId) => {
  const product = allProducts.find(p => p.id === productId);
  if (!product) return;
  
  const existingItem = cart.find(item => item.id === productId);
  
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      id: product.id,
      title: product.title,
      price: product.price,
      image: product.image,
      quantity: 1
    });
  }
  
  saveToStorage();
  showToast(`${product.title} added to cart!`, 'success');
};

const removeFromCart = (productId) => {
  cart = cart.filter(item => item.id !== productId);
  saveToStorage();
  renderCart();
  showToast('Item removed from cart', 'info');
};

const updateCartQuantity = (productId, change) => {
  const item = cart.find(item => item.id === productId);
  if (item) {
    item.quantity += change;
    if (item.quantity <= 0) {
      removeFromCart(productId);
    } else {
      saveToStorage();
      renderCart();
    }
  }
};

const renderCart = () => {
  const cartList = document.getElementById('cartList');
  const emptyCart = document.getElementById('emptyCart');
  
  if (cart.length === 0) {
    cartList.style.display = 'none';
    emptyCart.style.display = 'block';
    updateCartSummary();
    return;
  }
  
  cartList.style.display = 'block';
  emptyCart.style.display = 'none';
  
  cartList.innerHTML = cart.map(item => `
    <div class="cart-item">
      <img src="${item.image}" alt="${item.title}">
      <div class="cart-item-info">
        <div class="cart-item-name">${item.title}</div>
        <div class="cart-item-price">${formatPrice(item.price)} each</div>
        <div class="quantity-controls">
          <button class="qty-btn" onclick="updateCartQuantity(${item.id}, -1)">-</button>
          <span class="quantity">${item.quantity}</span>
          <button class="qty-btn" onclick="updateCartQuantity(${item.id}, 1)">+</button>
          <button class="remove-btn" onclick="removeFromCart(${item.id})">Remove</button>
        </div>
      </div>
      <div class="cart-item-actions">
        <div class="cart-item-total">${formatPrice(item.price * item.quantity)}</div>
      </div>
    </div>
  `).join('');
  
  updateCartSummary();
};

const updateCartSummary = () => {
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal > (1500 / 85) ? 0 : (99 / 85); // Convert to USD equivalent
  const total = subtotal + shipping;
  
  document.getElementById('subtotal').textContent = formatPrice(subtotal);
  document.getElementById('shipping').textContent = formatPrice(shipping);
  document.getElementById('grandTotal').textContent = formatPrice(total);
};

// Wishlist Functions
const toggleWishlist = (productId) => {
  const product = allProducts.find(p => p.id === productId);
  if (!product) return;
  
  const existingIndex = wishlist.findIndex(item => item.id === productId);
  
  if (existingIndex > -1) {
    wishlist.splice(existingIndex, 1);
    showToast(`Removed from wishlist`, 'info');
  } else {
    wishlist.push({
      id: product.id,
      title: product.title,
      price: product.price,
      image: product.image,
      rating: product.rating
    });
    showToast(`Added to wishlist!`, 'success');
  }
  
  saveToStorage();
  
  // Update wishlist button state
  document.querySelectorAll(`[onclick="toggleWishlist(${productId})"]`).forEach(btn => {
    btn.classList.toggle('active', isInWishlist(productId));
  });
  
  if (currentPage === 'wishlist') {
    renderWishlist();
  }
};

const isInWishlist = (productId) => {
  return wishlist.some(item => item.id === productId);
};

const renderWishlist = () => {
  const grid = document.getElementById('wishlistGrid');
  const emptyWishlist = document.getElementById('emptyWishlist');
  
  if (wishlist.length === 0) {
    grid.style.display = 'none';
    emptyWishlist.style.display = 'block';
    return;
  }
  
  grid.style.display = 'grid';
  emptyWishlist.style.display = 'none';
  
  grid.innerHTML = wishlist.map(item => `
    <div class="product-card">
      <img src="${item.image}" alt="${item.title}" loading="lazy">
      <div class="product-info">
        <h3 class="product-title">${item.title}</h3>
        <div class="product-price">${formatPrice(item.price)}</div>
        <div class="product-rating">
          <span>⭐ ${item.rating?.rate || 4.2}</span>
          <span>•</span>
          <span>${item.rating?.count || 100} reviews</span>
        </div>
        <div class="product-actions">
          <button class="btn btn-ghost" onclick="moveToCart(${item.id})">
            Move to Cart
          </button>
          <button class="btn btn-primary" onclick="toggleWishlist(${item.id})">
            Remove
          </button>
        </div>
      </div>
    </div>
  `).join('');
};

const moveToCart = (productId) => {
  const item = wishlist.find(item => item.id === productId);
  if (item) {
    addToCart(productId);
    toggleWishlist(productId);
  }
};

// Filter Functions
const setupFilters = () => {
  const searchInput = document.getElementById('searchInput');
  const categoryFilter = document.getElementById('categoryFilter');
  const sortBy = document.getElementById('sortBy');
  const clearFilters = document.getElementById('clearFilters');
  const resetSearch = document.getElementById('resetSearch');
  
  const applyFilters = () => {
    let filtered = [...allProducts];
    
    // Search filter
    const searchTerm = searchInput.value.toLowerCase().trim();
    if (searchTerm) {
      filtered = filtered.filter(product => 
        product.title.toLowerCase().includes(searchTerm) ||
        product.category.toLowerCase().includes(searchTerm) ||
        product.description?.toLowerCase().includes(searchTerm)
      );
    }
    
    // Category filter
    const category = categoryFilter.value;
    if (category) {
      filtered = filtered.filter(product => product.category === category);
    }
    
    // Sort
    const sort = sortBy.value;
    switch (sort) {
      case 'low-high':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'high-low':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'az':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'za':
        filtered.sort((a, b) => b.title.localeCompare(a.title));
        break;
    }
    
    renderProducts(filtered);
  };
  
  searchInput.addEventListener('input', applyFilters);
  categoryFilter.addEventListener('change', applyFilters);
  sortBy.addEventListener('change', applyFilters);
  
  clearFilters.addEventListener('click', () => {
    searchInput.value = '';
    categoryFilter.value = '';
    sortBy.value = '';
    renderProducts(allProducts);
  });
  
  resetSearch.addEventListener('click', () => {
    searchInput.value = '';
    categoryFilter.value = '';
    sortBy.value = '';
    renderProducts(allProducts);
  });
};

// Dark Mode
const initDarkMode = () => {
  const darkModeToggle = document.getElementById('darkModeToggle');
  const themeIcon = document.querySelector('.theme-icon');
  const savedTheme = localStorage.getItem('shopease-theme');
  
  if (savedTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    themeIcon.textContent = '☀️';
  }
  
  darkModeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    themeIcon.textContent = newTheme === 'dark' ? '☀️' : '🌙';
    localStorage.setItem('shopease-theme', newTheme);
  });
};

// Mobile Menu
const initMobileMenu = () => {
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');
  
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navLinks.classList.toggle('show');
  });
  
  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
      hamburger.classList.remove('active');
      navLinks.classList.remove('show');
    }
  });
};

// Back to Top
const initBackToTop = () => {
  const backToTop = document.getElementById('backToTop');
  
  window.addEventListener('scroll', () => {
    if (window.pageYOffset > 300) {
      backToTop.classList.add('visible');
    } else {
      backToTop.classList.remove('visible');
    }
  });
  
  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
};

// Newsletter
const initNewsletter = () => {
  const form = document.getElementById('newsletterForm');
  
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = form.querySelector('input').value;
    
    // Simulate newsletter signup
    showToast(`Thanks for subscribing with ${email}!`, 'success');
    form.reset();
  });
};

// Checkout
const initCheckout = () => {
  const checkoutBtn = document.getElementById('proceedToCheckout');
  
  checkoutBtn.addEventListener('click', () => {
    if (cart.length === 0) {
      showToast('Your cart is empty!', 'error');
      return;
    }
    
    // Simulate checkout process
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = total > (1500 / 85) ? 0 : (99 / 85);
    const finalTotal = total + shipping;
    
    if (confirm(`Proceed to checkout for ${formatPrice(finalTotal)}?`)) {
      // Clear cart and show success
      cart = [];
      saveToStorage();
      showToast('Order placed successfully! 🎉', 'success');
      renderCart();
    }
  });
};

// Initialize Everything
const init = () => {
  // Hide loading overlay
  setTimeout(() => {
    document.getElementById('loadingOverlay').classList.add('fade-out');
    setTimeout(() => {
      document.getElementById('loadingOverlay').remove();
    }, 500);
  }, 1200);
  
  // Initialize features
  initDarkMode();
  initMobileMenu();
  initBackToTop();
  initNewsletter();
  initCheckout();
  
  // Load initial data
  loadFeaturedProducts();
  updateBadges();
  
  // Show home page by default
  showPage('home');
};

// Handle online/offline status
window.addEventListener('online', () => {
  showToast('Connected to internet', 'success');
});

window.addEventListener('offline', () => {
  showToast('You are offline', 'warning');
});

// Start the application
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
