// ============================================================
//  table-tools.js — reusable search + filter for HTML tables
// ============================================================
//
//  Usage:
//    TableTools.attach({
//      tableSelector: '#myTable',
//      searchInput:   '#mySearch',     // optional
//      filters: [
//        { id: 'filterStatus', column: 4, type: 'select', options: [...] }
//      ]
//    });
//
//  The tool works by:
//    - Reading each <tr>'s cell text (data preserved via a wrapper)
//    - Filtering rows on input change
//    - Showing an "X results" counter
//
// ============================================================

const TableTools = (() => {

    function attach({
        tableSelector,
        searchInput = null,
        filters = [],
        counterSelector = null,
        emptyMessage = 'No matching results'
    }) {
        const table = document.querySelector(tableSelector);
        if (!table) return;

        // Get data rows — skip header rows (th in first cell, or <thead>)
        const tbody = table.querySelector('tbody') || table;
        const allRows = Array.from(tbody.querySelectorAll('tr')).filter(tr => {
            // skip rows that contain <th>
            return !tr.querySelector('th');
        });

        // Snapshot original text per row (for filtering)
        allRows.forEach(tr => {
            tr.dataset.ttOriginalText = tr.textContent.toLowerCase();
            tr.dataset.ttOriginalHTML = tr.outerHTML;
        });

        // Create hidden state
        let query = '';
        const filterState = {}; // { filterId: value }

        // ---------- Counter ----------
        let counterEl = counterSelector ?
            document.querySelector(counterSelector) :
            null;

        if (!counterEl) {
            counterEl = document.createElement('div');
            counterEl.className = 'tt-counter text-muted';
            counterEl.style.cssText = 'font-size:0.85rem;margin:0.6rem 0;';
            table.parentNode.insertBefore(counterEl, table.nextSibling);
        }

        // ---------- Empty state ----------
        let emptyEl = document.createElement('div');
        emptyEl.className = 'tt-empty empty hidden';
        emptyEl.innerHTML = `<i class="fas fa-search"></i>${emptyMessage}`;
        table.parentNode.insertBefore(emptyEl, table.nextSibling);

        // ---------- Search ----------
        function bindSearch() {
            if (!searchInput) return;
            const el = document.querySelector(searchInput);
            if (!el) return;
            el.addEventListener('input', (e) => {
                query = e.target.value.trim().toLowerCase();
                apply();
            });
        }

        // ---------- Filters ----------
        function bindFilters() {
            filters.forEach(f => {
                const el = document.getElementById(f.id);
                if (!el) return;
                el.addEventListener('change', (e) => {
                    filterState[f.id] = e.target.value;
                    apply();
                });
                filterState[f.id] = el.value || ''; // init
            });
        }

        // ---------- Apply ----------
        function apply() {
            let visible = 0;

            allRows.forEach(tr => {
                // Search check
                const matchesSearch = !query || tr.dataset.ttOriginalText.includes(query);

                // Filter checks
                let matchesFilters = true;
                for (const f of filters) {
                    const val = filterState[f.id];
                    if (!val) continue;

                    // Match against the specified column's text
                    const cells = tr.querySelectorAll('td');
                    const cellText = cells[f.column]?.textContent.toLowerCase() || '';
                    if (!cellText.includes(val.toLowerCase())) {
                        matchesFilters = false;
                        break;
                    }
                }

                const show = matchesSearch && matchesFilters;
                tr.style.display = show ? '' : 'none';
                if (show) visible++;
            });

            counterEl.innerText = `${visible} of ${allRows.length} rows`;

            // Show/hide empty state
            if (visible === 0) {
                emptyEl.classList.remove('hidden');
                table.style.display = 'none';
            } else {
                emptyEl.classList.add('hidden');
                table.style.display = '';
            }
        }

        bindSearch();
        bindFilters();
        apply();

        return {
            apply,
            allRows
        };
    }

    return {
        attach
    };
})();

window.TableTools = TableTools;