// Search Page JavaScript
// Use a single global for API base to avoid re-declaration across multiple scripts
if (!window.API_BASE) {
    window.API_BASE = '/api';
}

// Open document for a search result
function openResultDocument(result) {
    if (!result) return;
    if (result.documentId) {
        const url = `${window.API_BASE}/documents/${result.documentId}/file`;
        openInNewTab(url);
    }
}

function openResultDocumentById(documentId) {
    if (!documentId) return;
    const url = `${window.API_BASE}/documents/${documentId}/file`;
    openInNewTab(url);
}

function openInNewTab(url) {
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// Global variables
let currentPage = 1;
let totalPages = 1;
let currentResults = [];
let searchQuery = '';
const PAGE_SIZE = 10; // client-side pagination size

// DOM elements
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const fileTypeFilter = document.getElementById('fileTypeFilter');
const searchMode = document.getElementById('searchMode');
const dateFilter = document.getElementById('dateFilter');
const clearFiltersBtn = document.getElementById('clearFilters');
const sortBy = document.getElementById('sortBy');
const resultsContainer = document.getElementById('resultsContainer');
const resultsCount = document.getElementById('resultsCount');
const pagination = document.getElementById('pagination');
const prevPageBtn = document.getElementById('prevPage');
const nextPageBtn = document.getElementById('nextPage');
const pageNumbers = document.getElementById('pageNumbers');

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    loadSearchSuggestions();
});

// Initialize event listeners
function initializeEventListeners() {
    // Search button click
    searchBtn.addEventListener('click', performSearch);
    
    // Enter key in search input
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    
    // Filter changes
    fileTypeFilter.addEventListener('change', performSearch);
    if (searchMode) searchMode.addEventListener('change', performSearch);
    dateFilter.addEventListener('change', performSearch);
    sortBy.addEventListener('change', performSearch);
    
    // Clear filters
    clearFiltersBtn.addEventListener('click', clearFilters);
    
    // Pagination
    prevPageBtn.addEventListener('click', () => changePage(currentPage - 1));
    nextPageBtn.addEventListener('click', () => changePage(currentPage + 1));
    
    // Suggestion tags
    document.querySelectorAll('.suggestion-tag').forEach(tag => {
        tag.addEventListener('click', function() {
            const query = this.getAttribute('data-query');
            searchInput.value = query;
            performSearch();
        });
    });
}

// Perform search
async function performSearch() {
    const query = searchInput.value.trim();
    const fileType = fileTypeFilter.value; // not supported in backend yet
    const mode = (searchMode?.value) || 'find_keywords';
    const dateRange = dateFilter.value; // not supported in backend yet
    const sortByValue = sortBy.value; // client-side only for now

    searchQuery = query;
    currentPage = 1;

    showLoading();

    try {
        let results = [];

        if (mode === 'find_documents') {
            // Fetch documents and filter by filename (case-insensitive contains)
            const resp = await fetch(`${window.API_BASE}/documents`);
            if (!resp.ok) throw new Error(`Documents fetch failed: ${resp.status}`);
            const docs = await resp.json();
            const q = (query || '').toLowerCase();
            const filtered = (docs || []).filter(d => (d.originalFilename || '').toLowerCase().includes(q));
            // Map to display shape used by renderer
            results = filtered.map(d => ({
                documentId: d.id,
                filename: d.originalFilename,
                content: d.contentSummary || '',
                pageNumber: null,
                slideNumber: null,
                topic: '',
                sectionTitle: ''
            }));
        } else {
            // Keyword search via backend Lucene
            const params = new URLSearchParams();
            params.append('q', query || '');
            params.append('maxResults', 1000);
            const response = await fetch(`${window.API_BASE}/search?${params.toString()}`);
            if (!response.ok) throw new Error(`Search failed: ${response.status} ${response.statusText}`);
            const data = await response.json();
            results = Array.isArray(data) ? data : [];
        }

        // Client-side sort
        if (sortByValue === 'filename') {
            results.sort((a, b) => (a.filename || '').localeCompare(b.filename || ''));
        }

        // dateRange and fileType not supported in backend; could be filtered client-side if fields existed
        currentResults = results;
        displaySearchResults({});
    } catch (error) {
        console.error('Search error:', error);
        showError('Search failed. Please try again.');
    }
}

