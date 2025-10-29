// --- Global Data Store (Connected to C++ backend) ---
let repositories = [];
let tasks = [];
let currentRepoName = '';
let currentFileName = '';
let undoStack = [];
let redoStack = [];

// --- Backend Communication ---
async function loadDataFromBackend() {
    // First try to load from localStorage (user's changes)
    if (loadFromLocalStorage()) {
        return;
    }
    
    // Then try to load from C++ backend data.json
    try {
        const response = await fetch('data.json');
        if (response.ok) {
            const data = await response.json();
            repositories = data.repositories || [];
            console.log('Data loaded from C++ backend:', repositories);
            // Save to localStorage for persistence
            localStorage.setItem('githubSimulatorData', JSON.stringify(repositories));
        } else {
            console.log('No data.json found, using fallback data');
            loadFallbackData();
        }
    } catch (error) {
        console.log('Using fallback data - C++ backend not running');
        loadFallbackData();
    }
}

function loadFallbackData() {
    repositories = [
        {
            name: 'LeetCode',
            description: 'DSA Questions',
            createdDate: '10/4/2025',
            isPrivate: false,
            files: [
                {
                    name: 'LeetCodeSolutions.js',
                    info: 'JavaScript solutions for LeetCode problems',
                    date: 'a few seconds ago',
                    content: `// LeetCode Solutions in JavaScript

// Two Sum Problem
function twoSum(nums, target) {
    const map = new Map();
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (map.has(complement)) {
            return [map.get(complement), i];
        }
        map.set(nums[i], i);
    }
    return [];
}

// Reverse Linked List
function reverseList(head) {
    let prev = null;
    let current = head;
    
    while (current !== null) {
        let next = current.next;
        current.next = prev;
        prev = current;
        current = next;
    }
    
    return prev;
}

// Binary Search
function binarySearch(nums, target) {
    let left = 0;
    let right = nums.length - 1;
    
    while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        if (nums[mid] === target) {
            return mid;
        } else if (nums[mid] < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }
    
    return -1;
}`
                },
                {
                    name: 'README.md',
                    info: 'Project documentation and setup instructions',
                    date: '2 minutes ago',
                    content: `# LeetCode Solutions

This repository contains my solutions to various LeetCode problems.

## Structure
- Each solution includes time and space complexity analysis
- Solutions are organized by difficulty level
- Test cases are provided for each problem

## Languages Used
- JavaScript (Primary)
- Python (Secondary)

## How to Run
1. Clone the repository
2. Navigate to the problem folder
3. Run the solution file

## Progress
- Easy: 25 problems solved
- Medium: 15 problems solved  
- Hard: 5 problems solved

Happy coding! 🚀`
                }
            ],
            commits: [
                {
                    message: 'First commit: Added LeetCodeSolutions.js',
                    author: 'Shiwani',
                    date: 'October 7, 2025'
                },
                {
                    message: 'Added README.md with project documentation',
                    author: 'Shiwani',
                    date: 'October 7, 2025'
                }
            ]
        }
    ];
    // Save fallback data to localStorage
    localStorage.setItem('githubSimulatorData', JSON.stringify(repositories));
}

// Simulate API calls to C++ backend and save to localStorage
async function callBackendAPI(method, endpoint, data = null) {
    // In a real implementation, this would make HTTP requests to the C++ server
    // For now, we'll simulate the API calls and save data locally
    console.log(`API Call: ${method} ${endpoint}`, data);
    
    // Save current repositories to localStorage to persist changes
    localStorage.setItem('githubSimulatorData', JSON.stringify(repositories));
    
    // Simulate API response
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({ success: true, message: 'Operation completed' });
        }, 100);
    });
}

// Load data from localStorage if available
function loadFromLocalStorage() {
    const savedData = localStorage.getItem('githubSimulatorData');
    if (savedData) {
        try {
            repositories = JSON.parse(savedData);
            console.log('Data loaded from localStorage:', repositories);
            return true;
        } catch (error) {
            console.log('Error loading from localStorage:', error);
        }
    }
    return false;
}

