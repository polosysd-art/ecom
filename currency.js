// Currency utility
let currentCurrency = '$';

// Currency mapping
const currencyMap = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'INR': '₹',
    'SAR': '﷼',
    '₹': '₹',
    '﷼': '﷼',
    '$': '$',
    '€': '€',
    '£': '£'
};

// Load currency from settings
async function loadCurrency() {
    try {
        const { db } = await import('./firebase-config.js');
        const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');
        
        const settingsDoc = await getDoc(doc(db, 'settings', 'pages'));
        if (settingsDoc.exists()) {
            const data = settingsDoc.data();
            const currency = data.currency || '$';
            currentCurrency = currencyMap[currency] || currency;
            console.log('Loaded currency from pages:', currency, '->', currentCurrency);
        } else {
            console.log('No pages settings found, trying store settings');
            const storeDoc = await getDoc(doc(db, 'settings', 'store'));
            if (storeDoc.exists()) {
                const data = storeDoc.data();
                const currency = data.currency || '$';
                currentCurrency = currencyMap[currency] || currency;
                console.log('Loaded currency from store:', currency, '->', currentCurrency);
            }
        }
    } catch (error) {
        console.log('Currency loading error:', error);
    }
    return currentCurrency;
}

// Format price with currency
function formatPrice(amount) {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || !isFinite(numAmount)) {
        return `${currentCurrency}0.00`;
    }
    return `${currentCurrency}${numAmount.toFixed(2)}`;
}

// Export functions
window.loadCurrency = loadCurrency;
window.formatPrice = formatPrice;
window.getCurrentCurrency = () => currentCurrency;