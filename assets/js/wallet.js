// Wallet JavaScript for Einherjar Blitz
class WalletManager {
    constructor() {
        this.currentTerrainId = null;
        this.currentTerrainName = '';
        this.currentPrice = 0;
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadPortfolioData();
    }

    bindEvents() {
        // Eventos para modales y formularios
        document.addEventListener('DOMContentLoaded', () => {
            this.setupEventListeners();
        });
    }

    setupEventListeners() {
        // Eventos para transferencias
        const transferBtn = document.querySelector('[onclick="executeTransfer()"]');
        if (transferBtn) {
            transferBtn.onclick = () => this.executeTransfer();
        }

        // Eventos para el formulario de transferencia
        const transferAmount = document.getElementById('transferAmount');
        if (transferAmount) {
            transferAmount.addEventListener('input', () => this.validateTransferAmount());
        }

        // Eventos para búsqueda de usuarios
        const transferRecipient = document.getElementById('transferRecipient');
        if (transferRecipient) {
            transferRecipient.addEventListener('blur', () => this.validateRecipient());
        }
    }

    // Seleccionar terreno para inversión
    selectTerrain(terrainId, terrainName, price) {
        this.currentTerrainId = terrainId;
        this.currentTerrainName = terrainName;
        this.currentPrice = parseFloat(price) || 0;
        
        // Cerrar modal de selección si existe
        const investModalElement = document.getElementById('investModal');
        if (investModalElement) {
            const investModal = bootstrap.Modal.getInstance(investModalElement);
            if (investModal) {
                investModal.hide();
            }
        }
        
        setTimeout(() => {
            this.showInvestmentForm();
        }, 300);
    }