// --- Undo/Redo/History Functionality ---
async function performUndo() {
    if (undoStack.length === 0) {
        showNotification('Nothing to undo', 'info');
        return;
    }
    
    const currentState = {
        action: 'Current State',
        description: 'Before undo',
        repositories: JSON.parse(JSON.stringify(repositories)),
        timestamp: new Date().toLocaleString()
    };
    
    const lastState = undoStack.pop();
    redoStack.push(currentState);
    
    // Restore previous state
    repositories = JSON.parse(JSON.stringify(lastState.repositories));
    
    // Save to localStorage
    localStorage.setItem('githubSimulatorData', JSON.stringify(repositories));
    
    // Refresh UI
    if (window.location.pathname.includes('repo.html')) {
        renderRepoPageContent();
        updateUndoRedoCounts();
    } else {
        renderDashboard();
    }
    
    showNotification(`Undid: ${lastState.description}`, 'success');
    console.log(`Undid: ${lastState.description}`);
}

async function performRedo() {
    if (redoStack.length === 0) {
        showNotification('Nothing to redo', 'info');
        return;
    }
    
    const currentState = {
        action: 'Current State',
        description: 'Before redo',
        repositories: JSON.parse(JSON.stringify(repositories)),
        timestamp: new Date().toLocaleString()
    };
    
    const nextState = redoStack.pop();
    undoStack.push(currentState);
    
    // Restore next state
    repositories = JSON.parse(JSON.stringify(nextState.repositories));
    
    // Save to localStorage
    localStorage.setItem('githubSimulatorData', JSON.stringify(repositories));
    
    // Refresh UI
    if (window.location.pathname.includes('repo.html')) {
        renderRepoPageContent();
        updateUndoRedoCounts();
    } else {
        renderDashboard();
    }
    
    showNotification(`Redid: ${nextState.description}`, 'success');
    console.log(`Redid: ${nextState.description}`);
}

async function showHistory() {
    try {
        // Create and show history modal
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 800px;">
                <span class="close-button" onclick="this.closest('.modal').remove()">&times;</span>
                <h2>Action History</h2>
                
                <div class="history-section">
                    <h3>Undo Stack (${undoStack.length} action${undoStack.length !== 1 ? 's' : ''})</h3>
                    <div class="stack-container">
                        ${undoStack.length > 0 ? 
                            undoStack.map((action, index) => `
                                <div class="stack-item">
                                    <span class="stack-item-index">${undoStack.length - index}.</span>
                                    <span class="stack-item-action">${action.action}</span>
                                    <span class="stack-item-details">${action.description}</span>
                                    <span class="stack-item-time">${action.timestamp}</span>
                                </div>
                            `).join('') : 
                            '<div class="empty-state">No actions to undo</div>'
                        }
                    </div>
                </div>
                
                <div class="history-section">
                    <h3>Redo Stack (${redoStack.length} action${redoStack.length !== 1 ? 's' : ''})</h3>
                    <div class="stack-container">
                        ${redoStack.length > 0 ? 
                            redoStack.map((action, index) => `
                                <div class="stack-item">
                                    <span class="stack-item-index">${index + 1}.</span>
                                    <span class="stack-item-action">${action.action}</span>
                                    <span class="stack-item-details">${action.description}</span>
                                    <span class="stack-item-time">${action.timestamp}</span>
                                </div>
                            `).join('') : 
                            '<div class="empty-state">No actions to redo</div>'
                        }
                    </div>
                </div>
                
                <div class="modal-actions">
                    <button class="modal-btn" onclick="this.closest('.modal').remove()">Close</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'flex';
        
        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
    } catch (error) {
        console.error('Error loading history:', error);
        showNotification('Error loading history: ' + error.message, 'error');
    }
}

