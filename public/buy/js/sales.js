// DOM elements
const pendingListDiv = document.getElementById('pendingList');
const vendorListDiv = document.getElementById('vendorList');
const saleDateInput = document.getElementById('saleDate');
const onlineAmountInput = document.getElementById('onlineAmount');
const cashAmountInput = document.getElementById('cashAmount');
const cashReceivedAmtInput = document.getElementById('cashReceivedAmt');
const pendingAmtInput = document.getElementById('pendingAmount');
const customerInput = document.getElementById('customerName');
const phoneInput = document.getElementById('customerPhone');
const vendorAmtInput = document.getElementById('vendorAmount');
const vendorInput = document.getElementById('vendorName');
const saleForm = document.getElementById('saleForm');
const addPendingBtn = document.getElementById('addPending');
const addVendorBtn = document.getElementById('addVendor');

// State
let salesData = [];
let currentEditId = null;
let pendingPayments = [];
let vendorPayments = [];
let cashReceived = 0;

// Initialize the application
async function init() {
    await loadSalesData();
    renderSalesTable();
    attachUiHandlers();
}

// Attach event listeners
function attachUiHandlers() {
    // Form submission
    if (saleForm) {
        saleForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveSale();
        });
    }

    // Add pending payment button
    if (addPendingBtn) {
        addPendingBtn.addEventListener('click', addPendingPayment);
    }

    // Add vendor payment button
    if (addVendorBtn) {
        addVendorBtn.addEventListener('click', addVendorPayment);
    }

    // Enter key in amount fields
    const inputFields = [onlineAmountInput, cashAmountInput, pendingAmtInput, cashReceivedAmtInput, vendorAmtInput];
    inputFields.forEach(input => {
        if (input) {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    if (e.target === pendingAmtInput) {
                        addPendingPayment();
                    } else if (e.target === vendorAmtInput) {
                        addVendorPayment();
                    } else if (e.target === cashReceivedAmtInput) {
                        const amount = parseFloat(cashReceivedAmtInput.value) || 0;
                        if (amount > 0) {
                            cashReceived = amount;
                            cashReceivedAmtInput.value = '';
                            renderCashReceivedList();
                        }
                    }
                }
            });
        }
    });
}

// Add pending payment
function addPendingPayment() {
    const amount = parseFloat(pendingAmtInput.value);
    const customer = customerInput.value.trim();
    const phone = phoneInput.value.trim();

    if (isNaN(amount) || amount <= 0 || !customer) {
        alert('Please enter a valid amount and customer name.');
        return;
    }

    pendingPayments.push({
        id: Date.now().toString(),
        amount,
        customer,
        phone: phone || null,
        date: new Date().toISOString()
    });

    pendingAmtInput.value = '';
    customerInput.value = '';
    phoneInput.value = '';
    renderPendingList();
}

// Render pending payments list
function renderPendingList() {
    if (!pendingListDiv) return;
    
    pendingListDiv.innerHTML = '';
    
    if (!Array.isArray(pendingPayments)) {
        pendingPayments = [];
        return;
    }
    
    pendingPayments.forEach((p, idx) => {
        if (!p) return;
        
        const phoneDisplay = p.phone ? ` (${p.phone})` : '';
        const div = document.createElement('div');
        div.className = 'pending-item d-flex justify-content-between align-items-center mb-2 p-2 border rounded';
        div.innerHTML = `
            <div class="me-3"><strong>${p.customer || 'Unknown'}</strong>${phoneDisplay}</div>
            <div class="me-3">₹${(p.amount || 0).toFixed(2)}</div>
            <button class="btn btn-sm btn-outline-danger delete-pending" data-idx="${idx}" title="Remove">
                <i class="bi bi-trash"></i>
            </button>
        `;
        pendingListDiv.appendChild(div);
    });

    // Add event listeners for delete buttons
    pendingListDiv.querySelectorAll('.delete-pending').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const idx = parseInt(btn.dataset.idx, 10);
            if (!isNaN(idx) && idx >= 0 && idx < pendingPayments.length) {
                pendingPayments.splice(idx, 1);
                renderPendingList();
            }
        });
    });
}

// Add vendor payment
function addVendorPayment() {
    const amount = parseFloat(vendorAmtInput.value);
    const vendor = vendorInput.value.trim();

    if (isNaN(amount) || amount <= 0 || !vendor) {
        alert('Please enter a valid amount and select a vendor.');
        return;
    }

    vendorPayments.push({
        id: Date.now().toString(),
        amount,
        vendor,
        date: new Date().toISOString()
    });

    vendorAmtInput.value = '';
    vendorInput.selectedIndex = 0;
    renderVendorList();
}

// Render vendor payments list
function renderVendorList() {
    if (!vendorListDiv) return;
    
    vendorListDiv.innerHTML = '';
    
    if (!Array.isArray(vendorPayments)) {
        vendorPayments = [];
        return;
    }
    
    vendorPayments.forEach((v, idx) => {
        if (!v) return;
        
        const div = document.createElement('div');
        div.className = 'vendor-item d-flex justify-content-between align-items-center mb-2 p-2 border rounded';
        div.innerHTML = `
            <div class="me-3"><strong>${v.vendor || 'Unknown'}</strong></div>
            <div class="me-3">₹${(v.amount || 0).toFixed(2)}</div>
            <button class="btn btn-sm btn-outline-danger delete-vendor" data-idx="${idx}" title="Remove">
                <i class="bi bi-trash"></i>
            </button>
        `;
        vendorListDiv.appendChild(div);
    });

    // Add event listeners for delete buttons
    vendorListDiv.querySelectorAll('.delete-vendor').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const idx = parseInt(btn.dataset.idx, 10);
            if (!isNaN(idx) && idx >= 0 && idx < vendorPayments.length) {
                vendorPayments.splice(idx, 1);
                renderVendorList();
            }
        });
    });
}

