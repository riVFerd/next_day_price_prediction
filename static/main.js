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
                    setupCustomDropdown(
                        this.value,
                        (filteredList) => this.filteredList = filteredList,
                        () => this.selectedCode = '',
                    );
                });
            },
            value: Alpine.$persist([]).as('stockQuotes'),
            filteredList: [],
            searchInput: '',
            selectedCode: '',
            selectStock(stock) {
                this.searchInput = `(${stock.code}) - ${stock.name}`;
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


    Alpine.store('stockPredictions', {
        prediction: '',
        lastKnownDate: '',
        isLoading: false,
        error: '',
        history: Alpine.$persist([]).as('stockHistory'),
        itemsPerPage: 10,
        currentPage: 1,
        get paginatedHistory() {
            const start = (this.currentPage - 1) * this.itemsPerPage;
            const end = start + this.itemsPerPage;
            return this.history.slice(start, end);
        },
        get totalPages() {
            return Math.ceil(this.history.length / this.itemsPerPage);
        },
        async predictNextMove(stockCode) {
            this.isLoading = true;
            this.error = '';
            this.prediction = '';
            try {
                const response = await fetch('/predict', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({'stock_code': stockCode})
                });

                if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

                const data = await response.json();

                if (data.error !== undefined) throw new Error(data.error);

                this.prediction = (data.prediction === '0') ? 'Downtrend' : (data.prediction === '1') ? 'Neutral' : 'Uptrend';
                this.lastKnownDate = data.last_date;

                this.history.unshift({
                    stock_code: stockCode,
                    date: data.last_date,
                    prediction: this.prediction,
                });
            } catch (e) {
                console.error('Error predicting stock:', e);
                this.error = e;
            } finally {
                this.isLoading = false;
            }
        }
    })
})

// Caution: Should only be called once and after the DOM is fully loaded
function setupCustomDropdown(stocks, setFilteredList, resetSelectedCode) {
    const searchInput = document.getElementById('searchInput');
    const dropdownMenu = document.getElementById('dropdownMenu');

    const debouncer = new Debouncer(300);

    // Handle input event on search box
    searchInput.addEventListener('input', function (event) {
        if (event.inputType === 'deleteContentBackward') {
            resetSelectedCode();
        }
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

    // Show dropdown when input is focused
    searchInput.addEventListener('focus', function () {
        dropdownMenu.classList.remove('hidden');
    });
}