// Helper function to show notifications
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Function to update the undo/redo counts in the UI
function updateUndoRedoCounts() {
    const undoCountElement = document.getElementById('undo-count');
    const redoCountElement = document.getElementById('redo-count');
    
    if (undoCountElement) {
        undoCountElement.textContent = undoStack.length;
    }
    if (redoCountElement) {
        redoCountElement.textContent = redoStack.length;
    }
}

// --- Search Functionality ---
let searchTimeout;

function searchRepositories() {
    clearTimeout(searchTimeout);
    
    searchTimeout = setTimeout(() => {
        const searchTerm = document.getElementById('repoSearchInput').value.toLowerCase();
        if (!searchTerm) {
            renderRepositories(repositories);
            return;
        }
        
        // First try to search using the backend API
        fetch(`/api/search/repos/${encodeURIComponent(searchTerm)}`)
            .then(response => response.json())
            .then(data => {
                if (data.results && data.results.length > 0) {
                    // Filter repositories based on search results from backend
                    const filteredRepos = repositories.filter(repo => 
                        data.results.some(result => 
                            result.toLowerCase() === repo.name.toLowerCase()
                        )
                    );
                    renderRepositories(filteredRepos);
                } else {
                    // Fallback to client-side search if no results from backend
                    const filteredRepos = repositories.filter(repo => 
                        repo.name.toLowerCase().includes(searchTerm) || 
                        (repo.description && repo.description.toLowerCase().includes(searchTerm))
                    );
                    renderRepositories(filteredRepos);
                }
            })
            .catch(error => {
                console.error('Error searching repositories:', error);
                // Fallback to client-side search on error
                const filteredRepos = repositories.filter(repo => 
                    repo.name.toLowerCase().includes(searchTerm) || 
                    (repo.description && repo.description.toLowerCase().includes(searchTerm))
                );
                renderRepositories(filteredRepos);
            });
    }, 300); // 300ms debounce
}

// --- Dashboard Functions ---
function renderDashboard() {
    renderRepositories(repositories);
}

function renderRepositories(repos) {
    const repoGrid = document.getElementById('repo-grid');
    if (!repoGrid) return;
    
    if (!repos || repos.length === 0) {
        repoGrid.innerHTML = `
            <div class="no-results">
                <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 5.99L19.53 19H4.47L12 5.99M12 2L1 21h22L12 2zm1 14h-2v2h2v-2zm0-6h-2v4h2v-4z"/>
                </svg>
                <p>No repositories found</p>
            </div>`;
        return;
    }
    
    repoGrid.innerHTML = '';
    repos.forEach(repo => {
        const repoCard = document.createElement('div');
        repoCard.className = 'repo-card';
        repoCard.innerHTML = `
            <div class="repo-card-header">
                <h3 onclick="goToRepoPage('${repo.name}')">${repo.name}</h3>
                <div class="repo-actions-icons">
                    <button class="repo-card-edit-btn" onclick="openEditRepoModal('${repo.name}')">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M21.731 2.269a2.27 2.27 0 0 0-3.22-.001l-14 14a2.27 2.27 0 0 0 0 3.22L7.545 22H2v-5.545l14-14a2.27 2.27 0 0 0 3.22 0zM17.06 4.94l-11.85 11.85a.77.77 0 0 0 0 1.09L13.09 20h-8.09a.5.5 0 0 1-.5-.5v-8.09l11.85-11.85a.77.77 0 0 1 1.09 0z"/>
                        </svg>
                    </button>
                    <button class="repo-card-delete-btn" onclick="openDeleteRepoModal('${repo.name}')">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                    </button>
                </div>
            </div>
            <p>${repo.description || 'No description'}</p>
            <span>Created ${repo.createdDate || 'recently'}</span>
        `;
        repoGrid.appendChild(repoCard);
    });
}

function goToRepoPage(repoName) {
    window.location.href = `repo.html?repo=${encodeURIComponent(repoName)}`;
}

