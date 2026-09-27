<!-- Modal: Crear Anuncio -->
<div class="modal fade" id="createListingModal" tabindex="-1" aria-labelledby="createListingModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="createListingModalLabel">
                    <i class="fas fa-plus-circle"></i> Vender Artículo
                </h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
            </div>
            <div class="modal-body">
                <form id="createListingForm" enctype="multipart/form-data">
                    <div class="mb-3">
                        <label class="form-label">
                            <i class="fas fa-box"></i> Selecciona desde tu inventario
                        </label>
                        <select class="form-select" id="selectInventoryItem" name="reward_id">
                            <option value="">Cargando inventario...</option>
                        </select>
                        <small class="text-muted">
                            <i class="fas fa-info-circle"></i> 
                            Selecciona un artículo de tu inventario o crea uno personalizado (Premium)
                        </small>
                    </div>
                    
                    <div class="mb-3">
                        <label class="form-label">
                            <i class="fas fa-tag"></i> Nombre del artículo *
                        </label>
                        <input type="text" class="form-control" id="itemName" name="item_name" required>
                    </div>
                    
                    <div class="mb-3">
                        <label class="form-label">
                            <i class="fas fa-align-left"></i> Descripción
                        </label>
                        <textarea class="form-control" id="itemDescription" name="item_description" rows="3" placeholder="Describe tu artículo..."></textarea>
                    </div>
                    
                    <div class="mb-3" id="customImageSection" style="display: none;">
                        <label class="form-label">
                            <i class="fas fa-image"></i> Imagen personalizada 
                            <span class="premium-badge" style="font-size: 0.7rem; padding: 0.2rem 0.5rem;">
                                <i class="fas fa-crown"></i> Premium
                            </span>
                        </label>
                        <input type="file" class="form-control" id="itemImage" name="item_image" accept="image/*">
                        <small class="text-muted">Solo usuarios premium pueden subir imágenes personalizadas</small>
                    </div>
                    
                    <div class="row mb-3">
                        <div class="col-md-4">
                            <label class="form-label">
                                <i class="fas fa-globe"></i> Precio en Esferas
                            </label>
                            <input type="number" class="form-control" id="priceEsferas" name="price_esferas" min="0" value="0">
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">
                                <i class="fas fa-key"></i> Precio en Llaves
                            </label>
                            <input type="number" class="form-control" id="priceLlaves" name="price_llaves" min="0" value="0">
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">
                                <i class="fas fa-ticket-alt"></i> Cupones Azules
                            </label>
                            <input type="number" class="form-control" id="priceCupones" name="price_cupones" min="0" value="0">
                        </div>
                    </div>
                    
                    <div class="mb-3">
                        <label class="form-label">
                            <i class="fas fa-warehouse"></i> Cantidad en stock
                        </label>
                        <input type="number" class="form-control" id="stockQuantity" name="stock_quantity" min="1" value="1">
                    </div>
                    
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle"></i>
                        <strong>Nota:</strong> Debes establecer al menos un precio. Los cupones azules se canjean en el grupo de Messenger.
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                    <i class="fas fa-times"></i> Cancelar
                </button>
                <button type="button" class="btn btn-primary" onclick="submitCreateListing()">
                    <i class="fas fa-check"></i> Crear Anuncio
                </button>
            </div>
        </div>
    </div>
</div>

<!-- Modal: Comprar del Marketplace -->
<div class="modal fade" id="buyListingModal" tabindex="-1" aria-labelledby="buyListingModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="buyListingModalLabel">
                    <i class="fas fa-shopping-cart"></i> Confirmar Compra
                </h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
            </div>
            <div class="modal-body" id="buyListingModalBody">
                <!-- Se llenará dinámicamente -->
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                    <i class="fas fa-times"></i> Cancelar
                </button>
                <button type="button" class="btn btn-primary" id="confirmBuyButton">
                    <i class="fas fa-check-circle"></i> Confirmar Compra
                </button>
            </div>
        </div>
    </div>
</div>

<!-- Modal: Feedback Toast -->
<div id="feedbackToast" class="position-fixed top-0 end-0 p-3" style="z-index: 9999;">
    <div id="toastElement" class="toast align-items-center border-0" role="alert" aria-live="assertive" aria-atomic="true">
        <div class="d-flex">
            <div class="toast-body" id="toastBody">
                <!-- Mensaje dinámico -->
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    </div>
</div>
