document.addEventListener('DOMContentLoaded', function () {
    loadStocks().then((stockList) => {
        setupCustomDropdown(stockList)
    });
    const activePage = localStorage.getItem('activePage') || 'homePage';
    loadPage(activePage);
});

// Caution: Should only be called once and after the DOM is fully loaded
function setupCustomDropdown(stocks) {
    const searchInput = document.getElementById('searchInput');
    const dropdownMenu = document.getElementById('dropdownMenu');

    // Handle input event on search box
    searchInput.addEventListener('input', function () {
        const searchTerm = searchInput.value.toLowerCase().trim();

        // Clear previous results
        dropdownMenu.innerHTML = '';

        // Filter stocks based on search term
        const filteredStocks = stocks.filter(stock =>
            stock.name.toLowerCase().includes(searchTerm) ||
            stock.code.toLowerCase().includes(searchTerm)
        );

        // Populate dropdown with filtered stocks
        filteredStocks.forEach(stock => {
            const listItem = document.createElement('li');
            listItem.textContent = `${stock.name} (${stock.code})`;
            listItem.className = 'p-4 hover:bg-neutral-600 cursor-pointer';

            // Handle click event when selecting an option
            listItem.addEventListener('click', function () {
                searchInput.value = stock.name + ' (' + stock.code + ')'; // Set input value
                searchInput.dataset.selectedCode = stock.code; // Store selected stock code as data
                dropdownMenu.classList.add('hidden'); // Hide dropdown
            });

            dropdownMenu.appendChild(listItem);
        });

        // Show dropdown if filtered stocks are available
        if (filteredStocks.length > 0) {
            dropdownMenu.classList.remove('hidden');
        } else {
            const noResultItem = document.createElement('li');
            noResultItem.textContent = 'No results found';
            noResultItem.className = 'p-4 text-gray-500';
            dropdownMenu.appendChild(noResultItem);
            dropdownMenu.classList.remove('hidden');
        }
    });

    // Hide dropdown when clicking outside the input or dropdown
    document.addEventListener('click', function (event) {
        if (!document.getElementById('customDropdown').contains(event.target)) {
            dropdownMenu.classList.add('hidden');
        }
    });

    // Show dropdown when input is focused and not empty
    searchInput.addEventListener('focus', function () {
        if (searchInput.value.trim() !== '') {
            dropdownMenu.classList.remove('hidden');
        }
    });
}


async function loadStocks() {
    // check if the list of stocks already on local storage to faster the loading
    const stocks = localStorage.getItem('stocks');
    if (stocks) {
        const data = JSON.parse(stocks);
        console.log('Stocks loaded from local storage: ', data.length + ' stocks');
        // populateDropdown(data);
        return data;
    } else {
        try {
            const response = await fetch('/list-stock', {
                method: 'GET',
            });

            if (!response.ok) {
                new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Successfully fetched stocks: ', data.length + ' stocks');
            // Save to local storage and populate dropdown
            localStorage.setItem('stocks', JSON.stringify(data));
            // populateDropdown(data);
            return data;
        } catch (error) {
            console.error('Error fetching stocks:', error);
        }
    }
}

// function populateDropdown(stocks) {
//     const dropdown = document.getElementById('stockDropdown');
//     dropdown.innerHTML = '<option value="" disabled selected>Select Stock code</option>';
//     stocks.forEach(stock => {
//         const option = document.createElement('option');
//         option.value = stock.code;
//         option.textContent = stock.name + ' (' + stock.code + ')';
//         dropdown.appendChild(option);
//     });
// }

function predictNextMove() {
    const dropdown = document.getElementById('stockDropdown');
    const selectedStock = dropdown.value;
    if (selectedStock) {
        alert(`Predicting next move for ${selectedStock}...`);
    } else {
        alert('Please select a stock code.');
    }
}

function loadPage(pageId) {
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.add('hidden'));

    const activePage = document.getElementById(pageId);
    if (activePage) {
        activePage.classList.remove('hidden');
        localStorage.setItem('activePage', pageId);
    }
}