// --- Repository Page Functions ---
function renderRepoPageContent() {
    const params = new URLSearchParams(window.location.search);
    currentRepoName = params.get('repo');
    if (currentRepoName) {
        document.querySelector('.repo-name-text').textContent = decodeURIComponent(currentRepoName);
        document.querySelector('.repo-description-text').textContent = repositories.find(r => r.name === currentRepoName).description;
        showSection('files');
    }
}

function showSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.style.display = 'none';
    });
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    document.getElementById(`${sectionId}-section`).style.display = 'block';
    document.querySelector(`.nav-btn[onclick="showSection('${sectionId}')"]`).classList.add('active');

    const currentRepo = repositories.find(r => r.name === currentRepoName);
    if (currentRepo) {
        if (sectionId === 'files') {
            renderFiles(currentRepo.files);
        } else if (sectionId === 'commits') {
            renderCommits(currentRepo.commits);
        }
    }
}

function filterFiles() {
    const searchTerm = document.getElementById('repoSearchInput').value.toLowerCase();
    const currentRepo = repositories.find(r => r.name === currentRepoName);
    if (!currentRepo) return;
    
    let filteredFiles = currentRepo.files;
    if (searchTerm) {
        filteredFiles = currentRepo.files.filter(file => 
            file.name.toLowerCase().includes(searchTerm) || 
            (file.content && file.content.toLowerCase().includes(searchTerm))
        );
    }
    
    // Save the current search state for later re-rendering
    currentRepo.filteredFiles = filteredFiles;
    renderFiles(filteredFiles);
}

function renderFiles(files) {
    const filesContainer = document.getElementById('files-section');
    let filesList = document.getElementById('fileListContainer');
    if (!filesList) {
        filesContainer.innerHTML += '<div class="file-list-container"></div>';
        filesList = filesContainer.querySelector('.file-list-container');
    }
    filesList.innerHTML = '';
    
    if (files.length === 0) {
        filesList.innerHTML = `
            <div class="no-files-message">
                <img src="no-files-icon.png" alt="No Files Icon">
                <p>No files yet</p>
                <p>Create or upload files to get started</p>
            </div>
        `;
    } else {
        files.forEach(file => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.innerHTML = `
                <div class="file-details" onclick="viewFileContent('${file.name}')">
                    <span class="file-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/>
                        </svg>
                    </span>
                    <div class="file-info-text">
                        <span class="file-name">${file.name}</span>
                        <span class="file-meta">${file.info}</span>
                        <span class="file-date">${file.date}</span>
                    </div>
                </div>
                <div class="file-actions-icons">
                    <button class="view-file-btn" onclick="viewFileContent('${file.name}')" title="View Content">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                        </svg>
                    </button>
                    <button class="edit-file-btn" onclick="openEditFileModal('${file.name}')" title="Edit File">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19.73 4.931l-1.66-1.66a1.5 1.5 0 0 0-2.12 0l-12 12a1.5 1.5 0 0 0 0 2.12l1.66 1.66a1.5 1.5 0 0 0 2.12 0l12-12a1.5 1.5 0 0 0 0-2.12zM17.41 6.04l-10.4 10.4-1.12-1.12 10.4-10.4 1.12 1.12zM21 5.06l-1.42 1.42-2.12-2.12L18.88 2.94a1 1 0 0 1 1.41 0l.71.71a1 1 0 0 1 0 1.41z"/>
                        </svg>
                    </button>
                    <button class="delete-file-btn" onclick="openDeleteFileModal('${file.name}')" title="Delete File">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                    </button>
                </div>
            `;
            filesList.appendChild(fileItem);
        });
    }
}

function renderCommits(commits) {
    const commitsList = document.getElementById('commits-section').querySelector('.commit-list-container');
    commitsList.innerHTML = '';
    
    if (commits.length === 0) {
        commitsList.innerHTML = '<p class="no-commits-message">No commits yet. Create files to see commits here.</p>';
    } else {
        commits.forEach(commit => {
            const commitItem = document.createElement('div');
            commitItem.className = 'commit-item';
            commitItem.innerHTML = `
                <div class="commit-msg">${commit.message}</div>
                <div class="commit-details">
                    <span class="commit-author">By ${commit.author}</span>
                    <span class="commit-date">on ${commit.date}</span>
                </div>
            `;
            commitsList.appendChild(commitItem);
        });
    }
}