    // Mostrar formulario de inversión específico
    showInvestmentForm() {
        const modalHTML = `
            <div class="modal fade" id="specificInvestModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content bg-card border-gold">
                        <div class="modal-header border-gold-opacity">
                            <h5 class="modal-title text-gold">
                                <i class="fas fa-chart-line me-2"></i>Invertir en ${this.currentTerrainName}
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <label class="form-label">Cantidad a Invertir (ESF)</label>
                                <input type="number" class="form-control bg-dark text-white border-gold-opacity" 
                                       id="investAmount" placeholder="0.00" min="1" step="0.01">
                                <small class="text-muted">Disponible: ${window.userData.esferas.toLocaleString()} ESF</small>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Precio por Acción</label>
                                <input type="text" class="form-control bg-dark text-white border-gold-opacity" 
                                       value="${this.currentPrice.toFixed(4)} ESF" readonly>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Acciones a Recibir</label>
                                <input type="text" class="form-control bg-dark text-white border-gold-opacity" 
                                       id="sharesAmount" readonly>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Fee de Transacción (0.25%)</label>
                                <input type="text" class="form-control bg-dark text-white border-gold-opacity" 
                                       id="feeAmount" readonly>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Total a Pagar</label>
                                <input type="text" class="form-control bg-dark text-white border-gold-opacity" 
                                       id="totalAmount" readonly>
                            </div>
                        </div>
                        <div class="modal-footer border-gold-opacity">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-warning" onclick="walletManager.executeInvestment()">
                                <i class="fas fa-shopping-cart me-1"></i>Comprar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remover modal anterior si existe
        const existingModal = document.getElementById('specificInvestModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Agregar nuevo modal
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Configurar eventos del nuevo modal
        const investAmountInput = document.getElementById('investAmount');
        investAmountInput.addEventListener('input', () => this.calculateInvestment());

        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('specificInvestModal'));
        modal.show();
    }

    // Calcular inversión en tiempo real
    calculateInvestment() {
        const amount = parseFloat(document.getElementById('investAmount').value) || 0;
        const fee = amount * 0.0025; // 0.25% fee
        const netAmount = amount - fee;
        const shares = netAmount / this.currentPrice;
        const total = amount;

        document.getElementById('sharesAmount').value = shares.toFixed(8) + ' acciones';
        document.getElementById('feeAmount').value = fee.toFixed(4) + ' ESF';
        document.getElementById('totalAmount').value = total.toFixed(2) + ' ESF';
    }

    // Ejecutar inversión
    async executeInvestment() {
        const amount = parseFloat(document.getElementById('investAmount').value);
        
        if (!amount || amount <= 0) {
            this.showNotification('Por favor ingresa una cantidad válida', 'error');
            return;
        }

        if (amount > window.userData.esferas) {
            this.showNotification('No tienes suficientes esferas', 'error');
            return;
        }

        const fee = amount * 0.0025;
        const netAmount = amount - fee;
        const shares = netAmount / this.currentPrice;

        try {
            const response = await fetch('api/wallet/invest.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    terrain_id: this.currentTerrainId,
                    investment_amount: amount,
                    shares_amount: shares,
                    price_per_share: this.currentPrice,
                    fee_amount: fee
                })
            });

            const result = await response.json();

            if (result.success) {
                this.showNotification('Inversión realizada exitosamente', 'success');
                // Cerrar modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('specificInvestModal'));
                modal.hide();
                // Recargar página para mostrar cambios
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else {
                this.showNotification(result.message || 'Error en la inversión', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            this.showNotification('Error de conexión', 'error');
        }
    }

    // Validar cantidad de transferencia
    validateTransferAmount() {
        const amount = parseFloat(document.getElementById('transferAmount').value);
        const available = window.userData.esferas;
        
        if (amount > available) {
            document.getElementById('transferAmount').classList.add('is-invalid');
            return false;
        } else {
            document.getElementById('transferAmount').classList.remove('is-invalid');
            return true;
        }
    }

    // Validar destinatario
    async validateRecipient() {
        const username = document.getElementById('transferRecipient').value.trim();
        
        if (!username) return;

        try {
            const response = await fetch('api/wallet/validate_user.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username })
            });

            const result = await response.json();
            const input = document.getElementById('transferRecipient');

            if (result.success) {
                input.classList.remove('is-invalid');
                input.classList.add('is-valid');
            } else {
                input.classList.remove('is-valid');
                input.classList.add('is-invalid');
            }
        } catch (error) {
            console.error('Error validating user:', error);
        }
    }

    // Ejecutar transferencia
    async executeTransfer() {
        const recipient = document.getElementById('transferRecipient').value.trim();
        const amount = parseFloat(document.getElementById('transferAmount').value);
        const message = document.getElementById('transferMessage').value.trim();

        if (!recipient || !amount) {
            this.showNotification('Por favor completa todos los campos requeridos', 'error');
            return;
        }

        if (!this.validateTransferAmount()) {
            this.showNotification('Cantidad inválida', 'error');
            return;
        }

        try {
            const response = await fetch('api/wallet/transfer.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    recipient,
                    amount,
                    message
                })
            });

            const result = await response.json();

            if (result.success) {
                this.showNotification('Transferencia realizada exitosamente', 'success');
                // Cerrar modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('transferModal'));
                modal.hide();
                // Limpiar formulario
                document.getElementById('transferForm').reset();
                // Recargar página
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else {
                this.showNotification(result.message || 'Error en la transferencia', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            this.showNotification('Error de conexión', 'error');
        }
    }

    // Abrir modal de venta
    openSellModal(terrainId, totalShares) {
        this.currentTerrainId = terrainId;
        this.currentTotalShares = totalShares;
        
        const modalHTML = `
            <div class="modal fade" id="sellModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content" style="background: #1a1a1a; border: 1px solid #c9aa71;">
                        <div class="modal-header" style="border-bottom: 1px solid rgba(201, 170, 113, 0.3);">
                            <h5 class="modal-title text-warning">
                                <i class="fas fa-money-bill-wave me-2"></i>Vender Acciones
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="alert alert-warning" style="background: rgba(255, 193, 7, 0.1); border: 1px solid rgba(255, 193, 7, 0.3);">
                                <i class="fas fa-exclamation-triangle me-2"></i>
                                <strong>Disponible:</strong> ${parseFloat(totalShares).toFixed(4)} acciones
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label text-white">Cantidad de Acciones a Vender</label>
                                <input type="number" class="form-control" 
                                       id="sellShares" placeholder="0.0000" 
                                       min="0.0001" max="${totalShares}" step="0.0001"
                                       style="background: #2a2a2a; border: 1px solid #c9aa71; color: white;"
                                       oninput="walletManager.updateSellPreview()">
                                <div class="mt-2">
                                    <button type="button" class="btn btn-sm btn-outline-warning me-2" onclick="document.getElementById('sellShares').value = ${totalShares * 0.25}; walletManager.updateSellPreview()">25%</button>
                                    <button type="button" class="btn btn-sm btn-outline-warning me-2" onclick="document.getElementById('sellShares').value = ${totalShares * 0.5}; walletManager.updateSellPreview()">50%</button>
                                    <button type="button" class="btn btn-sm btn-outline-warning me-2" onclick="document.getElementById('sellShares').value = ${totalShares * 0.75}; walletManager.updateSellPreview()">75%</button>
                                    <button type="button" class="btn btn-sm btn-outline-warning" onclick="document.getElementById('sellShares').value = ${totalShares}; walletManager.updateSellPreview()">100%</button>
                                </div>
                            </div>
                            
                            <div class="row g-3">
                                <div class="col-md-4">
                                    <label class="form-label text-white-50">Valor Bruto</label>
                                    <div class="form-control" style="background: #2a2a2a; border: 1px solid #c9aa71; color: #28a745;" id="sellGrossValue">0.00 ESF</div>
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label text-white-50">Fee (0.25%)</label>
                                    <div class="form-control" style="background: #2a2a2a; border: 1px solid #c9aa71; color: #dc3545;" id="sellFee">0.00 ESF</div>
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label text-white-50">Total a Recibir</label>
                                    <div class="form-control fw-bold" style="background: #2a2a2a; border: 1px solid #c9aa71; color: #ffc107;" id="sellNetValue">0.00 ESF</div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer" style="border-top: 1px solid rgba(201, 170, 113, 0.3);">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-danger" onclick="walletManager.executeSell()">
                                <i class="fas fa-money-bill-wave me-1"></i>Confirmar Venta
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remover modal existente si existe
        const existingModal = document.getElementById('sellModal');
        if (existingModal) {
            existingModal.remove();
        }

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        const modal = new bootstrap.Modal(document.getElementById('sellModal'));
        modal.show();
    }

