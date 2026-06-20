const API_URL = 'http://localhost:5000/api';
let isRegistering = false;

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadPosts();
});

// --- AUTHENTICATION ---
function toggleAuthModal() {
    const modal = document.getElementById('auth-modal');
    modal.classList.toggle('hidden');
}

function toggleAuthMode() {
    isRegistering = !isRegistering;
    document.getElementById('modal-title').innerText = isRegistering ? 'Register' : 'Login';
}

async function handleAuth() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const endpoint = isRegistering ? '/register' : '/login';

    const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    if (res.ok) {
        if (!isRegistering) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('username', data.username);
            localStorage.setItem('userId', data.userId);
            checkAuth();
            toggleAuthModal();
        } else {
            alert('Registered successfully! Please login.');
            toggleAuthMode();
        }
    } else {
        alert(data.error);
    }
}

function checkAuth() {
    const token = localStorage.getItem('token');
    const authSection = document.getElementById('auth-section');
    const createPostSection = document.getElementById('create-post-section');

    if (token) {
        authSection.innerHTML = `
            <span class="mr-4 font-semibold">Hi, ${localStorage.getItem('username')}</span>
            <button onclick="logout()" class="text-red-500 font-bold hover:underline">Logout</button>
        `;
        createPostSection.classList.remove('hidden');
    } else {
        authSection.innerHTML = `<button onclick="toggleAuthModal()" class="bg-blue-600 text-white px-4 py-2 rounded shadow">Login / Register</button>`;
        createPostSection.classList.add('hidden');
    }
}

function logout() {
    localStorage.clear();
    checkAuth();
}

// --- POSTS & INTERACTIONS ---
async function createPost() {
    const content = document.getElementById('post-content').value;
    if (!content) return;

    await fetch(`${API_URL}/posts`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ content })
    });

    document.getElementById('post-content').value = '';
    loadPosts();
}

async function loadPosts() {
    const res = await fetch(`${API_URL}/posts`);
    const posts = await res.json();
    const feed = document.getElementById('feed');
    feed.innerHTML = '';

    const currentUserId = localStorage.getItem('userId');

    posts.forEach(post => {
        const isLiked = post.likes.includes(currentUserId);
        
        const postElement = document.createElement('div');
        postElement.className = 'bg-white p-5 rounded-lg shadow-sm border border-gray-200';
        postElement.innerHTML = `
            <div class="flex justify-between items-center mb-3">
                <span class="font-bold text-gray-800 cursor-pointer hover:underline" onclick="followUser('${post.user._id}')">@${post.user.username}</span>
                <span class="text-xs text-gray-500">${new Date(post.createdAt).toLocaleDateString()}</span>
            </div>
            <p class="text-gray-700 mb-4">${post.content}</p>
            <div class="flex items-center space-x-4 border-t pt-3">
                <button onclick="toggleLike('${post._id}')" class="${isLiked ? 'text-red-500' : 'text-gray-500'} hover:text-red-600 font-semibold flex items-center">
                    ❤️ ${post.likes.length}
                </button>
                <button onclick="toggleCommentBox('${post._id}')" class="text-gray-500 hover:text-blue-600 font-semibold">
                    💬 ${post.comments.length}
                </button>
            </div>
            
            <div id="comments-${post._id}" class="hidden mt-4 bg-gray-50 p-3 rounded-lg">
                <div class="max-h-32 overflow-y-auto mb-2 space-y-2">
                    ${post.comments.map(c => `<div class="text-sm"><span class="font-bold">@${c.username}:</span> ${c.text}</div>`).join('')}
                </div>
                <div class="flex gap-2">
                    <input type="text" id="comment-input-${post._id}" class="flex-1 border rounded p-1 text-sm" placeholder="Add a comment...">
                    <button onclick="addComment('${post._id}')" class="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600">Send</button>
                </div>
            </div>
        `;
        feed.appendChild(postElement);
    });
}

async function toggleLike(postId) {
    if (!localStorage.getItem('token')) return alert("Please login to like!");
    await fetch(`${API_URL}/posts/${postId}/like`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    loadPosts();
}

function toggleCommentBox(postId) {
    document.getElementById(`comments-${postId}`).classList.toggle('hidden');
}

async function addComment(postId) {
    if (!localStorage.getItem('token')) return alert("Please login to comment!");
    const text = document.getElementById(`comment-input-${postId}`).value;
    if (!text) return;

    await fetch(`${API_URL}/posts/${postId}/comment`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ text })
    });
    loadPosts();
}

async function followUser(targetUserId) {
    if (!localStorage.getItem('token')) return alert("Please login to follow users!");
    
    const res = await fetch(`${API_URL}/users/${targetUserId}/follow`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    
    const data = await res.json();
    alert(data.message || data.error);
}