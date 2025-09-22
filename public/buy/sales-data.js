// Sales Data Tracking
const SalesData = (function() {
    // Private variables
    let isInitialized = false;
    
    // Initialize the sales data module
    function init() {
        if (isInitialized) return;
        console.log('Initializing Sales Data module...');
        isInitialized = true;
    }
    
    // Record a sale in the database
    async function recordSale(itemId, portion, quantity) {
        try {
            console.log(`Recording sale: Item ${itemId}, Portion: ${portion}, Qty: ${quantity}`);
            // Add your sales recording logic here
            // Example: await db.collection('sales').add({ itemId, portion, quantity, timestamp: firebase.firestore.FieldValue.serverTimestamp() });
            return true;
        } catch (error) {
            console.error('Error recording sale:', error);
            return false;
        }
    }
    
    // Public API
    return {
        init,
        recordSale
    };
})();

// Initialize when the script loads
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
        SalesData.init();
    });
}

// Make SalesData available globally
window.SalesData = SalesData;