// Display search results
function displaySearchResults(_data) {
    const totalResults = currentResults.length;

    // Update results count
    resultsCount.textContent = `${totalResults} result${totalResults !== 1 ? 's' : ''} found`;

    if (totalResults === 0) {
        showNoResults();
        return;
    }

    // Clear container
    resultsContainer.innerHTML = '';

    // Client-side pagination slice
    const start = (currentPage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    const pageItems = currentResults.slice(start, end);

    // Add results
    pageItems.forEach(result => {
        const resultElement = createResultElement(result);
        resultsContainer.appendChild(resultElement);
    });

    // Update pagination
    updatePagination({ totalElements: totalResults, size: PAGE_SIZE });
}

// Create result element
function createResultElement(result) {
    const resultDiv = document.createElement('div');
    resultDiv.className = 'search-result';
    
    const documentName = result.filename || 'Unknown Document';
    const pageInfo = result.pageNumber ? `Page ${result.pageNumber}` : '';
    const slideInfo = result.slideNumber ? `Slide ${result.slideNumber}` : '';
    const location = [pageInfo, slideInfo].filter(Boolean).join(', ');
    
    // Highlight search terms in content
    let highlightedContent = result.content || '';
    if (searchQuery) {
        const regex = new RegExp(`(${searchQuery})`, 'gi');
        highlightedContent = highlightedContent.replace(regex, '<span class="result-highlight">$1</span>');
    }
    const previewContent = truncateHtml(highlightedContent, 360);
    
    resultDiv.innerHTML = `
        <div class="result-header">
            <div>
                <div class="result-title">${documentName}</div>
                <div class="result-meta">
                    ${location ? `<span><i class='bx bx-file'></i>${location}</span>` : ''}
                    ${result.topic ? `<span><i class='bx bx-tag'></i>${result.topic}</span>` : ''}
                    ${result.wordCount ? `<span><i class='bx bx-text'></i>${result.wordCount} words</span>` : ''}
                </div>
            </div>
        </div>
        <div class="result-content" data-full="1">${previewContent}</div>
        <div class="result-footer">
            <div class="result-tags">
                ${result.topic ? `<span class="result-tag">${result.topic}</span>` : ''}
                ${result.sectionTitle ? `<span class="result-tag">${result.sectionTitle}</span>` : ''}
            </div>
            <div class="result-actions">
                ${result.documentId ? `<button class="btn-link" data-open>Open document</button>` : ''}
                <button class="btn-link" data-toggle>Show more</button>
            </div>
        </div>
    `;
    
    // Wire explicit open button only
    const openBtn = resultDiv.querySelector('[data-open]');
    if (openBtn && result.documentId) {
        openBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openResultDocumentById(result.documentId);
        });
    }

    // Wire expand/collapse
    const contentEl = resultDiv.querySelector('.result-content');
    const toggleBtn = resultDiv.querySelector('[data-toggle]');
    let expanded = false;
    if (toggleBtn && contentEl) {
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            expanded = !expanded;
            if (expanded) {
                contentEl.innerHTML = highlightedContent;
                contentEl.classList.add('expanded');
                toggleBtn.textContent = 'Show less';
            } else {
                contentEl.innerHTML = previewContent;
                contentEl.classList.remove('expanded');
                toggleBtn.textContent = 'Show more';
            }
        });
    }
    
    return resultDiv;
}

// Truncate HTML string safely by characters (keeps tags in simple cases)
function truncateHtml(html, maxLen) {
    if (!html) return '';
    if (html.length <= maxLen) return html;
    const truncated = html.slice(0, maxLen);
    // Try to avoid cutting inside an HTML entity or tag
    const lastOpen = truncated.lastIndexOf('<');
    const lastClose = truncated.lastIndexOf('>');
    let safe = truncated;
    if (lastOpen > lastClose) {
        safe = truncated.slice(0, lastOpen);
    }
    return safe + '…';
}