// --- Modal Functions (unchanged from previous response) ---
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        document.body.classList.add('modal-open');
        if (modalId === 'taskQueueModal') {
            renderTasks();
        } else if (modalId === 'historyModal') {
            renderHistory();
        }
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.classList.remove('modal-open');
    }
}

window.onclick = function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target == modal) {
            closeModal(modal.id);
        }
    });
}

function openEditRepoModal(repoName) {
    const currentRepo = repositories.find(r => r.name === repoName);
    if (currentRepo) {
        document.getElementById('editRepoName').value = currentRepo.name;
        document.getElementById('editRepoDescription').value = currentRepo.description;
        currentRepoName = repoName;
        openModal('editRepoModal');
    }
}

function openDeleteRepoModal(repoName) {
    document.getElementById('deleteRepoName').textContent = repoName;
    currentRepoName = repoName;
    openModal('deleteRepoModal');
}

function openEditFileModal(fileName) {
    const currentRepo = repositories.find(r => r.name === currentRepoName);
    const file = currentRepo ? currentRepo.files.find(f => f.name === fileName) : null;
    
    document.getElementById('editFileName').value = fileName;
    document.getElementById('editFileContent').value = file ? (file.content || '') : '';
    currentFileName = fileName;
    openModal('editFileModal');
}

function openDeleteFileModal(fileName) {
    document.getElementById('deleteFileName').textContent = fileName;
    currentFileName = fileName;
    openModal('deleteFileModal');
}

// --- Modal Action Handlers ---
async function createRepository() {
    const name = document.getElementById('repoName').value.trim();
    const description = document.getElementById('repoDescription').value.trim();
    
    if (!name) {
        alert('Repository name is required');
        return;
    }
    
    // Check if repository already exists
    if (repositories.find(r => r.name === name)) {
        alert('Repository already exists!');
        return;
    }
    
    // Save state for undo
    saveStateForUndo('CREATE_REPO', `Created repository: ${name}`);
    
    // Add to local data
    const newRepo = {
        name: name,
        description: description || 'Repository',
        createdDate: new Date().toLocaleDateString(),
        isPrivate: document.querySelector('#newRepoModal input[type="checkbox"]').checked,
        files: [],
        commits: [{
            message: `Created repository: ${name}`,
            author: 'Shiwani',
            date: new Date().toLocaleDateString()
        }]
    };
    
    repositories.push(newRepo);
    
    // Call backend API
    await callBackendAPI('POST', '/api/repositories', `name=${name}&description=${description}`);
    
    closeModal('newRepoModal');
    renderDashboard();
    
    // Clear form
    document.getElementById('repoName').value = '';
    document.getElementById('repoDescription').value = '';
}

async function saveRepoChanges() {
    const name = document.getElementById('editRepoName').value.trim();
    const description = document.getElementById('editRepoDescription').value.trim();
    
    if (!name) {
        alert('Repository name is required');
        return;
    }
    
    // Check if new name already exists (and it's different from current)
    if (name !== currentRepoName && repositories.find(r => r.name === name)) {
        alert('Repository name already exists!');
        return;
    }
    
    // Save state for undo
    saveStateForUndo('EDIT_REPO', `Edited repository: ${currentRepoName}`);
    
    // Update local data
    const repo = repositories.find(r => r.name === currentRepoName);
    if (repo) {
        const oldName = repo.name;
        repo.name = name;
        repo.description = description;
        
        // Add commit for the change
        repo.commits.push({
            message: `Updated repository: ${oldName} → ${name}`,
            author: 'Shiwani',
            date: new Date().toLocaleDateString()
        });
        
        // Update currentRepoName if we're on the repo page
        if (window.location.pathname.includes('repo.html')) {
            currentRepoName = name;
            document.querySelector('.repo-name-text').textContent = name;
            document.querySelector('.repo-description-text').textContent = description;
        }
    }
    
    // Save changes
    await callBackendAPI('PUT', `/api/repositories/${currentRepoName}`, `name=${name}&description=${description}`);
    
    closeModal('editRepoModal');
    renderDashboard();
}

