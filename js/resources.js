/**
 * nlp4ed resource repository script
 * features: interactive data table, responsive grid, dynamic filtering, chart.js stats
 * aesthetic: clean shadcn-style client-side reactivity
 */

(function () {
  'use strict';

  // cached dom elements
  const searchInput = document.getElementById('resources-search');
  const searchClearBtn = document.getElementById('search-clear-btn');
  const categoryFilter = document.getElementById('category-filter');
  const beginnerToggle = document.getElementById('beginner-toggle');
  const sortSelect = document.getElementById('sort-select');
  const viewTableBtn = document.getElementById('view-table-btn');
  const viewGridBtn = document.getElementById('view-grid-btn');
  const activeFiltersBar = document.getElementById('active-filters-bar');
  const activeChipsContainer = document.getElementById('active-chips-list');
  const resultsCountEl = document.getElementById('results-count');
  const resetFiltersBtn = document.getElementById('reset-filters-btn');

  const tableContainer = document.getElementById('table-view-container');
  const gridContainer = document.getElementById('grid-view-container');
  const tableBody = document.getElementById('resources-table-body');
  const cardsGrid = document.getElementById('resources-cards-grid');
  const emptyState = document.getElementById('empty-state');

  const paginationContainer = document.getElementById('pagination-container');
  const paginationInfo = document.getElementById('pagination-info');
  const paginationActions = document.getElementById('pagination-actions');
  const pageSizeSelect = document.getElementById('page-size-select');

  const previewDialog = document.getElementById('preview-dialog');
  const dialogCloseBtn = document.getElementById('dialog-close-btn');
  const dialogTitle = document.getElementById('dialog-title');
  const dialogDomain = document.getElementById('dialog-domain');
  const dialogDesc = document.getElementById('dialog-desc');
  const dialogTags = document.getElementById('dialog-tags');
  const dialogOpenBtn = document.getElementById('dialog-open-btn');

  // dataset reference
  const allResources = Array.isArray(window.NLP4ED_RESOURCES) ? window.NLP4ED_RESOURCES : [];

  // app state (default: 35 entries per page)
  const state = {
    search: '',
    category: 'all',
    beginnerOnly: false,
    sortBy: 'default',
    viewMode: localStorage.getItem('nlp4ed_view_mode') || 'table',
    pageSize: 35,
    currentPage: 1,
    activeResource: null
  };

  // chart instances
  let categoriesChartInstance = null;
  let beginnerChartInstance = null;

  // verified badge icon for beginner-friendly items (solid rosette without check)
  const VERIFIED_ICON_HTML = `
    <span class="verified-badge-wrap" title="Beginner-Friendly" aria-label="Beginner-Friendly">
      <svg class="verified-badge-icon" viewBox="0 0 16 16" width="14" height="14" fill="#0B5035" aria-hidden="true">
        <path fill="#0B5035" d="m11.335 2.065l.076.153l.577 1.533c.045.12.14.216.261.261l1.48.555c.65.244.999.938.826 1.595l-.042.13l-.688 1.523a.45.45 0 0 0 0 .37l.653 1.439a1.34 1.34 0 0 1-.543 1.711l-.153.076l-1.533.577a.45.45 0 0 0-.261.261l-.555 1.48a1.34 1.34 0 0 1-1.595.826l-.13-.042l-1.523-.688a.45.45 0 0 0-.37 0l-1.439.654a1.34 1.34 0 0 1-1.711-.544l-.076-.153l-.577-1.533a.45.45 0 0 0-.261-.261l-1.48-.555a1.34 1.34 0 0 1-.826-1.595l.042-.13l.689-1.523a.45.45 0 0 0 0-.37l-.654-1.439a1.34 1.34 0 0 1 .543-1.711l.153-.076l1.533-.577a.45.45 0 0 0 .261-.261l.555-1.48a1.34 1.34 0 0 1 1.595-.826l.13.042l1.523.689a.45.45 0 0 0 .37 0l1.439-.654a1.34 1.34 0 0 1 1.711.543m-1.171 3.64L6.978 9.348L5.816 8.184a.447.447 0 1 0-.632.632l1.5 1.5a.447.447 0 0 0 .652-.022l3.5-4a.447.447 0 0 0-.672-.588"/>
      </svg>
    </span>
  `.trim();

  // helper: extract friendly domain name from url
  function getDomain(url) {
    try {
      const parsed = new URL(url);
      return parsed.hostname.replace(/^www\./, '');
    } catch (e) {
      return '';
    }
  }

  // helper: escape html for safe rendering
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // initialize metric numbers
  function initMetrics() {
    const totalCount = allResources.length;
    const beginnerCount = allResources.filter(r => r.beginnerFriendly).length;
    const datasetsCount = allResources.filter(r => r.tags.includes('Datasets')).length;
    const toolsAndSoftwareCount = allResources.filter(r => r.tags.includes('Tools') || r.tags.includes('Software')).length;

    const elTotal = document.getElementById('metric-total');
    const elTools = document.getElementById('metric-tools');
    const elDatasets = document.getElementById('metric-datasets');
    const elBeginner = document.getElementById('metric-beginner');

    if (elTotal) elTotal.textContent = totalCount;
    if (elTools) elTools.textContent = toolsAndSoftwareCount;
    if (elDatasets) elDatasets.textContent = datasetsCount;
    if (elBeginner) elBeginner.textContent = beginnerCount;
  }

  // initialize charts with shadcn slate theme
  function initCharts() {
    if (typeof Chart === 'undefined') {
      console.warn('chart.js not loaded');
      return;
    }

    // configure global chart defaults for minimalist aesthetic
    Chart.defaults.font.family = "'IBM Plex Mono', monospace";
    Chart.defaults.font.size = 11;
    Chart.defaults.color = '#64748b';

    // 1. categories bar chart
    const catCanvas = document.getElementById('chart-categories');
    if (catCanvas) {
      // aggregate primary categories
      const categoryCounts = {};
      allResources.forEach(item => {
        item.tags.forEach(t => {
          categoryCounts[t] = (categoryCounts[t] || 0) + 1;
        });
      });

      // pick top 8 categories for clean display
      const sortedCategories = Object.entries(categoryCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8);

      const labels = sortedCategories.map(c => c[0]);
      const data = sortedCategories.map(c => c[1]);

      const ctx = catCanvas.getContext('2d');
      categoriesChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Resources',
            data: data,
            backgroundColor: '#0f172a',
            hoverBackgroundColor: '#334155',
            borderRadius: 4,
            borderSkipped: false,
            maxBarThickness: 34
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#0f172a',
              titleColor: '#ffffff',
              bodyColor: '#e2e8f0',
              padding: 10,
              cornerRadius: 6,
              displayColors: false,
              callbacks: {
                label: function (context) {
                  return `${context.raw} resources`;
                }
              }
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: {
                color: '#64748b',
                font: { size: 10 }
              }
            },
            y: {
              grid: {
                color: '#e2e8f0',
                drawBorder: false
              },
              ticks: {
                stepSize: 5,
                color: '#94a3b8'
              }
            }
          },
          onClick: function (event, elements) {
            if (elements.length > 0) {
              const index = elements[0].index;
              const selectedCat = labels[index];
              setCategoryFilter(selectedCat);
            }
          }
        }
      });
    }

    // 2. programming language & environment polar area chart
    const formatsCanvas = document.getElementById('chart-formats') || document.getElementById('chart-beginner');
    if (formatsCanvas) {
      const techLabels = ['Web / Cloud', 'Desktop Apps', 'Python', 'R Packages', 'n8n Workflows'];
      const techData = [48, 27, 14, 4, 2];
      const categoryMap = ['Tools', 'Software', 'Python Libraries', 'R', 'Tools'];

      const ctx = formatsCanvas.getContext('2d');
      beginnerChartInstance = new Chart(ctx, {
        type: 'polarArea',
        data: {
          labels: techLabels,
          datasets: [{
            data: techData,
            backgroundColor: [
              'rgba(15, 23, 42, 0.88)',
              'rgba(51, 65, 85, 0.88)',
              'rgba(71, 85, 105, 0.88)',
              'rgba(100, 116, 139, 0.88)',
              'rgba(148, 163, 184, 0.88)'
            ],
            hoverBackgroundColor: [
              '#0f172a',
              '#334155',
              '#475569',
              '#64748b',
              '#94a3b8'
            ],
            borderWidth: 2,
            borderColor: '#ffffff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                usePointStyle: true,
                pointStyle: 'circle',
                boxWidth: 8,
                padding: 12,
                font: { size: 10 }
              }
            },
            tooltip: {
              backgroundColor: '#0f172a',
              titleColor: '#ffffff',
              bodyColor: '#e2e8f0',
              padding: 10,
              cornerRadius: 6,
              callbacks: {
                label: function (context) {
                  const val = context.raw;
                  return ` ${val} resources · click to filter`;
                }
              }
            }
          },
          scales: {
            r: {
              ticks: { display: false },
              grid: { color: '#e2e8f0' }
            }
          },
          onClick: function (event, elements) {
            if (elements.length > 0) {
              const index = elements[0].index;
              const targetCat = categoryMap[index];
              if (targetCat) {
                setCategoryFilter(targetCat);
              }
            }
          }
        }
      });
    }
  }

  // programmatically set category filter
  function setCategoryFilter(cat) {
    state.category = cat;
    if (categoryFilter) {
      categoryFilter.value = cat;
    }
    state.currentPage = 1;
    render();

    // smooth scroll to toolbar
    const toolbar = document.querySelector('.resources-toolbar');
    if (toolbar) {
      toolbar.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // filter dataset according to active filters
  function getFilteredResources() {
    let result = allResources.slice();

    // 1. search query
    if (state.search.trim()) {
      const q = state.search.toLowerCase().trim();
      result = result.filter(item => {
        const titleMatch = item.title.toLowerCase().includes(q);
        const descMatch = (item.description || '').toLowerCase().includes(q);
        const tagMatch = item.tags.some(t => t.toLowerCase().includes(q));
        const domainMatch = getDomain(item.url).toLowerCase().includes(q);
        return titleMatch || descMatch || tagMatch || domainMatch;
      });
    }

    // 2. category filter
    if (state.category !== 'all') {
      result = result.filter(item => item.tags.includes(state.category));
    }

    // 3. beginner-friendly filter
    if (state.beginnerOnly) {
      result = result.filter(item => item.beginnerFriendly);
    }

    // 4. sorting
    switch (state.sortBy) {
      case 'title-asc':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'title-desc':
        result.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case 'beginner-first':
        result.sort((a, b) => (b.beginnerFriendly ? 1 : 0) - (a.beginnerFriendly ? 1 : 0));
        break;
      case 'category':
        result.sort((a, b) => (a.tags[0] || '').localeCompare(b.tags[0] || ''));
        break;
      default:
        // preserve original curated notion order
        result.sort((a, b) => a.id - b.id);
        break;
    }

    return result;
  }

  // render active filter chips
  function renderActiveChips(filteredCount) {
    if (!activeChipsContainer || !activeFiltersBar) return;

    activeChipsContainer.innerHTML = '';
    const hasActiveFilters = Boolean(
      state.search.trim() || state.category !== 'all' || state.beginnerOnly || state.sortBy !== 'default'
    );

    if (!hasActiveFilters) {
      activeFiltersBar.style.display = 'none';
      return;
    }

    activeFiltersBar.style.display = 'flex';

    // search chip
    if (state.search.trim()) {
      const chip = document.createElement('div');
      chip.className = 'filter-chip';
      chip.innerHTML = `search: "${escapeHtml(state.search)}" <span class="filter-chip-remove" data-action="clear-search">&times;</span>`;
      activeChipsContainer.appendChild(chip);
    }

    // category chip
    if (state.category !== 'all') {
      const chip = document.createElement('div');
      chip.className = 'filter-chip';
      chip.innerHTML = `category: ${escapeHtml(state.category)} <span class="filter-chip-remove" data-action="clear-category">&times;</span>`;
      activeChipsContainer.appendChild(chip);
    }

    // beginner chip
    if (state.beginnerOnly) {
      const chip = document.createElement('div');
      chip.className = 'filter-chip';
      chip.innerHTML = `level: beginner-friendly <span class="filter-chip-remove" data-action="clear-beginner">&times;</span>`;
      activeChipsContainer.appendChild(chip);
    }

    // count indicator
    if (resultsCountEl) {
      resultsCountEl.textContent = `showing ${filteredCount} of ${allResources.length} resources`;
    }
  }

  // generate tag badges markup - by NLP4Ed tag is always first!
  function createTagBadges(tags) {
    const sortedTags = tags.slice().sort((a, b) => {
      if (a === 'by NLP4Ed') return -1;
      if (b === 'by NLP4Ed') return 1;
      return 0;
    });

    return sortedTags.map(tag => {
      let extraClass = '';
      if (tag === 'by NLP4Ed') extraClass = 'badge-inhouse';
      return `<span class="shadcn-badge ${extraClass}">${escapeHtml(tag)}</span>`;
    }).join(' ');
  }

  // render table rows (without level column, with verified badge next to title)
  function renderTableRows(items) {
    if (!tableBody) return;

    const rowsHtml = items.map(item => {
      const domain = getDomain(item.url);
      const verifiedIcon = item.beginnerFriendly ? VERIFIED_ICON_HTML : '';

      const descSnippet = item.description
        ? escapeHtml(item.description)
        : '<span style="color: var(--fg-faint); font-style: italic;">No description provided.</span>';

      return `
        <tr data-id="${item.id}">
          <td class="table-title-cell">
            <div style="display: flex; align-items: center; gap: 0.35rem; min-width: 0;">
              <a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer" class="resource-title-link" title="${escapeHtml(item.title)}">
                ${escapeHtml(item.title)}
              </a>
              ${verifiedIcon}
            </div>
            <span class="resource-domain-badge">${escapeHtml(domain)}</span>
          </td>
          <td class="table-tags-cell">
            <div class="tags-badge-group">
              ${createTagBadges(item.tags)}
            </div>
          </td>
          <td class="table-desc-cell">
            <div class="table-desc-text" title="${escapeHtml(item.description)}">
              ${descSnippet}
            </div>
          </td>
          <td style="text-align: right; white-space: nowrap;">
            <div style="display: inline-flex; gap: 0.35rem;">
              <button class="btn-shadcn btn-shadcn-ghost btn-shadcn-sm btn-quick-view" data-id="${item.id}" title="Quick Details">
                Details
              </button>
              <a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer" class="btn-shadcn btn-shadcn-outline btn-shadcn-sm">
                Open
              </a>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    tableBody.innerHTML = rowsHtml;
  }

  // render grid cards
  function renderGridCards(items) {
    if (!cardsGrid) return;

    const cardsHtml = items.map(item => {
      const domain = getDomain(item.url);
      const verifiedIcon = item.beginnerFriendly ? VERIFIED_ICON_HTML : '';

      const descSnippet = item.description
        ? escapeHtml(item.description)
        : '<span style="color: var(--fg-faint); font-style: italic;">No description provided. Click open to visit.</span>';

      return `
        <article class="resource-grid-card" data-id="${item.id}">
          <div class="card-top">
            <div class="card-header-row">
              <span class="card-domain">${escapeHtml(domain)}</span>
            </div>
            <h3 class="card-title" style="display: flex; align-items: center; gap: 0.35rem; min-width: 0; width: 100%;">
              <a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; min-width: 0; flex: 1 1 auto;" title="${escapeHtml(item.title)}">
                ${escapeHtml(item.title)}
              </a>
              <span style="flex-shrink: 0; display: inline-flex;">${verifiedIcon}</span>
            </h3>
            <p class="card-description">
              ${descSnippet}
            </p>
          </div>
          <div class="card-footer">
            <div class="tags-badge-group">
              ${createTagBadges(item.tags)}
            </div>
            <div style="display: flex; gap: 0.35rem; flex-shrink: 0; margin-left: auto;">
              <button class="btn-shadcn btn-shadcn-ghost btn-shadcn-sm btn-quick-view" data-id="${item.id}">
                Details
              </button>
              <a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer" class="btn-shadcn btn-shadcn-primary btn-shadcn-sm">
                Open
              </a>
            </div>
          </div>
        </article>
      `;
    }).join('');

    cardsGrid.innerHTML = cardsHtml;
  }

  // render pagination controls
  function renderPagination(totalItems) {
    if (!paginationContainer || !paginationInfo || !paginationActions) return;

    if (state.pageSize === 'all' || totalItems <= state.pageSize) {
      paginationContainer.style.display = totalItems > 0 ? 'flex' : 'none';
      paginationInfo.textContent = `showing all ${totalItems} resources`;
      paginationActions.innerHTML = '';
      return;
    }

    paginationContainer.style.display = 'flex';
    const pageSize = Number(state.pageSize);
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIdx = (state.currentPage - 1) * pageSize + 1;
    const endIdx = Math.min(state.currentPage * pageSize, totalItems);

    paginationInfo.textContent = `showing ${startIdx}–${endIdx} of ${totalItems} resources`;

    // generate pagination buttons
    let buttonsHtml = '';
    
    // prev button
    buttonsHtml += `
      <button class="page-num-btn" data-page="${state.currentPage - 1}" ${state.currentPage === 1 ? 'disabled' : ''} aria-label="Previous Page">
        &lsaquo;
      </button>
    `;

    // page numbers
    for (let p = 1; p <= totalPages; p++) {
      if (
        p === 1 ||
        p === totalPages ||
        (p >= state.currentPage - 1 && p <= state.currentPage + 1)
      ) {
        const isActive = p === state.currentPage ? 'active' : '';
        buttonsHtml += `<button class="page-num-btn ${isActive}" data-page="${p}">${p}</button>`;
      } else if (
        (p === state.currentPage - 2 && p > 1) ||
        (p === state.currentPage + 2 && p < totalPages)
      ) {
        buttonsHtml += `<span style="padding: 0 4px; color: var(--fg-faint);">&hellip;</span>`;
      }
    }

    // next button
    buttonsHtml += `
      <button class="page-num-btn" data-page="${state.currentPage + 1}" ${state.currentPage === totalPages ? 'disabled' : ''} aria-label="Next Page">
        &rsaquo;
      </button>
    `;

    paginationActions.innerHTML = buttonsHtml;
  }

  // main render routine
  function render() {
    const filtered = getFilteredResources();
    const totalItems = filtered.length;

    renderActiveChips(totalItems);

    if (totalItems === 0) {
      if (tableContainer) tableContainer.style.display = 'none';
      if (gridContainer) gridContainer.style.display = 'none';
      if (paginationContainer) paginationContainer.style.display = 'none';
      if (emptyState) emptyState.style.display = 'block';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';

    // apply pagination slice
    let paginatedItems = filtered;
    if (state.pageSize !== 'all') {
      const pageSize = Number(state.pageSize);
      const totalPages = Math.ceil(totalItems / pageSize);
      if (state.currentPage > totalPages) state.currentPage = 1;
      const start = (state.currentPage - 1) * pageSize;
      paginatedItems = filtered.slice(start, start + pageSize);
    }

    // toggle view containers
    if (state.viewMode === 'table') {
      if (tableContainer) tableContainer.style.display = 'block';
      if (gridContainer) gridContainer.style.display = 'none';
      renderTableRows(paginatedItems);
    } else {
      if (tableContainer) tableContainer.style.display = 'none';
      if (gridContainer) gridContainer.style.display = 'block';
      renderGridCards(paginatedItems);
    }

    renderPagination(totalItems);
  }

  // view switcher
  function setViewMode(mode) {
    state.viewMode = mode;
    localStorage.setItem('nlp4ed_view_mode', mode);

    if (mode === 'table') {
      if (viewTableBtn) viewTableBtn.classList.add('active');
      if (viewGridBtn) viewGridBtn.classList.remove('active');
    } else {
      if (viewGridBtn) viewGridBtn.classList.add('active');
      if (viewTableBtn) viewTableBtn.classList.remove('active');
    }

    render();
  }

  // quick details modal
  function openDetailsModal(id) {
    const item = allResources.find(r => r.id === Number(id));
    if (!item || !previewDialog) return;

    state.activeResource = item;
    const domain = getDomain(item.url);

    if (dialogTitle) dialogTitle.textContent = item.title;
    if (dialogDomain) dialogDomain.textContent = domain;
    if (dialogDesc) {
      dialogDesc.textContent = item.description || 'No detailed description provided.';
    }
    if (dialogTags) {
      dialogTags.innerHTML = createTagBadges(item.tags);
    }
    if (dialogOpenBtn) {
      dialogOpenBtn.href = item.url;
    }

    // disable background scroll when popup is open
    document.body.style.overflow = 'hidden';
    previewDialog.showModal();
  }

  // close details modal and restore scrolling
  function closeDetailsModal() {
    if (previewDialog) {
      previewDialog.close();
    }
    document.body.style.overflow = '';
  }

  // attach event listeners
  function setupEvents() {
    // search input
    if (searchInput) {
      searchInput.addEventListener('input', e => {
        state.search = e.target.value;
        state.currentPage = 1;
        if (searchClearBtn) {
          if (state.search.length > 0) {
            searchClearBtn.classList.add('visible');
          } else {
            searchClearBtn.classList.remove('visible');
          }
        }
        render();
      });

      // keyboard shortcut (ctrl+k / cmd+k)
      window.addEventListener('keydown', e => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
          e.preventDefault();
          searchInput.focus();
        }
      });
    }

    // search clear button
    if (searchClearBtn) {
      searchClearBtn.addEventListener('click', () => {
        state.search = '';
        if (searchInput) searchInput.value = '';
        searchClearBtn.classList.remove('visible');
        state.currentPage = 1;
        render();
      });
    }

    // category dropdown
    if (categoryFilter) {
      categoryFilter.addEventListener('change', e => {
        state.category = e.target.value;
        state.currentPage = 1;
        render();
      });
    }

    // beginner friendly toggle button
    if (beginnerToggle) {
      beginnerToggle.addEventListener('click', () => {
        state.beginnerOnly = !state.beginnerOnly;
        beginnerToggle.classList.toggle('active', state.beginnerOnly);
        state.currentPage = 1;
        render();
      });
    }

    // sort dropdown
    if (sortSelect) {
      sortSelect.addEventListener('change', e => {
        state.sortBy = e.target.value;
        state.currentPage = 1;
        render();
      });
    }

    // page size select
    if (pageSizeSelect) {
      pageSizeSelect.addEventListener('change', e => {
        const val = e.target.value;
        state.pageSize = val === 'all' ? 'all' : Number(val);
        state.currentPage = 1;
        render();
      });
    }

    // view switcher buttons
    if (viewTableBtn) {
      viewTableBtn.addEventListener('click', () => setViewMode('table'));
    }
    if (viewGridBtn) {
      viewGridBtn.addEventListener('click', () => setViewMode('grid'));
    }

    // pagination delegate
    if (paginationActions) {
      paginationActions.addEventListener('click', e => {
        const btn = e.target.closest('.page-num-btn');
        if (btn && !btn.disabled && btn.dataset.page) {
          state.currentPage = Number(btn.dataset.page);
          render();
          const target = document.querySelector('.resources-toolbar') || document.querySelector('.table-container-outer');
          if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      });
    }

    // active chips clicks & reset
    if (activeChipsContainer) {
      activeChipsContainer.addEventListener('click', e => {
        const target = e.target.closest('.filter-chip-remove');
        if (!target) return;
        const action = target.dataset.action;
        if (action === 'clear-search') {
          state.search = '';
          if (searchInput) searchInput.value = '';
          if (searchClearBtn) searchClearBtn.classList.remove('visible');
        } else if (action === 'clear-category') {
          state.category = 'all';
          if (categoryFilter) categoryFilter.value = 'all';
        } else if (action === 'clear-beginner') {
          state.beginnerOnly = false;
          if (beginnerToggle) beginnerToggle.classList.remove('active');
        }
        state.currentPage = 1;
        render();
      });
    }

    if (resetFiltersBtn) {
      resetFiltersBtn.addEventListener('click', () => {
        state.search = '';
        state.category = 'all';
        state.beginnerOnly = false;
        state.sortBy = 'default';
        if (searchInput) searchInput.value = '';
        if (searchClearBtn) searchClearBtn.classList.remove('visible');
        if (categoryFilter) categoryFilter.value = 'all';
        if (beginnerToggle) beginnerToggle.classList.remove('active');
        if (sortSelect) sortSelect.value = 'default';
        state.currentPage = 1;
        render();
      });
    }

    // table sortable header clicks
    const sortableHeaders = document.querySelectorAll('.shadcn-table th.sortable');
    sortableHeaders.forEach(th => {
      th.addEventListener('click', () => {
        const sortField = th.dataset.sort;
        if (sortField === 'title') {
          state.sortBy = state.sortBy === 'title-asc' ? 'title-desc' : 'title-asc';
        } else if (sortField === 'category') {
          state.sortBy = state.sortBy === 'category' ? 'default' : 'category';
        }
        if (sortSelect) sortSelect.value = state.sortBy;
        render();
      });
    });

    // delegate click for "details" modal button
    document.addEventListener('click', e => {
      const btn = e.target.closest('.btn-quick-view');
      if (btn && btn.dataset.id) {
        openDetailsModal(btn.dataset.id);
      }
    });

    // dialog close & backdrop click & escape listener
    if (dialogCloseBtn && previewDialog) {
      dialogCloseBtn.addEventListener('click', closeDetailsModal);
      previewDialog.addEventListener('click', e => {
        if (e.target === previewDialog) closeDetailsModal();
      });
      previewDialog.addEventListener('close', () => {
        document.body.style.overflow = '';
      });
    }
  }

  // boot routine
  function init() {
    initMetrics();
    initCharts();
    setupEvents();
    setViewMode(state.viewMode);
  }

  // run when dom ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