// Show loading state
function showLoading() {
    resultsContainer.innerHTML = `
        <div class="loading">
            <i class='bx bx-loader-alt'></i>
            <p>Searching your documents...</p>
        </div>
    `;
    resultsCount.textContent = 'Searching...';
    pagination.style.display = 'none';
}

// Show no results
function showNoResults() {
    resultsContainer.innerHTML = `
        <div class="no-results">
            <i class='bx bx-search-alt'></i>
            <h3>No results found</h3>
            <p>Try adjusting your search terms or filters</p>
        </div>
    `;
    resultsCount.textContent = '0 results found';
    pagination.style.display = 'none';
}

// Show error
function showError(message) {
    resultsContainer.innerHTML = `
        <div class="no-results">
            <i class='bx bx-error-circle'></i>
            <h3>Search Error</h3>
            <p>${message}</p>
        </div>
    `;
    resultsCount.textContent = 'Search failed';
    pagination.style.display = 'none';
}

// Update pagination
function updatePagination(data) {
    const totalElements = data.totalElements || data.totalResults || 0;
    const size = data.size || PAGE_SIZE;
    totalPages = Math.ceil(totalElements / size);
    
    if (totalPages <= 1) {
        pagination.style.display = 'none';
        return;
    }
    
    pagination.style.display = 'flex';
    
    // Update page buttons
    prevPageBtn.disabled = currentPage <= 1;
    nextPageBtn.disabled = currentPage >= totalPages;
    
    // Update page numbers
    pageNumbers.innerHTML = '';
    
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    
    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('div');
        pageBtn.className = `page-number ${i === currentPage ? 'active' : ''}`;
        pageBtn.textContent = i;
        pageBtn.addEventListener('click', () => changePage(i));
        pageNumbers.appendChild(pageBtn);
    }
}

// Change page
async function changePage(page) {
    if (page < 1 || page > totalPages) return;

    currentPage = page;
    displaySearchResults({ totalElements: currentResults.length, size: PAGE_SIZE });

    // Scroll to top of results
    resultsContainer.scrollIntoView({ behavior: 'smooth' });
}

// Clear filters
function clearFilters() {
    searchInput.value = '';
    fileTypeFilter.value = '';
    if (searchMode) searchMode.value = 'find_keywords';
    dateFilter.value = '';
    sortBy.value = 'relevance';
    
    // Reset to initial state
    currentPage = 1;
    searchQuery = '';
    showNoResults();
}

// Load search suggestions
async function loadSearchSuggestions() {
    const partial = (searchInput?.value || '').trim();
    if (!partial) return; // backend requires q param; skip when empty
    try {
        const response = await fetch(`${window.API_BASE}/search/suggestions?q=${encodeURIComponent(partial)}&maxSuggestions=10`);
        if (response.ok) {
            const suggestions = await response.json();
            updateSuggestionTags(suggestions);
        }
    } catch (error) {
        console.error('Failed to load suggestions:', error);
    }
}

// Update suggestion tags
function updateSuggestionTags(suggestions) {
    const suggestionTags = document.querySelector('.suggestion-tags');
    if (!suggestionTags || !suggestions.length) return;
    
    suggestionTags.innerHTML = '';
    
    suggestions.slice(0, 6).forEach(suggestion => {
        const tag = document.createElement('span');
        tag.className = 'suggestion-tag';
        tag.textContent = suggestion;
        tag.setAttribute('data-query', suggestion);
        tag.addEventListener('click', function() {
            searchInput.value = suggestion;
            performSearch();
        });
        suggestionTags.appendChild(tag);
    });
}

// Format date
function formatDate(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    
    return date.toLocaleDateString();
}

// Notification system (reused from dashboard.js)
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class='bx ${getNotificationIcon(type)}'></i>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">
            <i class='bx bx-x'></i>
        </button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

function getNotificationIcon(type) {
    switch (type) {
        case 'success': return 'bx-check-circle';
        case 'error': return 'bx-error-circle';
        case 'warning': return 'bx-warning';
        default: return 'bx-info-circle';
    }
}


