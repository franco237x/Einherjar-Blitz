/**
 * Marketplace JavaScript Functions
 * Einherjar Blitz - Marketplace System
 */

let currentListingForPurchase = null;
let userInventory = [];
let isPremiumUser = false;

// Toast Notification
function showToast(message, type = 'success') {
    const toastElement = document.getElementById('toastElement');
    const toastBody = document.getElementById('toastBody');
    
    toastBody.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${message}`;
    toastElement.className = `toast align-items-center border-0 ${type === 'success' ? 'bg-success' : 'bg-danger'} text-white`;
    
    const toast = new bootstrap.Toast(toastElement);
    toast.show();
}

// Load Marketplace Listings
async function loadMarketplaceListings() {
    const grid = document.getElementById('marketplaceGrid');
    const search = document.getElementById('marketplaceSearch').value;
    const filter = document.getElementById('marketplaceFilter').value;
    const sort = document.getElementById('marketplaceSort').value;
    
    grid.innerHTML = '<div class="loading-container"><div class="spinner-border text-warning" role="status"></div></div>';
    
    try {
        const params = new URLSearchParams({
            search: search,
            filter: filter,
            sort: sort
        });
        
        const response = await fetch(`api/marketplace_listings.php?${params}`);
        const data = await response.json();
        
        if (data.success && data.listings.length > 0) {
            grid.innerHTML = data.listings.map(listing => createListingCard(listing, false)).join('');
        } else {
            grid.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <div class="empty-illustration">
                        <i class="fas fa-store-slash"></i>
                    </div>
                    <h2>No hay anuncios disponibles</h2>
                    <p>Sé el primero en vender algo en el marketplace</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading marketplace:', error);
        grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <div class="empty-illustration">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h2>Error al cargar el marketplace</h2>
                <p>${error.message}</p>
            </div>
        `;
    }
}

