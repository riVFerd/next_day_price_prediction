document.addEventListener('alpine:initializing', function () {
    Alpine.store('activePage', {
        init() {
            this.load(this.value);
        },
        value: Alpine.$persist('homePage').as('activePage'),
        load(pageId) {
            this.value = pageId;
        }
    });

    Alpine.store('stockQuotes', {
            init() {
                this.loadData().then(() => {
                    this.filteredList = this.value;
                    setupCustomDropdown(this.value, (filteredList) => {
                        this.filteredList = filteredList;
                    }, (newSearchInput, newSelectedCode) => {
                        this.searchInput = newSearchInput;
                        this.selectedCode = newSelectedCode;
                    });
                });
            },
            value: Alpine.$persist([]).as('stockQuotes'),
            filteredList: [],
            searchInput: '',
            selectedCode: '',
            selectStock(stock) {
                this.searchInput = `(${stock.code}) - ${stock.name} `;
                this.selectedCode = stock.code;
                this.filteredList = this.value;
                document.getElementById('dropdownMenu').classList.add('hidden');
            },
            async loadData() {
                if (this.value.length > 0) {
                    console.log('Stock quotes already loaded: ', this.value.length + ' stocks');
                    return;
                }
                try {
                    const response = await fetch('/list-stock');

                    if (!response.ok) {
                        new Error(`HTTP error! Status: ${response.status}`);
                    }

                    const data = await response.json();
                    console.log('Successfully fetched stocks: ', data.length + ' stocks');
                    this.value = data;
                } catch (error) {
                    console.error('Error fetching stocks:', error);
                    this.value = [];
                }
            },
        }
    );
})


class Debouncer {
    constructor(delay = 300) {
        this.delay = delay;
        this.timeoutId = null;
    }

    debounce(callback) {
        clearTimeout(this.timeoutId);
        this.timeoutId = setTimeout(callback, this.delay);
    }
}

// Caution: Should only be called once and after the DOM is fully loaded
function setupCustomDropdown(stocks, setFilteredList, setSelected) {
    const searchInput = document.getElementById('searchInput');
    const dropdownMenu = document.getElementById('dropdownMenu');

    const debouncer = new Debouncer(300);

    // Handle input event on search box
    searchInput.addEventListener('input', function () {
        const searchTerm = searchInput.value.toLowerCase().trim();

        debouncer.debounce(() => {
            // Filter stocks based on search term
            const filteredStocks = stocks.filter(stock =>
                stock.name.toLowerCase().includes(searchTerm) ||
                stock.code.toLowerCase().includes(searchTerm)
            );
            setFilteredList(filteredStocks);
        })
    });

    // Hide dropdown when clicking outside the input or dropdown
    document.addEventListener('click', function (event) {
        if (!document.getElementById('customDropdown').contains(event.target)) {
            dropdownMenu.classList.add('hidden');
        }
    });

    // Show dropdown when input is focused and not empty
    searchInput.addEventListener('focus', function () {
        dropdownMenu.classList.remove('hidden');
    });
}

function predictNextMove() {
    const dropdown = document.getElementById('stockDropdown');
    const selectedStock = dropdown.value;
    if (selectedStock) {
        alert(`Predicting next move for ${selectedStock}...`);
    } else {
        alert('Please select a stock code.');
    }
}