// Save sale
async function saveSale() {
    const date = saleDateInput.value;
    const online = parseFloat(onlineAmountInput.value) || 0;
    const cash = parseFloat(cashAmountInput.value) || 0;
    const cashRecvTot = cashReceived || 0;
    const pendTot = pendingPayments.reduce((s, p) => s + (p.amount || 0), 0);
    const vendTot = vendorPayments.reduce((s, v) => s + (v.amount || 0), 0);

    if (!date) {
        alert('Please select a date.');
        return;
    }

    if (online < 0 || cash < 0) {
        alert('Amounts cannot be negative.');
        return;
    }

    const sale = {
        id: currentEditId || Date.now().toString(),
        date,
        online,
        cash,
        cashReceived: cashReceived,
        pending: [...pendingPayments],
        vendors: [...vendorPayments],
        total: online + cash + cashRecvTot + pendTot + vendTot,
        timestamp: new Date().toISOString()
    };

    try {
        // Add or update in the local array
        if (currentEditId) {
            const idx = salesData.findIndex(s => s.id === currentEditId);
            if (idx !== -1) {
                salesData[idx] = sale;
            } else {
                salesData.push(sale);
            }
        } else {
            salesData.push(sale);
        }

        // Sort by date (newest first)
        salesData.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Save to JSONBin
        await writeSalesToBin(salesData);
        
        // Update UI
        renderSalesTable();
        clearForm();
        alert('Sale saved successfully!');
    } catch (err) {
        console.error('Error saving sale:', err);
        alert('Error saving sale. Please check the console for details.');
    }
}

// Edit sale
function editSale(id) {
    const sale = salesData.find(s => s.id === id);
    if (!sale) return;

    currentEditId = sale.id;
    saleDateInput.value = sale.date;
    onlineAmountInput.value = sale.online || '';
    cashAmountInput.value = sale.cash || '';
    
    // Handle cash received
    if (Array.isArray(sale.cashReceived) && sale.cashReceived.length > 0) {
        cashReceived = sale.cashReceived.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    } else {
        cashReceived = parseFloat(sale.cashReceived) || 0;
    }
    cashReceivedAmtInput.value = cashReceived;
    
    // Handle pending payments
    pendingPayments = [];
    if (Array.isArray(sale.pending)) {
        pendingPayments = sale.pending.map(item => ({
            id: item.id || Date.now().toString(),
            customer: item.customer || '',
            phone: item.phone || '',
            amount: parseFloat(item.amount) || 0,
            date: item.date || new Date().toISOString()
        }));
    }
    
    // Handle vendor payments
    vendorPayments = [];
    if (Array.isArray(sale.vendors)) {
        vendorPayments = sale.vendors.map(item => ({
            id: item.id || Date.now().toString(),
            vendor: item.vendor || '',
            amount: parseFloat(item.amount) || 0,
            date: item.date || new Date().toISOString()
        }));
    }
    
    // Update UI
    renderPendingList();
    renderVendorList();
    
    // Scroll to form
    const formElement = document.querySelector('.sale-entry');
    if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth' });
    }
}

// Delete sale
async function deleteSale(id) {
    if (!confirm('Are you sure you want to delete this sale?')) {
        return;
    }

    try {
        salesData = salesData.filter(s => s.id !== id);
        await writeSalesToBin(salesData);
        renderSalesTable();
        clearForm();
    } catch (err) {
        console.error('Error deleting sale:', err);
        alert('Error deleting sale. Please check the console for details.');
    }
}

// Clear form
function clearForm() {
    currentEditId = null;
    saleDateInput.value = new Date().toISOString().split('T')[0];
    onlineAmountInput.value = '';
    cashAmountInput.value = '';
    cashReceivedAmtInput.value = '';
    pendingAmtInput.value = '';
    customerInput.value = '';
    phoneInput.value = '';
    vendorAmtInput.value = '';
    vendorInput.selectedIndex = 0;
    
    pendingPayments = [];
    vendorPayments = [];
    cashReceived = 0;
    
    renderPendingList();
    renderVendorList();
}

// Format date
function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// Load sales data from JSONBin
async function loadSalesData() {
    try {
        const response = await fetch(`${API_BASE}/b/${BIN_ID}/latest`, {
            headers: {
                'X-Master-Key': MASTER_KEY,
                'X-Access-Key': ACCESS_KEY
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        salesData = result.record || [];
        
        // Ensure data is sorted by date (newest first)
        salesData.sort((a, b) => new Date(b.date) - new Date(a.date));
        
    } catch (err) {
        console.error('Error loading sales data:', err);
        salesData = [];
    }
}

// Save data to JSONBin
async function writeSalesToBin(data) {
    try {
        const response = await fetch(`${API_BASE}/b/${BIN_ID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': MASTER_KEY,
                'X-Access-Key': ACCESS_KEY
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (err) {
        console.error('Error saving to JSONBin:', err);
        throw err;
    }
}

// Initialize the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', init);
