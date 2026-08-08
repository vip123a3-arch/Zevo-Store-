let products = JSON.parse(localStorage.getItem('zevo_products')) || [];
let cart = JSON.parse(localStorage.getItem('zevo_cart')) || [];
let selectedProductId = null;
let onlyOffersMode = false;

function closeWelcomeScreen() {
    const welcome = document.getElementById('welcome-screen');
    if (welcome) {
        welcome.style.opacity = '0';
        welcome.style.visibility = 'hidden';
        setTimeout(() => {
            welcome.style.display = 'none';
        }, 300);
    }
}

function showToast(msg) {
    const toast = document.getElementById('custom-toast');
    if(!toast) return;
    toast.innerText = msg;
    toast.classList.add('show');
    setTimeout(() => { toast.classList.remove('show'); }, 2500);
}

function toggleTheme() {
    const body = document.body;
    const themeIcon = document.getElementById('theme-icon');
    if (body.getAttribute('data-theme') === 'dark') {
        body.setAttribute('data-theme', 'light');
        if(themeIcon) themeIcon.className = 'fa-solid fa-sun';
    } else {
        body.setAttribute('data-theme', 'dark');
        if(themeIcon) themeIcon.className = 'fa-solid fa-moon';
    }
}

function filterOffersOnly() {
    onlyOffersMode = true;
    const resetBtn = document.getElementById('reset-filter-btn');
    if(resetBtn) resetBtn.style.display = 'block';
    renderProducts();
}

function resetFilter() {
    onlyOffersMode = false;
    const resetBtn = document.getElementById('reset-filter-btn');
    if(resetBtn) resetBtn.style.display = 'none';
    const searchInput = document.getElementById('search-input');
    if(searchInput) searchInput.value = '';
    renderProducts();
}

function renderProducts() {
    const grid = document.getElementById('products-grid');
    if(!grid) return;
    grid.innerHTML = '';
    
    const searchInput = document.getElementById('search-input');
    const query = searchInput ? searchInput.value.toLowerCase() : '';
    let filtered = products.filter(p => p.name && p.name.toLowerCase().includes(query));

    if (onlyOffersMode) {
        filtered = filtered.filter(p => p.isOffer);
        const countText = document.getElementById('products-count-text');
        if(countText) countText.innerText = `${filtered.length} منتج عروض`;
    } else {
        const countText = document.getElementById('products-count-text');
        if(countText) countText.innerText = `${filtered.length} تيشيرت متاحة`;
    }

    if(filtered.length === 0) {
        grid.innerHTML = '<p style="text-align:center; color:#888; grid-column: 1/-1; padding:40px;">لا توجد منتجات مضافة حالياً.</p>';
        updateCartCount();
        return;
    }

    filtered.forEach(product => {
        let img1 = product.image1 || '';
        let imgTag = img1 ? `<img src="${img1}" alt="${product.name}">` : `<div style="background:var(--border-color); width:100%; height:100%;"></div>`;
        
        let offerBadgeHtml = product.isOffer ? `<div class="offer-badge-card"><i class="fa-solid fa-fire"></i> ${product.offerName || 'عرض'}</div>` : '';
        let oldPriceHtml = product.oldPrice ? `<span class="product-old-price">EGP ${product.oldPrice}</span>` : '';

        grid.innerHTML += `
            <div class="product-card">
                ${offerBadgeHtml}
                <div class="product-img-container">
                    ${imgTag}
                </div>
                <div class="product-info">
                    <div class="product-name">${product.name}</div>
                    <div class="product-price-box">
                        <span class="product-price">EGP ${product.price}</span>
                        ${oldPriceHtml}
                    </div>
                    <div class="card-footer-row">
                        <div class="product-qty">المتبقي: ${product.qty}</div>
                        <button class="quick-add-btn" onclick="openOptionsModal(${product.id})">إضافة للسلة</button>
                    </div>
                </div>
            </div>
        `;
    });
    updateCartCount();
}

function openOptionsModal(id) {
    const product = products.find(p => p.id === id);
    if(!product || product.qty <= 0) {
        showToast('عذراً، نفدت الكمية!');
        return;
    }
    selectedProductId = id;
    let colors = product.colors ? product.colors.split(',') : ['أسود'];
    let sizes = product.sizes ? product.sizes.split(',') : ['M', 'L', 'XL'];
    
    const sizeSelect = document.getElementById('modal-size-select');
    const colorSelect = document.getElementById('modal-color-select');
    
    if(sizeSelect) sizeSelect.innerHTML = sizes.map(s => `<option value="${s.trim()}">${s.trim()}</option>`).join('');
    if(colorSelect) colorSelect.innerHTML = colors.map(c => `<option value="${c.trim()}">${c.trim()}</option>`).join('');
    
    const modal = document.getElementById('options-modal');
    if(modal) modal.style.display = 'flex';
}

