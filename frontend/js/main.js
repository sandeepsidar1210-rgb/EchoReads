// API Configuration
const API_BASE_URL = 'http://localhost:3000/api';

// Utility function for making API calls
async function fetchAPI(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Something went wrong');
        }
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Book related functions
async function getAllBooks(genre = null) {
    const endpoint = genre ? `/?genre=${encodeURIComponent(genre)}` : '/';
    return await fetchAPI(endpoint);
}

async function getBookDetails(bookId) {
    return await fetchAPI(`/${bookId}`);
}

async function rateBook(bookId, rating) {
    return await fetchAPI(`/books/${bookId}/rate`, {
        method: 'POST',
        body: JSON.stringify({ rating })
    });
}

async function getGenres() {
    return await fetchAPI('/genres');
}

// Novia AI Assistant functions
async function chatWithNovia(message) {
    return await fetchAPI('/novia/chat', {
        method: 'POST',
        body: JSON.stringify({ message })
    });
}

async function getBookRecommendations(preferences) {
    return await fetchAPI('/novia/recommendations', {
        method: 'POST',
        body: JSON.stringify({ preferences })
    });
}

// UI Functions
function createBookCard(book) {
    return `
        <div class="book-card bg-gray-800 rounded-lg overflow-hidden shadow-lg transform hover:scale-105 transition duration-300">
            <img src="${book.imageUrl}" alt="${book.title}" class="w-full h-48 object-cover">
            <div class="p-4">
                <h3 class="text-lg font-semibold text-white">${book.title}</h3>
                <p class="text-gray-400">${book.author}</p>
                <div class="flex items-center mt-2">
                    <span class="text-yellow-400">★</span>
                    <span class="text-gray-300 ml-1">${book.rating} (${book.totalRatings})</span>
                </div>
                <button onclick="showBookDetails('${book._id || book.id}')" 
                        class="mt-3 w-full bg-accent-teal text-white py-2 px-4 rounded hover:bg-teal-600 transition duration-300">
                    View Details
                </button>
            </div>
        </div>
    `;
}

function displayBooks(books, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = books.map(book => createBookCard(book)).join('');
}

async function showBookDetails(bookId) {
    try {
        const { data: book } = await getBookDetails(bookId);
        const modal = document.getElementById('book-details-modal');
        modal.innerHTML = `
            <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                <div class="bg-gray-800 rounded-lg max-w-2xl w-full p-6 relative">
                    <button onclick="closeModal()" class="absolute top-4 right-4 text-gray-400 hover:text-white">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                    <img src="${book.imageUrl}" alt="${book.title}" class="w-full h-64 object-cover rounded-lg">
                    <h2 class="text-2xl font-bold mt-4">${book.title}</h2>
                    <p class="text-gray-400">${book.author}</p>
                    <div class="mt-4">
                        <h3 class="text-lg font-semibold">Summary</h3>
                        <p class="text-gray-300 mt-2">${book.summary}</p>
                    </div>
                    <div class="mt-4">
                        <h3 class="text-lg font-semibold">Rating</h3>
                        <div class="flex items-center mt-2">
                            ${Array.from({ length: 5 }, (_, i) => `
                                <button onclick="rateBook('${book._id || book.id}', ${i + 1})" 
                                        class="text-2xl ${i < book.rating ? 'text-yellow-400' : 'text-gray-600'}">★</button>
                            `).join('')}
                            <span class="ml-2 text-gray-400">(${book.totalRatings} ratings)</span>
                        </div>
                    </div>
                    <div class="mt-6 flex justify-between items-center">
                        <span class="text-2xl font-bold text-accent-gold">$${book.price}</span>
                        <a href="${book.purchaseUrl ? book.purchaseUrl : '#'}" target="_blank" rel="noopener"
                           class="bg-accent-gold text-black py-2 px-6 rounded-lg hover:bg-yellow-500 transition duration-300 ${book.purchaseUrl ? '' : 'opacity-50 cursor-not-allowed pointer-events-none'}">
                            Buy Now
                        </a>
                    </div>
                </div>
            </div>
        `;
        modal.style.display = 'block';
    } catch (error) {
        alert('Error loading book details');
    }
}

function closeModal() {
    const modal = document.getElementById('book-details-modal');
    modal.style.display = 'none';
    modal.innerHTML = '';
}

// Novia Chat UI
let chatMessages = [];

function appendNoviaChatMessage(message, isUser = false) {
    const chatContainer = document.getElementById('novia-chat-messages');
    if (!chatContainer) return;

    chatMessages.push({ message, isUser });
    chatContainer.innerHTML = chatMessages.map(msg => `
        <div class="flex ${msg.isUser ? 'justify-end' : 'justify-start'} mb-4">
            <div class="${msg.isUser ? 'bg-accent-teal' : 'bg-gray-700'} rounded-lg px-4 py-2 max-w-3/4">
                ${msg.message}
            </div>
        </div>
    `).join('');
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

async function sendMessageToNovia() {
    const input = document.getElementById('novia-input');
    const message = input.value.trim();
    if (!message) return;

    input.value = '';
    appendNoviaChatMessage(message, true);

    try {
        const response = await chatWithNovia(message);
        appendNoviaChatMessage(response.response);
    } catch (error) {
        appendNoviaChatMessage('Sorry, I encountered an error. Please try again.');
    }
}

// Initialize the application
async function initializeApp() {
    try {
        const booksContainer = document.getElementById('books-container');
        const genreContainer = document.getElementById('genre-filters');

        if (booksContainer) {
            const { data: books } = await getAllBooks();
            displayBooks(books, 'books-container');
        }

        if (genreContainer) {
            const { data: genres } = await getGenres();
            genreContainer.innerHTML = genres.map(genre => `
                <button onclick="filterBooksByGenre('${genre}')" 
                        class="px-4 py-2 rounded-full border border-accent-teal text-accent-teal hover:bg-accent-teal hover:text-white transition duration-300">
                    ${genre}
                </button>
            `).join('');
        }
    } catch (error) {
        console.error('Error initializing app:', error);
    }
}

async function filterBooksByGenre(genre) {
    try {
        const { data: books } = await getAllBooks(genre);
        displayBooks(books, 'books-container');
        
        // Update active genre filter
        document.querySelectorAll('#genre-filters button').forEach(btn => {
            btn.classList.toggle('bg-accent-teal', btn.textContent.trim() === genre);
            btn.classList.toggle('text-white', btn.textContent.trim() === genre);
        });
    } catch (error) {
        console.error('Error filtering books:', error);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);