async function confirmDeleteRepo() {
    // Save state for undo
    saveStateForUndo('DELETE_REPO', `Deleted repository: ${currentRepoName}`);
    
    // Remove from local data
    repositories = repositories.filter(r => r.name !== currentRepoName);
    
    // Call backend API
    await callBackendAPI('DELETE', `/api/repositories/${currentRepoName}`);
    
    closeModal('deleteRepoModal');
    renderDashboard();
}

async function createNewFile() {
    const fileName = document.getElementById('fileName').value.trim();
    const filePath = document.getElementById('filePath').value.trim();
    const content = document.getElementById('fileContent').value;
    const commitMessage = document.getElementById('commitMessage').value.trim();
    
    if (!fileName) {
        alert('File name is required');
        return;
    }
    
    const fullFileName = filePath ? `${filePath}/${fileName}` : fileName;
    const currentRepo = repositories.find(r => r.name === currentRepoName);
    
    if (currentRepo) {
        // Check if file already exists
        if (currentRepo.files.find(f => f.name === fullFileName)) {
            alert('File already exists!');
            return;
        }
        
        // Save state for undo
        saveStateForUndo('CREATE_FILE', `Created file: ${fullFileName}`);
        
        // Add file to repository
        currentRepo.files.push({
            name: fullFileName,
            info: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
            date: 'a few seconds ago',
            content: content
        });
        
        // Add commit
        currentRepo.commits.push({
            message: commitMessage || `Created file: ${fullFileName}`,
            author: 'Shiwani',
            date: new Date().toLocaleDateString()
        });
        
        // Call backend API
        await callBackendAPI('POST', `/api/repositories/${currentRepoName}/files`, 
            `name=${fullFileName}&content=${content}`);
    }
    
    closeModal('newFileModal');
    showSection('files');
    
    // Clear form
    document.getElementById('fileName').value = '';
    document.getElementById('filePath').value = '';
    document.getElementById('fileContent').value = '';
    document.getElementById('commitMessage').value = '';
}

async function saveFileChanges() {
    const fileName = document.getElementById('editFileName').value.trim();
    const fileContent = document.getElementById('editFileContent').value;
    
    if (!fileName) {
        alert('File name is required');
        return;
    }
    
    const currentRepo = repositories.find(r => r.name === currentRepoName);
    if (currentRepo) {
        // Check if new name already exists (and it's different from current)
        if (fileName !== currentFileName && currentRepo.files.find(f => f.name === fileName)) {
            alert('File name already exists!');
            return;
        }
        
        // Save state for undo
        saveStateForUndo('EDIT_FILE', `Edited file: ${currentFileName}`);
        
        const file = currentRepo.files.find(f => f.name === currentFileName);
        if (file) {
            const oldName = file.name;
            file.name = fileName;
            file.info = fileContent ? fileContent.substring(0, 50) + (fileContent.length > 50 ? '...' : '') : file.info;
            file.date = 'a few seconds ago';
            file.content = fileContent || file.content || '';
            
            // Add commit for the change
            currentRepo.commits.push({
                message: `Updated file: ${oldName} → ${fileName}`,
                author: 'Shiwani',
                date: new Date().toLocaleDateString()
            });
        }
    }
    
    // Save changes
    await callBackendAPI('PUT', `/api/repositories/${currentRepoName}/files/${currentFileName}`, 
        `name=${fileName}&content=${fileContent}`);
    
    closeModal('editFileModal');
    showSection('files');
}