// Load My Listings
async function loadMyListings() {
    const grid = document.getElementById('myListingsGrid');
    grid.innerHTML = '<div class="loading-container"><div class="spinner-border text-warning" role="status"></div></div>';
    
    try {
        const response = await fetch('api/my_listings.php');
        const data = await response.json();
        
        if (data.success && data.listings.length > 0) {
            grid.innerHTML = data.listings.map(listing => createListingCard(listing, true)).join('');
        } else {
            grid.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <div class="empty-illustration">
                        <i class="fas fa-box-open"></i>
                    </div>
                    <h2>No tienes anuncios</h2>
                    <p>Crea tu primer anuncio para empezar a vender</p>
                    <button class="btn-create-listing" onclick="openCreateListingModal()" style="margin-top: 1rem;">
                        <i class="fas fa-plus"></i> Crear Anuncio
                    </button>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading my listings:', error);
        grid.innerHTML = '<div class="empty-state" style="grid-column: 1 / -1;"><p>Error al cargar tus anuncios</p></div>';
    }
}

// Create Listing Card HTML
function createListingCard(listing, isOwn) {
    const isPremium = parseInt(listing.is_premium_listing) === 1;
    const prices = [];
    
    if (parseInt(listing.price_esferas) > 0) {
        prices.push(`<div class="price-option">
            <span class="price-label"><i class="fas fa-globe"></i> Esferas</span>
            <span class="price-value">${Number(listing.price_esferas).toLocaleString()}</span>
        </div>`);
    }
    if (parseInt(listing.price_llaves) > 0) {
        prices.push(`<div class="price-option">
            <span class="price-label"><i class="fas fa-key"></i> Llaves</span>
            <span class="price-value">${Number(listing.price_llaves).toLocaleString()}</span>
        </div>`);
    }
    if (parseInt(listing.price_cupones) > 0) {
        prices.push(`<div class="price-option">
            <span class="price-label"><i class="fas fa-ticket-alt"></i> Cupones</span>
            <span class="price-value">${Number(listing.price_cupones).toLocaleString()}</span>
        </div>`);
    }
    
    // Usar placeholder si no hay imagen
    const imageSrc = listing.item_image && listing.item_image !== '../images/default-item.png' ? listing.item_image : '';
    const imageHtml = imageSrc ? 
        `<img src="${imageSrc}" alt="${listing.item_name}" class="listing-image" onerror="this.style.display='none'; this.parentElement.style.background='linear-gradient(135deg, #1a1a1a, #2a2a2a)';">` : 
        `<div class="listing-image" style="background: linear-gradient(135deg, #1a1a1a, #2a2a2a); display: flex; align-items: center; justify-content: center; color: rgba(201,170,113,0.3); font-size: 3rem;"><i class="fas fa-box"></i></div>`;
    
    // Avatar del vendedor
    const avatarSrc = listing.seller_avatar && listing.seller_avatar !== '../images/default-avatar.png' ? listing.seller_avatar : '';
    const avatarHtml = avatarSrc ? 
        `<img src="${avatarSrc}" alt="${listing.seller_username}" class="seller-avatar" onerror="this.outerHTML='<div class=\\'seller-avatar\\' style=\\'background: linear-gradient(135deg, #c9aa71, #8b7355); display: flex; align-items: center; justify-content: center; color: #111; font-weight: 600; font-size: 0.9rem;\\'>${listing.seller_username.charAt(0).toUpperCase()}</div>';">` :
        `<div class="seller-avatar" style="background: linear-gradient(135deg, #c9aa71, #8b7355); display: flex; align-items: center; justify-content: center; color: #111; font-weight: 600; font-size: 0.9rem;">${listing.seller_username.charAt(0).toUpperCase()}</div>`;
    
    return `
        <article class="listing-card ${isPremium ? 'premium' : ''}">
            <figure class="listing-image-wrapper">
                ${imageHtml}
                ${isPremium ? '<div class="premium-ribbon"><i class="fas fa-crown"></i> Premium</div>' : ''}
            </figure>
            ${!isOwn ? `
            <div class="seller-info">
                ${avatarHtml}
                <span class="seller-name">${listing.seller_username}</span>
                ${listing.seller_is_premium ? '<i class="fas fa-crown" style="color: #ffd700;"></i>' : ''}
            </div>
            ` : ''}
            <div class="listing-body">
                <h3 class="listing-title">${listing.item_name}</h3>
                ${listing.item_description ? `<p class="listing-description">${listing.item_description}</p>` : ''}
                <div class="price-options">
                    ${prices.join('')}
                </div>
                ${!isOwn ? `
                    <button class="btn-buy" onclick="openBuyModal(${listing.id})">
                        <i class="fas fa-shopping-cart"></i> Comprar
                    </button>
                ` : `
                    <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.5rem;">
                        <i class="fas fa-eye"></i> ${listing.views_count || 0} vistas | 
                        <i class="fas fa-box"></i> Stock: ${listing.stock_quantity}
                        ${parseInt(listing.is_active) === 0 ? ' | <span style="color: #ff6b6b;">Inactivo</span>' : ''}
                        ${parseInt(listing.is_sold) === 1 ? ' | <span style="color: #ff6b6b;">Vendido</span>' : ''}
                    </div>
                    ${parseInt(listing.is_active) === 1 && parseInt(listing.is_sold) === 0 ? `
                        <button class="btn-delete" onclick="deleteListing(${listing.id})">
                            <i class="fas fa-trash"></i> Eliminar Anuncio
                        </button>
                    ` : ''}
                `}
            </div>
        </article>
    `;
}

// Open Create Listing Modal
async function openCreateListingModal() {
    const modal = new bootstrap.Modal(document.getElementById('createListingModal'));
    
    // Cargar inventario
    await loadInventoryForListing();
    
    // Verificar premium
    await checkPremiumStatus();
    
    // Resetear formulario
    document.getElementById('createListingForm').reset();
    document.getElementById('itemName').value = '';
    document.getElementById('itemDescription').value = '';
    
    modal.show();
}

// Load Inventory
async function loadInventoryForListing() {
    const select = document.getElementById('selectInventoryItem');
    
    try {
        const response = await fetch('api/my_inventory.php');
        const data = await response.json();
        
        if (data.success) {
            userInventory = data.inventory;
            
            select.innerHTML = '<option value="">-- Artículo personalizado (Premium) --</option>';
            
            data.inventory.forEach(item => {
                if (!item.has_active_listing) {
                    // Construir el valor con formato: tipo:id
                    const optionValue = `${item.source_type}:${item.id}`;
                    const displayName = item.display_name || item.item_name;
                    const itemInfo = item.source_type === 'ticket' ? 
                        `${item.categoria || 'General'}` : 
                        `${item.item_type}`;
                    
                    select.innerHTML += `
                        <option value="${optionValue}" 
                                data-source="${item.source_type}"
                                data-id="${item.id}"
                                data-name="${item.item_name}"
                                data-image="${item.imagen_url || ''}"
                                data-desc="${itemInfo}">
                            ${displayName} - ${itemInfo}
                        </option>
                    `;
                }
            });
            
            if (select.options.length === 1) {
                select.innerHTML += '<option value="" disabled>No tienes artículos disponibles</option>';
            }
        }
    } catch (error) {
        console.error('Error loading inventory:', error);
        select.innerHTML = '<option value="">Error al cargar inventario</option>';
    }
}

// Check Premium Status
async function checkPremiumStatus() {
    try {
        const response = await fetch('api/premium_status.php');
        const data = await response.json();
        
        isPremiumUser = data.is_premium;
        
        const customImageSection = document.getElementById('customImageSection');
        if (isPremiumUser) {
            customImageSection.style.display = 'block';
        } else {
            customImageSection.style.display = 'none';
        }
        
        // Actualizar badge en la UI
        const badge = document.getElementById('premiumStatusBadge');
        if (badge && isPremiumUser) {
            badge.innerHTML = '<div class="premium-badge"><i class="fas fa-crown"></i> Usuario Premium</div>';
        }
    } catch (error) {
        console.error('Error checking premium:', error);
    }
}

// Handle inventory selection
document.addEventListener('DOMContentLoaded', () => {
    const selectInventory = document.getElementById('selectInventoryItem');
    const itemName = document.getElementById('itemName');
    const itemDescription = document.getElementById('itemDescription');
    const stockQuantity = document.getElementById('stockQuantity');
    
    if (selectInventory) {
        selectInventory.addEventListener('change', function() {
            if (this.value) {
                const option = this.options[this.selectedIndex];
                itemName.value = option.dataset.name || '';
                if (option.dataset.desc && !itemDescription.value) {
                    itemDescription.value = option.dataset.desc;
                }
                
                // CRÍTICO: Si selecciona del inventario, forzar stock a 1 y deshabilitar
                if (stockQuantity) {
                    stockQuantity.value = 1;
                    stockQuantity.readOnly = true;
                    stockQuantity.style.background = '#2a2a2a';
                    stockQuantity.style.cursor = 'not-allowed';
                }
            } else {
                // Si deselecciona (artículo personalizado), habilitar stock
                itemName.value = '';
                if (stockQuantity && isPremiumUser) {
                    stockQuantity.readOnly = false;
                    stockQuantity.style.background = '';
                    stockQuantity.style.cursor = '';
                }
            }
        });
    }
});

// Submit Create Listing
async function submitCreateListing() {
    const form = document.getElementById('createListingForm');
    const formData = new FormData(form);
    
    // Validaciones
    const name = formData.get('item_name');
    const priceEsferas = parseInt(formData.get('price_esferas'));
    const priceLlaves = parseInt(formData.get('price_llaves'));
    const priceCupones = parseInt(formData.get('price_cupones'));
    
    if (!name) {
        showToast('Debes ingresar un nombre para el artículo', 'error');
        return;
    }
    
    if (priceEsferas <= 0 && priceLlaves <= 0 && priceCupones <= 0) {
        showToast('Debes establecer al menos un precio', 'error');
        return;
    }
    
    try {
        const response = await fetch('api/create_listing.php', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast(data.message || 'Anuncio creado exitosamente', 'success');
            bootstrap.Modal.getInstance(document.getElementById('createListingModal')).hide();
            
            // Recargar listados
            setTimeout(() => {
                loadMyListings();
                loadMarketplaceListings();
            }, 500);
        } else {
            showToast(data.message || 'Error al crear el anuncio', 'error');
        }
    } catch (error) {
        console.error('Error creating listing:', error);
        showToast('Error al conectar con el servidor', 'error');
    }
}

// Open Buy Modal
async function openBuyModal(listingId) {
    try {
        const response = await fetch(`api/marketplace_listings.php?listing_id=${listingId}`);
        const data = await response.json();
        
        if (!data.success || !data.listings || data.listings.length === 0) {
            showToast('Anuncio no encontrado', 'error');
            return;
        }
        
        const listing = data.listings[0];
        currentListingForPurchase = listing;
        
        const modalBody = document.getElementById('buyListingModalBody');
        const paymentOptions = [];
        
        if (parseInt(listing.price_esferas) > 0) {
            paymentOptions.push(`
                <div class="form-check mb-2">
                    <input class="form-check-input" type="radio" name="paymentMethod" id="payEsferas" value="esferas">
                    <label class="form-check-label" for="payEsferas">
                        <i class="fas fa-globe"></i> ${Number(listing.price_esferas).toLocaleString()} Esferas
                    </label>
                </div>
            `);
        }
        
        if (parseInt(listing.price_llaves) > 0) {
            paymentOptions.push(`
                <div class="form-check mb-2">
                    <input class="form-check-input" type="radio" name="paymentMethod" id="payLlaves" value="llaves">
                    <label class="form-check-label" for="payLlaves">
                        <i class="fas fa-key"></i> ${Number(listing.price_llaves).toLocaleString()} Llaves
                    </label>
                </div>
            `);
        }
        
        if (parseInt(listing.price_cupones) > 0) {
            paymentOptions.push(`
                <div class="form-check mb-2">
                    <input class="form-check-input" type="radio" name="paymentMethod" id="payCupones" value="cupones">
                    <label class="form-check-label" for="payCupones">
                        <i class="fas fa-ticket-alt"></i> ${Number(listing.price_cupones).toLocaleString()} Cupones Azules
                        <br><small class="text-muted">(Canjeable en Messenger)</small>
                    </label>
                </div>
            `);
        }
        
        modalBody.innerHTML = `
            <div class="mb-3">
                <h5>${listing.item_name}</h5>
                <p class="text-muted">Vendedor: ${listing.seller_username}</p>
            </div>
            <div class="mb-3">
                <label class="form-label fw-bold">Selecciona método de pago:</label>
                ${paymentOptions.join('')}
            </div>
            <div class="alert alert-warning">
                <i class="fas fa-exclamation-triangle"></i>
                Esta acción no se puede deshacer. Asegúrate de tener suficientes recursos.
            </div>
        `;
        
        const modal = new bootstrap.Modal(document.getElementById('buyListingModal'));
        modal.show();
    } catch (error) {
        console.error('Error opening buy modal:', error);
        showToast('Error al cargar detalles del anuncio', 'error');
    }
}

// Confirm Purchase
document.addEventListener('DOMContentLoaded', () => {
    const confirmBtn = document.getElementById('confirmBuyButton');
    
    if (confirmBtn) {
        confirmBtn.addEventListener('click', async () => {
            const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked');
            
            if (!paymentMethod) {
                showToast('Selecciona un método de pago', 'error');
                return;
            }
            
            if (!currentListingForPurchase) {
                showToast('Error: Anuncio no seleccionado', 'error');
                return;
            }
            
            try {
                const response = await fetch('api/buy_listing.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        listing_id: currentListingForPurchase.id,
                        payment_method: paymentMethod.value
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    showToast(data.message || 'Compra realizada con éxito', 'success');
                    bootstrap.Modal.getInstance(document.getElementById('buyListingModal')).hide();
                    
                    // Recargar página para actualizar balance
                    setTimeout(() => {
                        location.reload();
                    }, 1500);
                } else {
                    showToast(data.message || 'Error en la compra', 'error');
                }
            } catch (error) {
                console.error('Error purchasing:', error);
                showToast('Error al procesar la compra', 'error');
            }
        });
    }
});

// Delete Listing
async function deleteListing(listingId) {
    if (!confirm('¿Estás seguro de que quieres eliminar este anuncio?')) {
        return;
    }
    
    try {
        const response = await fetch('api/my_listings.php', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ listing_id: listingId })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast(data.message || 'Anuncio eliminado', 'success');
            loadMyListings();
            loadMarketplaceListings();
        } else {
            showToast(data.message || 'Error al eliminar', 'error');
        }
    } catch (error) {
        console.error('Error deleting listing:', error);
        showToast('Error al eliminar el anuncio', 'error');
    }
}

// Event Listeners for Filters
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('marketplaceSearch');
    const filterSelect = document.getElementById('marketplaceFilter');
    const sortSelect = document.getElementById('marketplaceSort');
    
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => loadMarketplaceListings(), 500);
        });
    }
    
    if (filterSelect) {
        filterSelect.addEventListener('change', () => loadMarketplaceListings());
    }
    
    if (sortSelect) {
        sortSelect.addEventListener('change', () => loadMarketplaceListings());
    }
});