    // Actualizar preview de venta
    updateSellPreview() {
        const sharesToSell = parseFloat(document.getElementById('sellShares').value) || 0;
        
        if (sharesToSell > 0 && this.currentPrice > 0) {
            const grossValue = sharesToSell * this.currentPrice;
            const feeAmount = grossValue * 0.0025;
            const netValue = grossValue - feeAmount;
            
            document.getElementById('sellGrossValue').textContent = grossValue.toFixed(4) + ' ESF';
            document.getElementById('sellFee').textContent = feeAmount.toFixed(4) + ' ESF';
            document.getElementById('sellNetValue').textContent = netValue.toFixed(4) + ' ESF';
        } else {
            document.getElementById('sellGrossValue').textContent = '0.00 ESF';
            document.getElementById('sellFee').textContent = '0.00 ESF';
            document.getElementById('sellNetValue').textContent = '0.00 ESF';
        }
    }

    // Ejecutar venta
    async executeSell() {
        const sharesToSell = parseFloat(document.getElementById('sellShares').value);
        
        if (!sharesToSell || sharesToSell <= 0) {
            this.showNotification('Por favor ingresa una cantidad válida de acciones', 'error');
            return;
        }
        
        if (sharesToSell > this.currentTotalShares) {
            this.showNotification('No tienes suficientes acciones', 'error');
            return;
        }

        try {
            const response = await fetch('api/wallet/sell.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    terrain_id: this.currentTerrainId,
                    shares_to_sell: sharesToSell
                })
            });

            const data = await response.json();
            
            if (data.success) {
                this.showNotification('Venta realizada exitosamente', 'success');
                
                // Cerrar modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('sellModal'));
                if (modal) {
                    modal.hide();
                }
                
                // Recargar página para actualizar datos
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else {
                this.showNotification(data.message || 'Error al realizar la venta', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            this.showNotification('Error de conexión', 'error');
        }
    }

    // Cargar datos del portfolio
    async loadPortfolioData() {
        try {
            const response = await fetch('api/wallet/portfolio.php');
            const data = await response.json();
            
            if (data.success) {
                this.updatePortfolioDisplay(data.portfolio);
            }
        } catch (error) {
            console.error('Error loading portfolio:', error);
        }
    }

    // Actualizar visualización del portfolio
    updatePortfolioDisplay(portfolio) {
        // Actualizar gráficos y datos en tiempo real si es necesario
        console.log('Portfolio updated:', portfolio);
    }

    // Mostrar notificaciones
    showNotification(message, type = 'info') {
        // Crear toast notification
        const toastHTML = `
            <div class="toast align-items-center text-white bg-${type === 'success' ? 'success' : type === 'error' ? 'danger' : 'info'} border-0" role="alert">
                <div class="d-flex">
                    <div class="toast-body">
                        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'} me-2"></i>
                        ${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                </div>
            </div>
        `;

        // Agregar toast container si no existe
        if (!document.getElementById('toastContainer')) {
            document.body.insertAdjacentHTML('beforeend', 
                '<div id="toastContainer" class="toast-container position-fixed bottom-0 end-0 p-3"></div>'
            );
        }

        const container = document.getElementById('toastContainer');
        container.insertAdjacentHTML('beforeend', toastHTML);

        const toastElement = container.lastElementChild;
        const toast = new bootstrap.Toast(toastElement);
        toast.show();

        // Remover toast después de que se oculte
        toastElement.addEventListener('hidden.bs.toast', () => {
            toastElement.remove();
        });
    }
}

// Funciones globales para compatibilidad
function selectTerrain(terrainId, terrainName, price) {
    walletManager.selectTerrain(terrainId, terrainName, price);
}

function openInvestModal(terrainId) {
    // Obtener datos del terreno desde la página o hacer una petición AJAX
    fetch(`api/wallet/terrain_details.php?id=${terrainId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const terrain = data.terrain;
                walletManager.selectTerrain(terrain.id, terrain.nombre, terrain.precio_por_accion);
            } else {
                walletManager.showNotification('Error al cargar datos del terreno', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            walletManager.showNotification('Error de conexión', 'error');
        });
}

function openSellModal(terrainId, totalShares) {
    walletManager.openSellModal(terrainId, totalShares);
}

function executeTransfer() {
    walletManager.executeTransfer();
}

// Inicializar wallet manager
const walletManager = new WalletManager();

// Funciones adicionales
function logout() {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
        window.location.href = 'logout.php';
    }
}