async function confirmDeleteFile() {
    // Save state for undo
    saveStateForUndo('DELETE_FILE', `Deleted file: ${currentFileName}`);
    
    const currentRepo = repositories.find(r => r.name === currentRepoName);
    if (currentRepo) {
        currentRepo.files = currentRepo.files.filter(f => f.name !== currentFileName);
        
        // Add commit
        currentRepo.commits.push({
            message: `Deleted file: ${currentFileName}`,
            author: 'Shiwani',
            date: new Date().toLocaleDateString()
        });
        
        // Call backend API
        await callBackendAPI('DELETE', `/api/repositories/${currentRepoName}/files/${currentFileName}`);
    }
    
    closeModal('deleteFileModal');
    showSection('files');
}

async function uploadFile() {
    const fileInput = document.getElementById('actualChooseFile');
    const filePath = document.getElementById('uploadFilePath').value.trim();
    const commitMessage = document.getElementById('uploadCommitMessage').value.trim();
    
    if (!fileInput.files[0]) {
        alert('Please choose a file');
        return;
    }
    
    const file = fileInput.files[0];
    const fullFileName = filePath ? `${filePath}/${file.name}` : file.name;
    const currentRepo = repositories.find(r => r.name === currentRepoName);
    
    if (currentRepo) {
        // Check if file already exists
        if (currentRepo.files.find(f => f.name === fullFileName)) {
            alert('File already exists!');
            return;
        }
        
        // Read file content
        const reader = new FileReader();
        reader.onload = async function(e) {
            const content = e.target.result;
            
            currentRepo.files.push({
                name: fullFileName,
                info: `Uploaded file (${file.size} bytes)`,
                date: 'a few seconds ago',
                content: content
            });
            
            currentRepo.commits.push({
                message: commitMessage || `Uploaded file: ${fullFileName}`,
                author: 'Shiwani',
                date: new Date().toLocaleDateString()
            });
            
            // Save changes
            await callBackendAPI('POST', `/api/repositories/${currentRepoName}/files`, 
                `name=${fullFileName}&content=${content}`);
            
            showSection('files');
        };
        
        reader.readAsText(file);
    }
    
    closeModal('uploadFileModal');
    
    // Clear form
    document.getElementById('uploadFilePath').value = '';
    document.getElementById('uploadCommitMessage').value = '';
    document.getElementById('chooseFileBtn').textContent = 'No file chosen';
    fileInput.value = '';
}

function updateFileName(input) {
    const button = document.getElementById('chooseFileBtn');
    if (input.files[0]) {
        button.textContent = input.files[0].name;
    } else {
        button.textContent = 'No file chosen';
    }
}

function addTask() {
    const title = document.getElementById('taskTitle').value.trim();
    const description = document.getElementById('taskDescription').value.trim();
    
    if (!title) {
        alert('Task title is required');
        return;
    }
    
    const newTask = {
        id: Date.now(),
        title: title,
        description: description,
        date: new Date().toLocaleDateString()
    };
    
    tasks.push(newTask);
    renderTasks();
    
    // Clear form
    document.getElementById('taskTitle').value = '';
    document.getElementById('taskDescription').value = '';
}

function removeTask(id) {
    tasks = tasks.filter(task => task.id !== id);
    renderTasks();
}

function renderTasks() {
    const tasksList = document.getElementById('tasksList');
    const tasksCount = document.getElementById('openTasksCount');
    
    tasksCount.textContent = tasks.length;
    tasksList.innerHTML = '';
    
    if (tasks.length === 0) {
        tasksList.innerHTML = '<div class="no-history-message">No tasks yet</div>';
        return;
    }
    
    tasks.forEach(task => {
        const taskItem = document.createElement('div');
        taskItem.className = 'task-item';
        taskItem.innerHTML = `
            <div class="task-details">
                <h4>${task.title}</h4>
                <p>${task.description}</p>
            </div>
            <button class="remove-task-btn" onclick="removeTask(${task.id})">&times;</button>
        `;
        tasksList.appendChild(taskItem);
    });
}