function confirmAddToCart() {
    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;

    const sizeSelect = document.getElementById('modal-size-select');
    const colorSelect = document.getElementById('modal-color-select');

    const selectedSize = sizeSelect ? sizeSelect.value : '';
    const selectedColor = colorSelect ? colorSelect.value : '';

    product.qty -= 1;
    localStorage.setItem('zevo_products', JSON.stringify(products));

    const existing = cart.find(item => item.id === selectedProductId && item.size === selectedSize && item.color === selectedColor);
    if(existing) {
        existing.cartQty += 1;
    } else {
        cart.push({ ...product, cartQty: 1, size: selectedSize, color: selectedColor });
    }
    localStorage.setItem('zevo_cart', JSON.stringify(cart));
    
    closeModal('options-modal');
    renderProducts();
    showToast('تمت الإضافة إلى السلة بنجاح!');
}

function updateCartCount() {
    const totalCount = cart.reduce((sum, item) => sum + item.cartQty, 0);
    const countEl = document.getElementById('cart-count');
    if(countEl) countEl.innerText = totalCount;
}

function openCartModal() {
    const container = document.getElementById('cart-items-container');
    if(!container) return;
    container.innerHTML = '';
    let total = 0;

    if(cart.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#888; padding:20px;">السلة فارغة حالياً.</p>';
    } else {
        cart.forEach((item, index) => {
            total += Number(item.price) * item.cartQty;
            let imgTag = item.image1 ? `<img src="${item.image1}" class="cart-item-img">` : `<div style="width:50px; height:50px; background:var(--border-color); border-radius:6px;"></div>`;
            container.innerHTML += `
                <div class="cart-item-card">
                    ${imgTag}
                    <div class="cart-item-details">
                        <div style="font-size:13px; font-weight:600;">${item.name}</div>
                        <div style="font-size:11px; color:#888;">المقاس: ${item.size} | اللون: ${item.color}</div>
                        <div style="font-size:12px; color:#ff4757; font-weight:bold;">EGP ${item.price}</div>
                        <div class="qty-controls">
                            <button class="qty-btn" onclick="changeCartQty(${index}, -1)">-</button>
                            <span class="qty-num">${item.cartQty}</span>
                            <button class="qty-btn" onclick="changeCartQty(${index}, 1)">+</button>
                        </div>
                    </div>
                    <button onclick="removeFromCart(${index})" style="background:none; border:none; color:#ff4757; cursor:pointer; font-size:14px; margin-right:5px;"><i class="fa-solid fa-trash"></i></button>
                </div>
            `;
        });
    }
    const totalPriceEl = document.getElementById('cart-total-price');
    if(totalPriceEl) totalPriceEl.innerText = `EGP ${total}`;
    
    const cartModal = document.getElementById('cart-modal');
    if(cartModal) cartModal.style.display = 'flex';
}

function changeCartQty(index, change) {
    const cartItem = cart[index];
    const product = products.find(p => p.id === cartItem.id);

    if (change === 1) {
        if (product && product.qty > 0) {
            product.qty -= 1;
            cartItem.cartQty += 1;
        } else {
            showToast('نفدت الكمية المتاحة بالمخزن!');
            return;
        }
    } else if (change === -1) {
        if (cartItem.cartQty > 1) {
            cartItem.cartQty -= 1;
            if (product) product.qty += 1;
        } else {
            removeFromCart(index);
            return;
        }
    }
    localStorage.setItem('zevo_products', JSON.stringify(products));
    localStorage.setItem('zevo_cart', JSON.stringify(cart));
    openCartModal();
    renderProducts();
}

function removeFromCart(index) {
    const cartItem = cart[index];
    const product = products.find(p => p.id === cartItem.id);
    if(product) {
        product.qty += cartItem.cartQty;
        localStorage.setItem('zevo_products', JSON.stringify(products));
    }
    cart.splice(index, 1);
    localStorage.setItem('zevo_cart', JSON.stringify(cart));
    openCartModal();
    renderProducts();
}

function checkoutWhatsApp() {
    if(cart.length === 0) { showToast('السلة فارغة!'); return; }
    let message = "مرحباً، أريد طلب المنتجات التالية من ZEVO Store:\n\n";
    let total = 0;
    cart.forEach((item, i) => {
        message += `${i+1}. ${item.name} (المقاس: ${item.size} - اللون: ${item.color}) - العدد: ${item.cartQty} - ${item.price * item.cartQty} EGP\n`;
        total += Number(item.price) * item.cartQty;
    });
    message += `\nالإجمالي الكلي: EGP ${total}`;
    window.open(`https://wa.me/201036462080?text=${encodeURIComponent(message)}`, '_blank');
}

function openAdminModal() { 
    const adminModal = document.getElementById('admin-login-modal');
    if(adminModal) adminModal.style.display = 'flex'; 
}

function verifyAdminPass() {
    const passInput = document.getElementById('admin-pass-input');
    const currentPass = localStorage.getItem('zevo_admin_pass') || 'admin123';
    if(passInput && passInput.value === currentPass) {
        window.location.href = "admin.html";
    } else {
        showToast('كلمة المرور غير صحيحة!');
    }
}

function closeModal(id) { 
    const modal = document.getElementById(id);
    if(modal) modal.style.display = 'none'; 
}

renderProducts();
