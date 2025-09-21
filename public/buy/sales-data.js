// Sales data structure
const salesData = {
    // Format: "YYYY-MM-DD": { "dishId": { "portion": quantity } }
    // Example:
    // "2023-09-22": {
    //     "1": { "half": 2, "full": 1 },
    //     "2": { "full": 3 }
    // }
};

// Function to get today's date in YYYY-MM-DD format
function getCurrentDate() {
    const today = new Date();
    return today.toISOString().split('T')[0];
}

// Function to record a sale
function recordSale(dishId, portion = 'full', quantity = 1) {
    const today = getCurrentDate();
    
    // Initialize date entry if it doesn't exist
    if (!salesData[today]) {
        salesData[today] = {};
    }
    
    // Initialize dish entry if it doesn't exist
    if (!salesData[today][dishId]) {
        salesData[today][dishId] = {};
    }
    
    // Initialize portion count if it doesn't exist, otherwise increment
    if (!salesData[today][dishId][portion]) {
        salesData[today][dishId][portion] = 0;
    }
    
    salesData[today][dishId][portion] += quantity;
    
    // Save to localStorage
    saveSalesData();
    
    console.log(`Recorded sale: ${quantity}x ${portion} of dish ${dishId} on ${today}`);
}

// Function to get sales for a specific date
function getSalesForDate(date) {
    return salesData[date] || {};
}

// Function to get sales for a specific dish
function getDishSales(dishId) {
    const result = {};
    for (const [date, dishes] of Object.entries(salesData)) {
        if (dishes[dishId]) {
            result[date] = dishes[dishId];
        }
    }
    return result;
}

// Function to get total sales for a dish across all dates
function getTotalDishSales(dishId) {
    let total = 0;
    const dishSales = getDishSales(dishId);
    
    for (const portions of Object.values(dishSales)) {
        for (const count of Object.values(portions)) {
            total += count;
        }
    }
    
    return total;
}

// Save sales data to localStorage
function saveSalesData() {
    try {
        localStorage.setItem('salesData', JSON.stringify(salesData));
    } catch (error) {
        console.error('Error saving sales data:', error);
    }
}

// Load sales data from localStorage
function loadSalesData() {
    try {
        const savedData = localStorage.getItem('salesData');
        if (savedData) {
            const parsedData = JSON.parse(savedData);
            // Merge with existing data
            Object.assign(salesData, parsedData);
        }
    } catch (error) {
        console.error('Error loading sales data:', error);
    }
}

// Initialize by loading saved data
loadSalesData();

// Export functions for use in other files
window.SalesData = {
    recordSale,
    getSalesForDate,
    getDishSales,
    getTotalDishSales,
    getCurrentDate
};