// Undo/Redo functionality
function saveStateForUndo(action, description, oldState = null) {
    const state = {
        action: action,
        description: description,
        repositories: JSON.parse(JSON.stringify(repositories)), // Deep copy
        timestamp: new Date().toLocaleString(),
        oldState: oldState
    };
    
    undoStack.push(state);
    redoStack = []; // Clear redo stack when new action is performed
    
    // Update counts in UI if on repo page
    if (window.location.pathname.includes('repo.html')) {
        updateUndoRedoCounts();
    }
    
    // Limit undo stack size
    if (undoStack.length > 50) {
        undoStack.shift();
    }
}

function renderHistory() {
    const undoList = document.getElementById('undoList');
    const redoList = document.getElementById('redoList');
    const undoCount = document.getElementById('undoCount');
    const redoCount = document.getElementById('redoCount');
    
    undoCount.textContent = undoStack.length;
    redoCount.textContent = redoStack.length;
    
    // Render undo stack (most recent first)
    if (undoStack.length === 0) {
        undoList.innerHTML = '<div class="no-history-message">No actions to undo</div>';
    } else {
        undoList.innerHTML = '';
        // Show most recent actions first
        for (let i = undoStack.length - 1; i >= 0; i--) {
            const action = undoStack[i];
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.innerHTML = `
                <span class="history-action-icon">${getActionIcon(action.action)}</span>
                <span class="history-action-text">${action.description}</span>
                <span class="history-action-date">${action.timestamp}</span>
            `;
            undoList.appendChild(historyItem);
        }
    }
    
    // Render redo stack (most recent first)
    if (redoStack.length === 0) {
        redoList.innerHTML = '<div class="no-history-message">No actions to redo</div>';
    } else {
        redoList.innerHTML = '';
        // Show most recent actions first
        for (let i = redoStack.length - 1; i >= 0; i--) {
            const action = redoStack[i];
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item redo-item';
            historyItem.innerHTML = `
                <span class="history-action-icon">${getActionIcon(action.action)}</span>
                <span class="history-action-text">${action.description}</span>
                <span class="history-action-date">${action.timestamp}</span>
            `;
            redoList.appendChild(historyItem);
        }
    }
}

function getActionIcon(action) {
    switch (action) {
        case 'CREATE_REPO': return '📁+';
        case 'DELETE_REPO': return '📁-';
        case 'EDIT_REPO': return '📁✏️';
        case 'CREATE_FILE': return '📄+';
        case 'DELETE_FILE': return '📄-';
        case 'EDIT_FILE': return '📄✏️';
        default: return '⚡';
    }
}

// View file content
function viewFileContent(fileName) {
    const currentRepo = repositories.find(r => r.name === currentRepoName);
    const file = currentRepo ? currentRepo.files.find(f => f.name === fileName) : null;
    
    if (file) {
        document.getElementById('viewFileName').textContent = fileName;
        document.getElementById('viewFileContent').textContent = file.content || 'No content available';
        openModal('viewFileModal');
    } else {
        alert('File not found');
    }
}


// --- Page Load & Initialization ---
document.addEventListener('DOMContentLoaded', async () => {
    // Load data from C++ backend
    await loadDataFromBackend();
    
    if (window.location.pathname.includes('repo.html')) {
        renderRepoPageContent();
        updateUndoRedoCounts();
    } else {
        renderDashboard();
    }
    
    // Only refresh data if we're in a mode where backend is expected to be running
    // For now, we'll disable auto-refresh to prevent data loss
    // setInterval(async () => {
    //     await loadDataFromBackend();
    //     if (window.location.pathname.includes('repo.html')) {
    //         const params = new URLSearchParams(window.location.search);
    //         const repoName = params.get('repo');
    //         if (repoName && repoName === currentRepoName) {
    //             showSection('files'); // Refresh current section
    //         }
    //     } else {
    //         renderDashboard();
    //     }
    // }, 5000);
});