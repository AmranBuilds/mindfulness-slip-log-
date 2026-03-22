// --- 1. Setup and Variables ---
const STORAGE_KEY = 'mindful_slips';
let slips = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
let myChart = null; // Holds the Chart.js instance

// DOM Elements
const fab = document.getElementById('fab');
const entryFormModal = document.getElementById('entryFormModal');
const cancelEntryBtn = document.getElementById('cancelEntryBtn');
const saveEntryBtn = document.getElementById('saveEntryBtn');
const downloadCsvBtn = document.getElementById('downloadCsvBtn');
const toggleDataBtn = document.getElementById('toggleDataBtn');
const rawDataContainer = document.getElementById('rawDataContainer');
const timeFilter = document.getElementById('timeFilter');
const categoryFilter = document.getElementById('categoryFilter');
const totalSlipsCount = document.getElementById('totalSlipsCount');

// Set default date to today
document.getElementById('slipDate').valueAsDate = new Date();

// --- 2. Form Open/Close Logic ---
fab.addEventListener('click', () => {
    entryFormModal.classList.remove('hidden');
});

cancelEntryBtn.addEventListener('click', () => {
    entryFormModal.classList.add('hidden');
    clearForm();
});

function clearForm() {
    document.getElementById('slipDate').valueAsDate = new Date();
    document.getElementById('slipCategory').value = '';
    document.getElementById('slipSituation').value = '';
    document.getElementById('slipConsequences').value = '';
}

// --- 3. Saving Data ---
saveEntryBtn.addEventListener('click', () => {
    const date = document.getElementById('slipDate').value;
    const category = document.getElementById('slipCategory').value;
    const situation = document.getElementById('slipSituation').value;
    const consequences = document.getElementById('slipConsequences').value;

    if (!date || !category) {
        alert("Date and Category are required.");
        return;
    }

    const newSlip = {
        id: Date.now(),
        date: date,
        category: category,
        situation: situation,
        consequences: consequences
    };

    slips.push(newSlip);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slips));
    
    entryFormModal.classList.add('hidden');
    clearForm();
    updateDashboard();
});

// --- 4. CSV Download Logic ---
downloadCsvBtn.addEventListener('click', () => {
    if (slips.length === 0) {
        alert("No data to download.");
        return;
    }

    // Create CSV headers
    let csvContent = "Date,Category,Situation,Consequences\n";

    // Format data rows
    slips.forEach(slip => {
        // Escape quotes and commas by wrapping text in double quotes
        const safeSituation = `"${slip.situation.replace(/"/g, '""')}"`;
        const safeConsequences = `"${slip.consequences.replace(/"/g, '""')}"`;
        csvContent += `${slip.date},${slip.category},${safeSituation},${safeConsequences}\n`;
    });

    // Create invisible download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "mindfulness_backup.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

// --- 5. Dashboard Filters and Display ---
timeFilter.addEventListener('change', updateDashboard);
categoryFilter.addEventListener('change', updateDashboard);
toggleDataBtn.addEventListener('click', () => {
    rawDataContainer.classList.toggle('hidden');
    toggleDataBtn.textContent = rawDataContainer.classList.contains('hidden') ? 'View Raw Entries' : 'Hide Raw Entries';
});

function updateDashboard() {
    const timeVal = timeFilter.value;
    const catVal = categoryFilter.value;
    const now = new Date();
    
    // Filter data
    const filteredSlips = slips.filter(slip => {
        const slipDate = new Date(slip.date);
        let timeMatch = false;
        
        // Time filter logic
        if (timeVal === 'today') {
            timeMatch = slipDate.toDateString() === now.toDateString();
        } else if (timeVal === 'week') {
            const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            timeMatch = slipDate >= oneWeekAgo;
        } else if (timeVal === 'month') {
            const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            timeMatch = slipDate >= oneMonthAgo;
        } else if (timeVal === 'year') {
            const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            timeMatch = slipDate >= oneYearAgo;
        } else {
            timeMatch = true;
        }

        // Category filter logic
        const catMatch = catVal === 'all' || slip.category === catVal;

        return timeMatch && catMatch;
    });

    // Update total count
    totalSlipsCount.textContent = filteredSlips.length;

    // Update Raw Data View
    renderRawData(filteredSlips);

    // Update Chart
    renderChart(filteredSlips);
}

function renderRawData(data) {
    rawDataContainer.innerHTML = '';
    if (data.length === 0) {
        rawDataContainer.innerHTML = '<p>No entries found for this filter.</p>';
        return;
    }
    
    // Sort newest first
    const sortedData = [...data].sort((a, b) => new Date(b.date) - new Date(a.date));

    sortedData.forEach(slip => {
        const div = document.createElement('div');
        div.style.borderBottom = "1px solid #ccc";
        div.style.paddingBottom = "10px";
        div.style.marginBottom = "10px";
        div.innerHTML = `
            <strong>${slip.date} - ${slip.category}</strong><br>
            <em>Situation:</em> ${slip.situation || 'N/A'}<br>
            <em>Consequences:</em> ${slip.consequences || 'N/A'}
        `;
        rawDataContainer.appendChild(div);
    });
}

function renderChart(data) {
    const ctx = document.getElementById('slipChart').getContext('2d');
    
    // Group data by date for the chart
    const dateCounts = {};
    data.forEach(slip => {
        dateCounts[slip.date] = (dateCounts[slip.date] || 0) + 1;
    });

    // Sort dates chronologically
    const sortedDates = Object.keys(dateCounts).sort((a, b) => new Date(a) - new Date(b));
    const counts = sortedDates.map(date => dateCounts[date]);

    if (myChart) {
        myChart.destroy(); // Remove old chart before drawing a new one
    }

    myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedDates,
            datasets: [{
                label: 'Slips per Day',
                data: counts,
                backgroundColor: '#007bff',
            }]
        },
        options: {
            scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1 } }
            }
        }
    });
}
// Initial load
updateDashboard();
