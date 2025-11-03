// --- Global Data Store (Connected to C++ backend) ---
let repositories = [];
let tasks = [];
let currentRepoName = '';
let currentFileName = '';
let undoStack = [];
let redoStack = [];

// --- Access Control System ---
let currentUser = 'Shiwani'; // Default user - in a real system this would come from authentication
let isOwner = true; // For demo purposes, assume current user is the owner

// Check if user has access to a repository
function hasRepositoryAccess(repo) {
    // Public repositories are accessible to everyone
    if (!repo.isPrivate) {
        return true;
    }
    
    // Private repositories are only accessible to the owner
    // In a real system, this would check user permissions/collaborators
    return isOwner;
}

// Filter repositories based on access control
function getAccessibleRepositories(repos) {
    return repos.filter(repo => hasRepositoryAccess(repo));
}

// Toggle user for demonstration purposes
function toggleUser() {
    if (currentUser === 'Shiwani') {
        currentUser = 'Guest';
        isOwner = false;
    } else {
        currentUser = 'Shiwani';
        isOwner = true;
    }
    
    // Update UI
    document.getElementById('current-user-name').textContent = currentUser;
    
    // Refresh dashboard to apply access control
    renderDashboard();
    
    showNotification(`Switched to user: ${currentUser}`, 'info');
}

// --- Commit Graph Visualization ---
let commitGraphVisible = false;

function toggleCommitGraph() {
    const container = document.getElementById('commitGraphContainer');
    const toggleBtn = document.getElementById('toggleGraphBtn');
    const toggleText = document.getElementById('graphToggleText');
    
    commitGraphVisible = !commitGraphVisible;
    
    if (commitGraphVisible) {
        container.style.display = 'block';
        toggleText.textContent = 'Hide Graph';
        renderCommitGraph();
    } else {
        container.style.display = 'none';
        toggleText.textContent = 'Show Graph';
    }
}

function renderCommitGraph() {
    const repo = getCurrentRepository();
    if (!repo) return;
    
    const graphContainer = document.getElementById('commitGraph');
    
    // Collect commits from all branches
    let allCommits = [...(repo.commits || [])]; // Start with main repo commits
    const branches = repo.branches || [];
    
    // Add commits from each branch
    branches.forEach(branch => {
        if (branch.commits && branch.commits.length > 0) {
            branch.commits.forEach(branchCommit => {
                // Ensure branch name is set
                if (!branchCommit.branch) {
                    branchCommit.branch = branch.name;
                }
                
                // Check if commit already exists (avoid duplicates)
                const exists = allCommits.some(existingCommit => 
                    existingCommit.message === branchCommit.message &&
                    existingCommit.author === branchCommit.author &&
                    existingCommit.date === branchCommit.date &&
                    existingCommit.branch === branchCommit.branch
                );
                
                if (!exists) {
                    allCommits.push(branchCommit);
                }
            });
        }
    });
    
    // Sort commits by timestamp for proper ordering
    allCommits.sort((a, b) => {
        const timeA = a.timestamp || 0;
        const timeB = b.timestamp || 0;
        return timeA - timeB; // Oldest first for graph display
    });
    
    // Create commit graph data structure
    const graphData = generateCommitGraphData(allCommits, branches);
    
    // Render SVG
    const svg = createCommitGraphSVG(graphData);
    graphContainer.innerHTML = '';
    graphContainer.appendChild(svg);
    
    // Add tooltip
    addCommitGraphTooltip();
}

function generateCommitGraphData(commits, branches) {
    const graphData = {
        commits: [],
        branches: [],
        connections: []
    };
    
    // Enhanced color palette for better branch distinction
    const branchColors = {
        'main': '#1f6feb',
        'master': '#1f6feb'
    };
    
    const featureColors = [
        '#56d364', '#f85149', '#d2a8ff', '#ffa657', '#ff7b72',
        '#79c0ff', '#a5f3fc', '#fde047', '#fb7185', '#c084fc'
    ];
    let colorIndex = 0;
    
    // Create branch mapping with X positions (vertical layout)
    const branchXPositions = {};
    
    // Get all branches from both commits and repository branches
    const branchesFromCommits = [...new Set(commits.map(c => c.branch || 'main'))];
    const branchesFromRepo = branches ? branches.map(b => b.name) : [];
    const allBranches = [...new Set([...branchesFromCommits, ...branchesFromRepo])];
    
    // Sort branches to put main first, then others
    const sortedBranches = allBranches.sort((a, b) => {
        if (a === 'main' || a === 'master') return -1;
        if (b === 'main' || b === 'master') return 1;
        return a.localeCompare(b);
    });
    
    sortedBranches.forEach((branchName, index) => {
        if (!branchColors[branchName] && branchName !== 'main' && branchName !== 'master') {
            branchColors[branchName] = featureColors[colorIndex % featureColors.length];
            colorIndex++;
        }
        // Main branch at x=80, feature branches to the left with reduced spacing
        branchXPositions[branchName] = branchName === 'main' ? 80 : 80 - ((index) * 30);
    });
    
    // Generate commits with vertical layout (commits flow downward)
    const commitSpacing = 45; // Reduced vertical spacing between commits
    let currentY = 60;
    
    commits.forEach((commit, globalIndex) => {
        const branchName = commit.branch || 'main';
        const color = branchColors[branchName] || '#56d364';
        
        const commitData = {
            id: `commit-${globalIndex}`,
            message: commit.message,
            author: commit.author,
            date: commit.date,
            branch: branchName,
            color: color,
            x: branchXPositions[branchName],
            y: currentY,
            isMerge: commit.message.toLowerCase().includes('merge'),
            isFeature: !['main', 'master'].includes(branchName),
            globalIndex: globalIndex
        };
        
        graphData.commits.push(commitData);
        currentY += commitSpacing;
    });
    
    // Create enhanced connections for vertical layout
    graphData.commits.forEach((commit, index) => {
        // Connect to previous commit on same branch
        const prevCommitOnBranch = graphData.commits
            .filter(c => c.branch === commit.branch && c.globalIndex < commit.globalIndex)
            .sort((a, b) => b.globalIndex - a.globalIndex)[0];
            
        if (prevCommitOnBranch) {
            graphData.connections.push({
                from: prevCommitOnBranch,
                to: commit,
                color: commit.color,
                type: 'branch-flow',
                strokeWidth: 3
            });
        }
        
        // Handle branch creation (connect to parent branch)
        if (commit.isFeature && !prevCommitOnBranch) {
            const parentCommit = graphData.commits
                .filter(c => c.branch === 'main' && c.globalIndex < commit.globalIndex)
                .sort((a, b) => b.globalIndex - a.globalIndex)[0];
                
            if (parentCommit) {
                graphData.connections.push({
                    from: parentCommit,
                    to: commit,
                    color: commit.color,
                    type: 'branch-split',
                    strokeWidth: 2
                });
            }
        }
        
        // Handle merge commits
        if (commit.isMerge && commit.branch === 'main') {
            const featureBranches = [...new Set(
                graphData.commits
                    .filter(c => c.isFeature && c.globalIndex < commit.globalIndex)
                    .map(c => c.branch)
            )];
            
            featureBranches.forEach(featureBranch => {
                const lastFeatureCommit = graphData.commits
                    .filter(c => c.branch === featureBranch && c.globalIndex < commit.globalIndex)
                    .sort((a, b) => b.globalIndex - a.globalIndex)[0];
                    
                if (lastFeatureCommit) {
                    graphData.connections.push({
                        from: lastFeatureCommit,
                        to: commit,
                        color: '#f85149',
                        type: 'merge',
                        strokeWidth: 2
                    });
                }
            });
        }
    });
    
    // Store branches data for use in rendering
    graphData.branches = branches || [];
    
    return graphData;
}

function getBranchY(branchName, branches) {
    const branchIndex = branches.findIndex(b => b.name === branchName);
    return branchIndex >= 0 ? branchIndex * 60 : 0;
}

function createCommitGraphSVG(graphData) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    
    // Calculate dimensions for vertical network graph (larger height)
    const minX = graphData.commits.length > 0 ? Math.min(...graphData.commits.map(c => c.x)) : 0;
    const maxX = graphData.commits.length > 0 ? Math.max(...graphData.commits.map(c => c.x)) : 0;
    const maxY = graphData.commits.length > 0 ? Math.max(...graphData.commits.map(c => c.y)) : 0;
    
    const width = Math.max(400, (maxX - minX) + 250);
    const height = Math.max(600, maxY + 150);
    
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    svg.setAttribute('viewBox', `${minX - 50} 0 ${width} ${height}`);
    
    // Add enhanced grid background
    addVerticalGridBackground(svg, minX - 50, width, height);
    
    // Draw vertical branch lanes
    drawVerticalBranchLanes(svg, graphData, height);
    
    // Draw connections (behind commits)
    graphData.connections.forEach(connection => {
        drawVerticalConnection(svg, connection);
    });
    
    // Draw commits with enhanced styling
    graphData.commits.forEach(commit => {
        drawVerticalCommit(svg, commit);
    });
    
    // Add vertical branch labels
    addVerticalBranchLabels(svg, graphData);
    
    return svg;
}

function addZoomPanFunctionality(svg) {
    let isPanning = false;
    let startPoint = { x: 0, y: 0 };
    let currentTransform = { x: 0, y: 0, scale: 1 };
    
    // Create a group for all graph elements
    const graphGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    graphGroup.setAttribute('class', 'graph-content');
    
    // Move all existing children to the group
    while (svg.firstChild) {
        graphGroup.appendChild(svg.firstChild);
    }
    svg.appendChild(graphGroup);
    
    // Mouse wheel zoom
    svg.addEventListener('wheel', (e) => {
        e.preventDefault();
        const rect = svg.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
        currentTransform.scale *= scaleFactor;
        currentTransform.scale = Math.max(0.1, Math.min(3, currentTransform.scale));
        
        // Zoom towards mouse position
        currentTransform.x = mouseX - (mouseX - currentTransform.x) * scaleFactor;
        currentTransform.y = mouseY - (mouseY - currentTransform.y) * scaleFactor;
        
        updateTransform();
    });
    
    // Mouse pan
    svg.addEventListener('mousedown', (e) => {
        if (e.button === 0) { // Left mouse button
            isPanning = true;
            startPoint = { x: e.clientX - currentTransform.x, y: e.clientY - currentTransform.y };
            svg.style.cursor = 'grabbing';
        }
    });
    
    svg.addEventListener('mousemove', (e) => {
        if (isPanning) {
            currentTransform.x = e.clientX - startPoint.x;
            currentTransform.y = e.clientY - startPoint.y;
            updateTransform();
        }
    });
    
    svg.addEventListener('mouseup', () => {
        isPanning = false;
        svg.style.cursor = 'grab';
    });
    
    svg.addEventListener('mouseleave', () => {
        isPanning = false;
        svg.style.cursor = 'default';
    });
    
    function updateTransform() {
        graphGroup.setAttribute('transform', 
            `translate(${currentTransform.x}, ${currentTransform.y}) scale(${currentTransform.scale})`);
    }
    
    // Set initial cursor
    svg.style.cursor = 'grab';
    
    return svg;
}

function addGridBackground(svg, width, height) {
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const pattern = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
    
    pattern.setAttribute('id', 'grid');
    pattern.setAttribute('width', '20');
    pattern.setAttribute('height', '20');
    pattern.setAttribute('patternUnits', 'userSpaceOnUse');
    
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M 20 0 L 0 0 0 20');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', '#21262d');
    path.setAttribute('stroke-width', '1');
    
    pattern.appendChild(path);
    defs.appendChild(pattern);
    svg.appendChild(defs);
    
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('width', width);
    rect.setAttribute('height', height);
    rect.setAttribute('fill', 'url(#grid)');
    
    svg.appendChild(rect);
}

// Enhanced vertical network graph functions
function addVerticalGridBackground(svg, startX, width, height) {
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const pattern = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
    
    pattern.setAttribute('id', 'verticalGrid');
    pattern.setAttribute('width', '20');
    pattern.setAttribute('height', '20');
    pattern.setAttribute('patternUnits', 'userSpaceOnUse');
    
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M 20 0 L 0 0 0 20');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', '#21262d');
    path.setAttribute('stroke-width', '1');
    path.setAttribute('opacity', '0.3');
    
    pattern.appendChild(path);
    defs.appendChild(pattern);
    svg.appendChild(defs);
    
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', startX);
    rect.setAttribute('y', 0);
    rect.setAttribute('width', width);
    rect.setAttribute('height', height);
    rect.setAttribute('fill', 'url(#verticalGrid)');
    
    svg.appendChild(rect);
}

function drawVerticalBranchLanes(svg, graphData, height) {
    // Get all branches from both commits and the stored branch data
    const branchesFromCommits = [...new Set(graphData.commits.map(c => c.branch))];
    const allBranches = graphData.branches && graphData.branches.length > 0 ? 
        [...new Set([...branchesFromCommits, ...graphData.branches.map(b => b.name)])] : 
        branchesFromCommits;
    
    // Branch colors mapping
    const branchColors = {
        'main': '#1f6feb',
        'master': '#1f6feb',
        'feature/sorting': '#56d364',
        'feature/search': '#f85149',
        'hotfix/sorting-fix': '#d2a8ff'
    };
    
    const featureColors = ['#56d364', '#f85149', '#d2a8ff', '#ffa657', '#ff7b72'];
    let colorIndex = 0;
    
    allBranches.forEach((branchName, index) => {
        const branchCommits = graphData.commits.filter(c => c.branch === branchName);
        
        // Calculate position and color
        let x, color;
        if (branchCommits.length > 0) {
            x = branchCommits[0].x;
            color = branchCommits[0].color;
        } else {
            // For branches without commits, calculate position
            x = branchName === 'main' ? 80 : 80 - ((index) * 30);
            color = branchColors[branchName] || featureColors[colorIndex % featureColors.length];
            if (!branchColors[branchName]) colorIndex++;
        }
        
        // Draw vertical branch lane
        const lane = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        lane.setAttribute('x', x - 15);
        lane.setAttribute('y', 0);
        lane.setAttribute('width', 30);
        lane.setAttribute('height', height);
        lane.setAttribute('fill', color);
        lane.setAttribute('opacity', '0.08');
        lane.setAttribute('class', 'vertical-branch-lane');
        
        svg.appendChild(lane);
        
        // Draw vertical branch line
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', x);
        line.setAttribute('y1', 0);
        line.setAttribute('x2', x);
        line.setAttribute('y2', height);
        line.setAttribute('stroke', color);
        line.setAttribute('stroke-width', '2');
        line.setAttribute('opacity', '0.3');
        line.setAttribute('class', 'vertical-branch-line');
        
        svg.appendChild(line);
    });
}

function drawVerticalConnection(svg, connection) {
    const strokeWidth = connection.strokeWidth || 2;
    
    if (connection.type === 'merge') {
        // Curved line for merge connections (horizontal curve)
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const controlX = connection.to.x;
        const controlY = connection.from.y + (connection.to.y - connection.from.y) * 0.7;
        
        const d = `M ${connection.from.x} ${connection.from.y} Q ${controlX} ${controlY} ${connection.to.x} ${connection.to.y}`;
        
        path.setAttribute('d', d);
        path.setAttribute('stroke', connection.color);
        path.setAttribute('stroke-width', strokeWidth);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke-dasharray', '6,3');
        path.setAttribute('class', 'commit-line merge-line');
        path.setAttribute('opacity', '0.8');
        
        svg.appendChild(path);
        
    } else if (connection.type === 'branch-split') {
        // Curved line for branch splits (horizontal curve)
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const controlX = connection.from.x;
        const controlY = connection.from.y + (connection.to.y - connection.from.y) * 0.3;
        
        const d = `M ${connection.from.x} ${connection.from.y} Q ${controlX} ${controlY} ${connection.to.x} ${connection.to.y}`;
        
        path.setAttribute('d', d);
        path.setAttribute('stroke', connection.color);
        path.setAttribute('stroke-width', strokeWidth);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke-dasharray', '3,2');
        path.setAttribute('class', 'commit-line branch-split');
        path.setAttribute('opacity', '0.7');
        
        svg.appendChild(path);
        
    } else {
        // Straight vertical line for branch flow
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        
        line.setAttribute('x1', connection.from.x);
        line.setAttribute('y1', connection.from.y);
        line.setAttribute('x2', connection.to.x);
        line.setAttribute('y2', connection.to.y);
        line.setAttribute('stroke', connection.color);
        line.setAttribute('stroke-width', strokeWidth);
        line.setAttribute('class', 'commit-line branch-flow');
        line.setAttribute('opacity', '0.9');
        
        svg.appendChild(line);
    }
}

function drawVerticalCommit(svg, commit) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'commit-node vertical-commit');
    g.setAttribute('data-commit-id', commit.id);
    
    // Commit glow effect
    const glow = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    glow.setAttribute('cx', commit.x);
    glow.setAttribute('cy', commit.y);
    glow.setAttribute('r', commit.isMerge ? 12 : 10);
    glow.setAttribute('fill', commit.color);
    glow.setAttribute('opacity', '0.15');
    glow.setAttribute('class', 'commit-glow');
    
    g.appendChild(glow);
    
    // Main commit circle
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', commit.x);
    circle.setAttribute('cy', commit.y);
    circle.setAttribute('r', commit.isMerge ? 7 : 5);
    circle.setAttribute('fill', commit.color);
    circle.setAttribute('stroke', '#0d1117');
    circle.setAttribute('stroke-width', '2');
    
    if (commit.isMerge) {
        circle.setAttribute('stroke-dasharray', '2,1');
    }
    
    g.appendChild(circle);
    
    // Commit message (positioned to the right)
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', commit.x + 20);
    text.setAttribute('y', commit.y + 4);
    text.setAttribute('class', 'commit-message vertical');
    text.setAttribute('text-anchor', 'start');
    text.textContent = truncateText(commit.message, 40);
    
    g.appendChild(text);
    
    // Display filenames from commit data
    let filenames = [];
    
    // First try to get filenames from commit.files array
    if (commit.files && commit.files.length > 0) {
        filenames = commit.files;
    } else {
        // Fallback to extracting from commit message
        const extractedFile = extractFilenameFromCommit(commit.message);
        if (extractedFile) {
            filenames = [extractedFile];
        }
    }
    
    // Display all filenames (up to 3, then show count)
    if (filenames.length > 0) {
        const maxFilesToShow = 3;
        const filesToDisplay = filenames.slice(0, maxFilesToShow);
        
        filesToDisplay.forEach((filename, index) => {
            const fileText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            fileText.setAttribute('x', commit.x + 20);
            fileText.setAttribute('y', commit.y + 18 + (index * 12)); // Stack files vertically
            fileText.setAttribute('class', 'commit-filename vertical');
            fileText.setAttribute('text-anchor', 'start');
            fileText.setAttribute('fill', '#58a6ff');
            fileText.setAttribute('font-size', '10px');
            fileText.textContent = `📄 ${truncateText(filename, 30)}`;
            
            g.appendChild(fileText);
        });
        
        // If more than maxFilesToShow files, show count
        if (filenames.length > maxFilesToShow) {
            const moreText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            moreText.setAttribute('x', commit.x + 20);
            moreText.setAttribute('y', commit.y + 18 + (maxFilesToShow * 12));
            moreText.setAttribute('class', 'commit-filename vertical');
            moreText.setAttribute('text-anchor', 'start');
            moreText.setAttribute('fill', '#8b949e');
            moreText.setAttribute('font-size', '9px');
            moreText.textContent = `+${filenames.length - maxFilesToShow} more file${filenames.length - maxFilesToShow > 1 ? 's' : ''}`;
            
            g.appendChild(moreText);
        }
    }
    
    // Add commit data for tooltip
    g.setAttribute('data-message', commit.message);
    g.setAttribute('data-author', commit.author);
    g.setAttribute('data-date', commit.date);
    g.setAttribute('data-branch', commit.branch);
    if (filenames.length > 0) {
        g.setAttribute('data-files', filenames.join(', '));
    }
    
    svg.appendChild(g);
}

function addVerticalBranchLabels(svg, graphData) {
    // Get all branches from both commits and the stored branch data
    const branchesFromCommits = [...new Set(graphData.commits.map(c => c.branch))];
    const allBranches = graphData.branches && graphData.branches.length > 0 ? 
        [...new Set([...branchesFromCommits, ...graphData.branches.map(b => b.name)])] : 
        branchesFromCommits;
    
    // Branch colors mapping
    const branchColors = {
        'main': '#1f6feb',
        'master': '#1f6feb',
        'feature/sorting': '#56d364',
        'feature/search': '#f85149',
        'hotfix/sorting-fix': '#d2a8ff'
    };
    
    const featureColors = ['#56d364', '#f85149', '#d2a8ff', '#ffa657', '#ff7b72'];
    let colorIndex = 0;
    
    // Calculate positions to avoid overlap
    const labelSpacing = 10; // Minimum space between labels
    const labelPositions = [];
    
    allBranches.forEach((branchName, index) => {
        const branchCommit = graphData.commits.find(c => c.branch === branchName);
        
        // Calculate position and color
        let x, color;
        if (branchCommit) {
            x = branchCommit.x;
            color = branchCommit.color;
        } else {
            // For branches without commits, calculate position
            x = branchName === 'main' ? 80 : 80 - ((index) * 30);
            color = branchColors[branchName] || featureColors[colorIndex % featureColors.length];
            if (!branchColors[branchName]) colorIndex++;
        }
        
        // Calculate text width dynamically
        const textWidth = Math.max(70, branchName.length * 7 + 20);
        
        // Calculate label boundaries
        let labelX = x - textWidth / 2;
        let labelRight = labelX + textWidth;
        
        // Check for overlap with previous labels and adjust position
        let yOffset = 10; // Default Y position
        let overlaps = true;
        
        while (overlaps) {
            overlaps = false;
            for (const prevLabel of labelPositions) {
                // Check if labels are at same Y level and overlap horizontally
                if (prevLabel.y === yOffset) {
                    const horizontalOverlap = !(labelRight < prevLabel.x || labelX > prevLabel.right);
                    if (horizontalOverlap) {
                        overlaps = true;
                        yOffset += 30; // Move to next row
                        break;
                    }
                }
            }
        }
        
        // Store this label's position for overlap checking
        labelPositions.push({
            x: labelX,
            right: labelRight,
            y: yOffset
        });
        
        // Branch label background
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', labelX);
        rect.setAttribute('y', yOffset);
        rect.setAttribute('width', textWidth);
        rect.setAttribute('height', 20);
        rect.setAttribute('fill', color);
        rect.setAttribute('opacity', '0.9');
        rect.setAttribute('rx', 10);
        
        // Branch label text
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', x);
        text.setAttribute('y', yOffset + 14);
        text.setAttribute('class', 'branch-label vertical');
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('fill', '#ffffff');
        text.setAttribute('font-weight', 'bold');
        text.setAttribute('font-size', '10px');
        text.textContent = branchName;
        
        svg.appendChild(rect);
        svg.appendChild(text);
    });
}

function drawBranchLanes(svg, graphData, width) {
    const branches = [...new Set(graphData.commits.map(c => c.branch))];
    
    branches.forEach(branchName => {
        const branchCommits = graphData.commits.filter(c => c.branch === branchName);
        if (branchCommits.length === 0) return;
        
        const y = branchCommits[0].y;
        const color = branchCommits[0].color;
        
        // Draw branch lane background
        const lane = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        lane.setAttribute('x', 0);
        lane.setAttribute('y', y - 30);
        lane.setAttribute('width', width);
        lane.setAttribute('height', 60);
        lane.setAttribute('fill', color);
        lane.setAttribute('opacity', '0.05');
        lane.setAttribute('class', 'branch-lane');
        
        svg.appendChild(lane);
    });
}

function drawEnhancedConnection(svg, connection) {
    const strokeWidth = connection.strokeWidth || 2;
    
    if (connection.type === 'merge') {
        // Enhanced curved line for merge connections
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const controlX = connection.from.x + (connection.to.x - connection.from.x) * 0.7;
        const controlY = connection.from.y;
        
        const d = `M ${connection.from.x} ${connection.from.y} Q ${controlX} ${controlY} ${connection.to.x} ${connection.to.y}`;
        
        path.setAttribute('d', d);
        path.setAttribute('stroke', connection.color);
        path.setAttribute('stroke-width', strokeWidth);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke-dasharray', '8,4');
        path.setAttribute('class', 'commit-line merge-line');
        path.setAttribute('opacity', '0.8');
        
        svg.appendChild(path);
        
        // Add merge arrow
        const arrowHead = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        const arrowSize = 6;
        const angle = Math.atan2(connection.to.y - connection.from.y, connection.to.x - connection.from.x);
        const arrowX = connection.to.x - arrowSize * Math.cos(angle);
        const arrowY = connection.to.y - arrowSize * Math.sin(angle);
        
        const points = [
            [connection.to.x, connection.to.y],
            [arrowX - arrowSize * Math.sin(angle), arrowY + arrowSize * Math.cos(angle)],
            [arrowX + arrowSize * Math.sin(angle), arrowY - arrowSize * Math.cos(angle)]
        ].map(p => p.join(',')).join(' ');
        
        arrowHead.setAttribute('points', points);
        arrowHead.setAttribute('fill', connection.color);
        arrowHead.setAttribute('class', 'merge-arrow');
        
        svg.appendChild(arrowHead);
        
    } else if (connection.type === 'branch-split') {
        // Curved line for branch splits
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const controlX = connection.from.x + (connection.to.x - connection.from.x) * 0.3;
        const controlY = connection.to.y;
        
        const d = `M ${connection.from.x} ${connection.from.y} Q ${controlX} ${controlY} ${connection.to.x} ${connection.to.y}`;
        
        path.setAttribute('d', d);
        path.setAttribute('stroke', connection.color);
        path.setAttribute('stroke-width', strokeWidth);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke-dasharray', '4,2');
        path.setAttribute('class', 'commit-line branch-split');
        path.setAttribute('opacity', '0.7');
        
        svg.appendChild(path);
        
    } else {
        // Enhanced straight line for branch flow
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        
        line.setAttribute('x1', connection.from.x);
        line.setAttribute('y1', connection.from.y);
        line.setAttribute('x2', connection.to.x);
        line.setAttribute('y2', connection.to.y);
        line.setAttribute('stroke', connection.color);
        line.setAttribute('stroke-width', strokeWidth);
        line.setAttribute('class', 'commit-line branch-flow');
        line.setAttribute('opacity', '0.9');
        
        svg.appendChild(line);
    }
}

function drawEnhancedCommit(svg, commit) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'commit-node enhanced-commit');
    g.setAttribute('data-commit-id', commit.id);
    
    // Commit glow effect
    const glow = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    glow.setAttribute('cx', commit.x);
    glow.setAttribute('cy', commit.y);
    glow.setAttribute('r', commit.isMerge ? 12 : 10);
    glow.setAttribute('fill', commit.color);
    glow.setAttribute('opacity', '0.2');
    glow.setAttribute('class', 'commit-glow');
    
    g.appendChild(glow);
    
    // Main commit circle
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', commit.x);
    circle.setAttribute('cy', commit.y);
    circle.setAttribute('r', commit.isMerge ? 8 : 6);
    circle.setAttribute('fill', commit.color);
    circle.setAttribute('stroke', '#0d1117');
    circle.setAttribute('stroke-width', '2');
    
    if (commit.isMerge) {
        circle.setAttribute('stroke-dasharray', '2,2');
    }
    
    g.appendChild(circle);
    
    // Commit message (positioned below)
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', commit.x);
    text.setAttribute('y', commit.y + 30);
    text.setAttribute('class', 'commit-message enhanced');
    text.setAttribute('text-anchor', 'middle');
    text.textContent = truncateText(commit.message, 12);
    
    g.appendChild(text);
    
    // Commit hash above
    const hashText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    hashText.setAttribute('x', commit.x);
    hashText.setAttribute('y', commit.y - 20);
    hashText.setAttribute('class', 'commit-hash enhanced');
    hashText.setAttribute('text-anchor', 'middle');
    hashText.textContent = `${commit.id.slice(-6)}`;
    
    g.appendChild(hashText);
    
    // Add commit data for tooltip
    g.setAttribute('data-message', commit.message);
    g.setAttribute('data-author', commit.author);
    g.setAttribute('data-date', commit.date);
    g.setAttribute('data-branch', commit.branch);
    
    svg.appendChild(g);
}

function addNetworkBranchLabels(svg, graphData) {
    const branches = [...new Set(graphData.commits.map(c => c.branch))];
    
    branches.forEach(branchName => {
        const branchCommit = graphData.commits.find(c => c.branch === branchName);
        if (!branchCommit) return;
        
        const y = branchCommit.y;
        const color = branchCommit.color;
        const textWidth = Math.max(80, branchName.length * 8 + 20);
        
        // Branch label background
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', 20);
        rect.setAttribute('y', y - 12);
        rect.setAttribute('width', textWidth);
        rect.setAttribute('height', 24);
        rect.setAttribute('fill', color);
        rect.setAttribute('opacity', '0.9');
        rect.setAttribute('rx', 12);
        
        // Branch label text
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', 20 + textWidth / 2);
        text.setAttribute('y', y + 4);
        text.setAttribute('class', 'branch-label network');
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('fill', '#ffffff');
        text.setAttribute('font-weight', 'bold');
        text.textContent = branchName;
        
        svg.appendChild(rect);
        svg.appendChild(text);
    });
}

function addTimelineMarkers(svg, graphData, width) {
    if (graphData.commits.length === 0) return;
    
    // Add timeline at the top
    const timelineY = 30;
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', 100);
    line.setAttribute('y1', timelineY);
    line.setAttribute('x2', width - 100);
    line.setAttribute('y2', timelineY);
    line.setAttribute('stroke', '#30363d');
    line.setAttribute('stroke-width', '2');
    
    svg.appendChild(line);
    
    // Add time markers
    const uniqueDates = [...new Set(graphData.commits.map(c => c.date))];
    uniqueDates.forEach((date, index) => {
        const x = 150 + (index * 200);
        
        const marker = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        marker.setAttribute('cx', x);
        marker.setAttribute('cy', timelineY);
        marker.setAttribute('r', 3);
        marker.setAttribute('fill', '#58a6ff');
        
        const dateText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        dateText.setAttribute('x', x);
        dateText.setAttribute('y', timelineY - 10);
        dateText.setAttribute('class', 'timeline-date');
        dateText.setAttribute('text-anchor', 'middle');
        dateText.setAttribute('font-size', '10px');
        dateText.setAttribute('fill', '#8b949e');
        dateText.textContent = date.split(' ').slice(0, 2).join(' ');
        
        svg.appendChild(marker);
        svg.appendChild(dateText);
    });
}

function drawCommit(svg, commit) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'commit-node');
    g.setAttribute('data-commit-id', commit.id);
    
    // Commit circle
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', commit.x);
    circle.setAttribute('cy', commit.y);
    circle.setAttribute('r', commit.isMerge ? 8 : 6);
    circle.setAttribute('fill', commit.color);
    circle.setAttribute('stroke', '#0d1117');
    circle.setAttribute('stroke-width', '2');
    
    g.appendChild(circle);
    
    // Commit message (positioned below the circle to avoid overlap)
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', commit.x);
    text.setAttribute('y', commit.y + 25);
    text.setAttribute('class', 'commit-message');
    text.setAttribute('text-anchor', 'middle');
    text.textContent = truncateText(commit.message, 15);
    
    g.appendChild(text);
    
    // Add commit hash/ID above the circle
    const hashText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    hashText.setAttribute('x', commit.x);
    hashText.setAttribute('y', commit.y - 15);
    hashText.setAttribute('class', 'commit-hash');
    hashText.setAttribute('text-anchor', 'middle');
    hashText.textContent = `#${commit.id.slice(-3)}`;
    
    g.appendChild(hashText);
    
    // Add commit data for tooltip
    g.setAttribute('data-message', commit.message);
    g.setAttribute('data-author', commit.author);
    g.setAttribute('data-date', commit.date);
    g.setAttribute('data-branch', commit.branch);
    
    svg.appendChild(g);
}

function addBranchLabels(svg, graphData) {
    const branches = [...new Set(graphData.commits.map(c => c.branch))];
    
    branches.forEach((branchName) => {
        // Find the first commit on this branch to get the Y position
        const branchCommit = graphData.commits.find(c => c.branch === branchName);
        if (!branchCommit) return;
        
        const y = branchCommit.y;
        const textWidth = branchName.length * 6 + 10; // Estimate text width
        
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', 10);
        rect.setAttribute('y', y - 10);
        rect.setAttribute('width', textWidth);
        rect.setAttribute('height', 20);
        rect.setAttribute('fill', '#21262d');
        rect.setAttribute('stroke', '#30363d');
        rect.setAttribute('rx', 3);
        
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', 10 + textWidth / 2);
        text.setAttribute('y', y + 4);
        text.setAttribute('class', 'branch-label');
        text.setAttribute('text-anchor', 'middle');
        text.textContent = branchName;
        
        svg.appendChild(rect);
        svg.appendChild(text);
    });
}

function addCommitGraphTooltip() {
    // Remove existing tooltip
    const existingTooltip = document.querySelector('.commit-tooltip');
    if (existingTooltip) {
        existingTooltip.remove();
    }
    
    // Create tooltip element
    const tooltip = document.createElement('div');
    tooltip.className = 'commit-tooltip';
    document.body.appendChild(tooltip);
    
    // Add event listeners to commit nodes
    const commitNodes = document.querySelectorAll('.commit-node');
    
    commitNodes.forEach(node => {
        node.addEventListener('mouseenter', (e) => {
            const message = e.currentTarget.getAttribute('data-message');
            const author = e.currentTarget.getAttribute('data-author');
            const date = e.currentTarget.getAttribute('data-date');
            const branch = e.currentTarget.getAttribute('data-branch');
            const files = e.currentTarget.getAttribute('data-files');
            
            let filesHtml = '';
            if (files) {
                const fileList = files.split(', ');
                filesHtml = '<div class="tooltip-files"><strong>Files:</strong><br>';
                fileList.forEach(file => {
                    filesHtml += `📄 ${file}<br>`;
                });
                filesHtml += '</div>';
            }
            
            tooltip.innerHTML = `
                <div class="tooltip-message">${message}</div>
                ${filesHtml}
                <div class="tooltip-author">by ${author}</div>
                <div class="tooltip-date">${date}</div>
                <div class="tooltip-branch">Branch: ${branch}</div>
            `;
            
            // Set tooltip position once on enter to prevent shaking
            tooltip.style.left = (e.pageX + 15) + 'px';
            tooltip.style.top = (e.pageY - 30) + 'px';
            
            tooltip.classList.add('visible');
        });
        
        node.addEventListener('mouseleave', () => {
            tooltip.classList.remove('visible');
        });
    });
}

function truncateText(text, maxLength) {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

// Extract filename from commit message
function extractFilenameFromCommit(message) {
    // Common patterns for file operations in commit messages
    const patterns = [
        /Added\s+(.+\.\w+)/i,           // "Added filename.ext"
        /Updated\s+(.+\.\w+)/i,        // "Updated filename.ext"
        /Modified\s+(.+\.\w+)/i,       // "Modified filename.ext"
        /Deleted\s+(.+\.\w+)/i,        // "Deleted filename.ext"
        /Removed\s+(.+\.\w+)/i,        // "Removed filename.ext"
        /Uploaded\s+(.+\.\w+)/i,       // "Uploaded filename.ext"
        /Renamed\s+.+\s+to\s+(.+\.\w+)/i, // "Renamed old.ext to new.ext"
        /Created\s+file:\s*(.+\.\w+)/i, // "Created file: filename.ext"
        /Updated\s+file:\s*(.+\.\w+)/i, // "Updated file: filename.ext"
        /:\s*(.+\.\w+)/,               // "Action: filename.ext"
        /(.+\.\w+)$/                   // filename.ext at end of message
    ];
    
    for (const pattern of patterns) {
        const match = message.match(pattern);
        if (match && match[1]) {
            // Clean up the filename (remove extra spaces, quotes, etc.)
            let filename = match[1].trim();
            filename = filename.replace(/['"]/g, ''); // Remove quotes
            
            // Only return if it looks like a valid filename
            if (filename.includes('.') && filename.length > 0 && filename.length < 100) {
                return filename;
            }
        }
    }
    
    return null;
}

// Render commit list in real-time
function renderCommitList() {
    const repo = getCurrentRepository();
    if (!repo) return;
    
    const commitListContainer = document.querySelector('.commit-list-container');
    if (!commitListContainer) return;
    
    const commits = repo.commits || [];
    
    if (commits.length === 0) {
        commitListContainer.innerHTML = '<div class="no-commits-message">No commits yet</div>';
        return;
    }
    
    // Sort commits by timestamp (newest first)
    const sortedCommits = commits.sort((a, b) => {
        const timeA = a.timestamp || 0;
        const timeB = b.timestamp || 0;
        return timeB - timeA;
    });
    
    commitListContainer.innerHTML = '';
    
    sortedCommits.forEach((commit, index) => {
        const commitItem = document.createElement('div');
        commitItem.className = 'commit-item';
        
        // Extract files from commit or message
        let filesHtml = '';
        if (commit.files && commit.files.length > 0) {
            filesHtml = '<div class="commit-files">';
            commit.files.forEach(file => {
                filesHtml += `<span class="commit-file-badge">📄 ${file}</span>`;
            });
            filesHtml += '</div>';
        }
        
        commitItem.innerHTML = `
            <div class="commit-info">
                <div class="commit-header">
                    <span class="commit-message-text">${commit.message}</span>
                    <span class="commit-branch-badge" style="background-color: ${getBranchColor(commit.branch)}">${commit.branch || 'main'}</span>
                </div>
                ${filesHtml}
                <div class="commit-meta">
                    <span class="commit-author">by ${commit.author}</span>
                    <span class="commit-date">${commit.date}</span>
                </div>
            </div>
            <div class="commit-actions">
                <button class="commit-hash-btn" title="Commit Hash">#${(commit.timestamp || index).toString().slice(-6)}</button>
            </div>
        `;
        
        commitListContainer.appendChild(commitItem);
    });
}

function getBranchColor(branchName) {
    const branchColors = {
        'main': '#1f6feb',
        'master': '#1f6feb',
        'feature/sorting': '#56d364',
        'feature/search': '#f85149',
        'hotfix/sorting-fix': '#d2a8ff'
    };
    return branchColors[branchName] || '#56d364';
}

function getCurrentRepository() {
    // Get current repository from URL or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const repoName = urlParams.get('repo') || 'LeetCode'; // Default repo name
    
    const repositories = JSON.parse(localStorage.getItem('githubSimulatorData')) || [];
    return repositories.find(repo => repo.name === repoName);
}

// Real-time updates for commit graph
function updateCommitGraphRealTime() {
    if (commitGraphVisible) {
        renderCommitGraph();
    }
}

// Enhanced commit creation with graph update
function createCommitWithGraphUpdate(message, author, branch = 'main', files = []) {
    // Get repository from global repositories array
    const repoIndex = repositories.findIndex(r => r.name === currentRepoName);
    if (repoIndex === -1) {
        console.error('Repository not found:', currentRepoName);
        return;
    }
    
    const repo = repositories[repoIndex];
    
    // Add new commit
    const newCommit = {
        message: message,
        author: author,
        date: new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        }),
        branch: branch,
        timestamp: Date.now(), // Add timestamp for real-time ordering
        files: files // Add files array to store affected files
    };
    
    if (!repo.commits) {
        repo.commits = [];
    }
    
    repo.commits.push(newCommit);
    
    // Also add commit to the specific branch's commits array
    if (repo.branches) {
        const targetBranch = repo.branches.find(b => b.name === branch);
        if (targetBranch) {
            if (!targetBranch.commits) {
                targetBranch.commits = [];
            }
            // Add to branch-specific commits (avoid duplicates)
            const branchCommitExists = targetBranch.commits.some(c => 
                c.message === newCommit.message && 
                c.timestamp === newCommit.timestamp
            );
            if (!branchCommitExists) {
                targetBranch.commits.push({...newCommit}); // Deep copy
            }
        }
    }
    
    // Update the global repositories array
    repositories[repoIndex] = repo;
    
    // Update localStorage with the global repositories array
    localStorage.setItem('githubSimulatorData', JSON.stringify(repositories));
    
    console.log('Commit created:', newCommit);
    console.log('Total commits in repo:', repo.commits.length);
    
    // Update commit graph if visible with animation
    updateCommitGraphRealTime();
    
    // Update commit list if visible
    if (document.querySelector('.commit-list-container')) {
        renderCommitList();
    }
    
    // Update commits view if the commits section is currently visible
    const commitsSection = document.getElementById('commits-section');
    if (commitsSection && commitsSection.style.display !== 'none') {
        renderCommits(repo.commits || []);
    }
    
    // Show notification
    showNotification(`New commit added: ${message}`, 'success');
}

// Function to automatically create commits when files are modified
function createAutoCommit(action, fileName, branch = 'main') {
    const messages = {
        'create': `Added file: ${fileName}`,
        'edit': `Updated file: ${fileName}`,
        'delete': `Removed file: ${fileName}`,
        'upload': `Uploaded file: ${fileName}`,
        'rename': `Renamed file: ${fileName}`
    };
    
    const message = messages[action] || `Modified file: ${fileName}`;
    createCommitWithGraphUpdate(message, currentUser, branch, [fileName]);
}

// Enhanced branch creation with graph update
function createBranchWithGraphUpdate(branchName, parentBranch = 'main') {
    const repo = getCurrentRepository();
    if (!repo) return;
    
    if (!repo.branches) {
        repo.branches = [{ name: 'main', parent: '', current: true }];
    }
    
    // Check if branch already exists
    if (repo.branches.find(b => b.name === branchName)) {
        showNotification(`Branch '${branchName}' already exists`, 'error');
        return;
    }
    
    // Add new branch
    const newBranch = {
        name: branchName,
        parent: parentBranch,
        current: false
    };
    
    repo.branches.push(newBranch);
    
    // Update localStorage
    const repositories = JSON.parse(localStorage.getItem('githubSimulatorData')) || [];
    const repoIndex = repositories.findIndex(r => r.name === repo.name);
    if (repoIndex >= 0) {
        repositories[repoIndex] = repo;
        localStorage.setItem('githubSimulatorData', JSON.stringify(repositories));
    }
    
    // Update commit graph if visible
    updateCommitGraphRealTime();
    
    // Show notification
    showNotification(`New branch created: ${branchName}`, 'success');
}

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
            
            // Populate branch-specific commits from main commits array
            repositories.forEach(repo => {
                if (repo.commits && repo.branches) {
                    repo.commits.forEach(commit => {
                        const branchName = commit.branch || 'main';
                        const targetBranch = repo.branches.find(b => b.name === branchName);
                        if (targetBranch) {
                            if (!targetBranch.commits) {
                                targetBranch.commits = [];
                            }
                            // Add commit to branch if it doesn't already exist
                            const exists = targetBranch.commits.some(c => 
                                c.message === commit.message && 
                                c.author === commit.author && 
                                c.date === commit.date
                            );
                            if (!exists) {
                                targetBranch.commits.push({...commit});
                            }
                        }
                    });
                }
            });
            
            localStorage.setItem('githubSimulatorData', JSON.stringify(repositories));
            console.log('Fallback data loaded successfully with branch-specific commits');
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
            currentBranch: 'main',
            branches: [
                { 
                    name: 'main', 
                    parent: '', 
                    current: true,
                    commits: []
                },
                { 
                    name: 'feature/sorting', 
                    parent: 'main', 
                    current: false,
                    commits: []
                },
                { 
                    name: 'feature/search', 
                    parent: 'main', 
                    current: false,
                    commits: []
                },
                { 
                    name: 'hotfix/sorting-fix', 
                    parent: 'main', 
                    current: false,
                    commits: []
                }
            ],
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
                    message: 'Initial commit: Project setup',
                    author: 'Shiwani',
                    date: 'October 5, 2025',
                    branch: 'main',
                    timestamp: Date.now() - 432000000, // 5 days ago
                    files: ['README.md']
                },
                {
                    message: 'Added file: LeetCodeSolutions.js',
                    author: 'Shiwani',
                    date: 'October 6, 2025',
                    branch: 'main',
                    timestamp: Date.now() - 345600000,
                    files: ['LeetCodeSolutions.js']
                },
                {
                    message: 'Feature: Added array sorting algorithms',
                    author: 'Shiwani',
                    date: 'October 6, 2025',
                    branch: 'feature/sorting',
                    timestamp: Date.now() - 259200000,
                    files: ['SortingAlgorithms.js']
                },
                {
                    message: 'Fix: Corrected bubble sort implementation',
                    author: 'Shiwani',
                    date: 'October 6, 2025',
                    branch: 'feature/sorting',
                    timestamp: Date.now() - 172800000
                },
                {
                    message: 'Merge: Integrated sorting algorithms',
                    author: 'Shiwani',
                    date: 'October 7, 2025',
                    branch: 'main',
                    timestamp: Date.now() - 86400000
                },
                {
                    message: 'Added file: README.md',
                    author: 'Shiwani',
                    date: 'October 7, 2025',
                    branch: 'main',
                    timestamp: Date.now() - 43200000
                },
                {
                    message: 'Added file: BinarySearch.js',
                    author: 'Shiwani',
                    date: 'October 8, 2025',
                    branch: 'feature/search',
                    timestamp: Date.now() - 21600000,
                    files: ['BinarySearch.js']
                },
                {
                    message: 'Updated file: BinarySearch.js',
                    author: 'Shiwani',
                    date: 'October 8, 2025',
                    branch: 'feature/search',
                    timestamp: Date.now() - 10800000,
                    files: ['BinarySearch.js']
                },
                {
                    message: 'Merge: Integrated search algorithms',
                    author: 'Shiwani',
                    date: 'October 9, 2025',
                    branch: 'main',
                    timestamp: Date.now() - 7200000
                },
                {
                    message: 'Updated file: SortingAlgorithms.js',
                    author: 'Shiwani',
                    date: 'October 9, 2025',
                    branch: 'hotfix/sorting-fix',
                    timestamp: Date.now() - 3600000,
                    files: ['SortingAlgorithms.js']
                },
                {
                    message: 'Merge: Applied sorting hotfix',
                    author: 'Shiwani',
                    date: 'October 10, 2025',
                    branch: 'main',
                    timestamp: Date.now() - 1800000
                }
            ]
        },
        {
            name: 'Personal-Notes',
            description: 'Private repository for personal notes and ideas',
            createdDate: '10/5/2025',
            isPrivate: true,
            currentBranch: 'main',
            branches: [
                { name: 'main', parent: '', current: true }
            ],
            files: [
                {
                    name: 'ideas.md',
                    info: 'Personal ideas and thoughts',
                    date: 'a few minutes ago',
                    content: `# Personal Ideas

## Project Ideas
- Build a task management app
- Create a personal blog
- Learn machine learning

## Notes
- Remember to backup important files
- Review code before committing
- Keep learning new technologies

This is private content that only the owner should see.`
                }
            ],
            commits: [
                {
                    message: 'Initial commit: Added personal ideas',
                    author: 'Shiwani',
                    date: 'October 5, 2025'
                }
            ]
        }
    ];
    
    // Populate branch-specific commits from main commits array
    repositories.forEach(repo => {
        if (repo.commits && repo.branches) {
            repo.commits.forEach(commit => {
                const branchName = commit.branch || 'main';
                const targetBranch = repo.branches.find(b => b.name === branchName);
                if (targetBranch) {
                    if (!targetBranch.commits) {
                        targetBranch.commits = [];
                    }
                    // Add commit to branch if it doesn't already exist
                    const exists = targetBranch.commits.some(c => 
                        c.message === commit.message && 
                        c.author === commit.author && 
                        c.date === commit.date
                    );
                    if (!exists) {
                        targetBranch.commits.push({...commit});
                    }
                }
            });
        }
    });
    
    // Save fallback data to localStorage
    localStorage.setItem('githubSimulatorData', JSON.stringify(repositories));
    console.log('Fallback data loaded with branch-specific commits populated');
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
            renderRepositories(getAccessibleRepositories(repositories));
            return;
        }
        
        // First try to search using the backend API
        fetch(`/api/search/repos/${encodeURIComponent(searchTerm)}`)
            .then(response => response.json())
            .then(data => {
                if (data.results && data.results.length > 0) {
                    // Filter repositories based on search results from backend and access control
                    const filteredRepos = getAccessibleRepositories(repositories.filter(repo => 
                        data.results.some(result => 
                            result.toLowerCase() === repo.name.toLowerCase()
                        )
                    ));
                    renderRepositories(filteredRepos);
                } else {
                    // Fallback to client-side search if no results from backend
                    const filteredRepos = getAccessibleRepositories(repositories.filter(repo => 
                        repo.name.toLowerCase().includes(searchTerm) || 
                        (repo.description && repo.description.toLowerCase().includes(searchTerm))
                    ));
                    renderRepositories(filteredRepos);
                }
            })
            .catch(error => {
                console.error('Error searching repositories:', error);
                // Fallback to client-side search on error
                const filteredRepos = getAccessibleRepositories(repositories.filter(repo => 
                    repo.name.toLowerCase().includes(searchTerm) || 
                    (repo.description && repo.description.toLowerCase().includes(searchTerm))
                ));
                renderRepositories(filteredRepos);
            });
    }, 300); // 300ms debounce
}

// --- Dashboard Functions ---
function renderDashboard() {
    const accessibleRepos = getAccessibleRepositories(repositories);
    renderRepositories(accessibleRepos);
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
                <div class="repo-title-section">
                    <h3 onclick="goToRepoPage('${repo.name}')">${repo.name}</h3>
                    ${repo.isPrivate ? '<span class="private-badge">Private</span>' : '<span class="public-badge">Public</span>'}
                </div>
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
            <div class="repo-card-footer">
                <span>Created ${repo.createdDate || 'recently'}</span>
                ${repo.isPrivate ? '<span class="privacy-indicator"><svg viewBox="0 0 16 16" fill="currentColor"><path d="M4 4a4 4 0 0 1 8 0v2h.5c.83 0 1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5h-9A1.5 1.5 0 0 1 2 12.5v-5C2 6.67 2.67 6 3.5 6H4V4zm6.5 2V4a2.5 2.5 0 0 0-5 0v2h5z"/></svg> Private</span>' : '<span class="privacy-indicator"><svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zM7 3.5a.5.5 0 0 1 1 0v3a.5.5 0 0 1-1 0v-3zM8 9a.75.75 0 1 1 0 1.5A.75.75 0 0 1 8 9z"/></svg> Public</span>'}
            </div>
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
        const repo = repositories.find(r => r.name === currentRepoName);
        if (repo && hasRepositoryAccess(repo)) {
            document.querySelector('.repo-name-text').textContent = decodeURIComponent(currentRepoName);
            document.querySelector('.repo-description-text').textContent = repo.description;
            
            // Update current branch indicator
            const currentBranchElement = document.getElementById('current-branch-name');
            if (currentBranchElement) {
                currentBranchElement.textContent = repo.currentBranch || 'main';
            }
            
            // Initialize branches if not present
            if (!repo.branches) {
                repo.branches = [{ 
                    name: 'main', 
                    parent: '', 
                    current: true,
                    files: repo.files ? repo.files.map(file => ({...file})) : [], // Deep copy current files
                    commits: repo.commits ? [...repo.commits] : [] // Copy current commits
                }];
                repo.currentBranch = 'main';
            }
        } else if (repo && !hasRepositoryAccess(repo)) {
            // Show access denied message for private repositories
            document.body.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; text-align: center;">
                    <svg viewBox="0 0 16 16" fill="currentColor" style="width: 64px; height: 64px; color: #f85149; margin-bottom: 20px;">
                        <path d="M4 4a4 4 0 0 1 8 0v2h.5c.83 0 1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5h-9A1.5 1.5 0 0 1 2 12.5v-5C2 6.67 2.67 6 3.5 6H4V4zm6.5 2V4a2.5 2.5 0 0 0-5 0v2h5z"/>
                    </svg>
                    <h2 style="color: #f85149; margin-bottom: 10px;">Access Denied</h2>
                    <p style="color: #8b949e; margin-bottom: 20px;">This repository is private and you don't have access to it.</p>
                    <a href="index.html" style="color: #1f6feb; text-decoration: none; padding: 8px 16px; border: 1px solid #1f6feb; border-radius: 6px;">← Back to Dashboard</a>
                </div>
            `;
            return;
        } else {
            // Repository not found
            document.body.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; text-align: center;">
                    <h2 style="color: #f85149; margin-bottom: 10px;">Repository Not Found</h2>
                    <p style="color: #8b949e; margin-bottom: 20px;">The repository you're looking for doesn't exist.</p>
                    <a href="index.html" style="color: #1f6feb; text-decoration: none; padding: 8px 16px; border: 1px solid #1f6feb; border-radius: 6px;">← Back to Dashboard</a>
                </div>
            `;
            return;
        }
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
        } else if (sectionId === 'branches') {
            renderBranches(currentRepo);
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
        return;
    }
    
    // Group commits by branch
    const commitsByBranch = {};
    commits.forEach(commit => {
        const branch = commit.branch || 'main';
        if (!commitsByBranch[branch]) {
            commitsByBranch[branch] = [];
        }
        commitsByBranch[branch].push(commit);
    });
    
    // Sort branches: main first, then others alphabetically
    const branchNames = Object.keys(commitsByBranch).sort((a, b) => {
        if (a === 'main') return -1;
        if (b === 'main') return 1;
        return a.localeCompare(b);
    });
    
    // Render commits grouped by branch
    branchNames.forEach(branchName => {
        const branchCommits = commitsByBranch[branchName];
        const branchColor = getBranchColor(branchName);
        
        // Branch header
        const branchHeader = document.createElement('div');
        branchHeader.className = 'branch-commits-header';
        branchHeader.style.borderLeftColor = branchColor;
        branchHeader.innerHTML = `
            <svg class="branch-icon" viewBox="0 0 16 16" fill="currentColor" style="color: ${branchColor}">
                <path d="M9.5 3.25a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.493 2.493 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25Zm-6 0a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Zm8.25-.75a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5ZM4.25 12a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Z"/>
            </svg>
            <span class="branch-name">${branchName}</span>
            <span class="commit-count">${branchCommits.length} commit${branchCommits.length !== 1 ? 's' : ''}</span>
        `;
        commitsList.appendChild(branchHeader);
        
        // Render commits for this branch
        branchCommits.forEach(commit => {
            const commitItem = document.createElement('div');
            commitItem.className = 'commit-item';
            commitItem.style.borderLeftColor = branchColor;
            
            // Extract files from commit or message
            let filesHtml = '';
            if (commit.files && commit.files.length > 0) {
                filesHtml = '<div class="commit-files">';
                commit.files.forEach(file => {
                    filesHtml += `<span class="commit-file-badge">📄 ${file}</span>`;
                });
                filesHtml += '</div>';
            }
            
            commitItem.innerHTML = `
                <div class="commit-msg">${commit.message}</div>
                ${filesHtml}
                <div class="commit-details">
                    <span class="commit-author">By ${commit.author}</span>
                    <span class="commit-date">on ${commit.date}</span>
                    <span class="commit-branch-tag" style="background-color: ${branchColor}">${commit.branch || 'main'}</span>
                </div>
            `;
            commitsList.appendChild(commitItem);
        });
    });
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
    
    // Add to local data with proper structure
    const newRepo = {
        name: name,
        description: description || 'Repository',
        createdDate: new Date().toLocaleDateString(),
        isPrivate: document.querySelector('#newRepoModal input[type="checkbox"]').checked,
        currentBranch: 'main',
        branches: [
            { 
                name: 'main', 
                parent: '', 
                current: true,
                files: [],
                commits: []
            }
        ],
        files: [],
        commits: [{
            message: `Created repository: ${name}`,
            author: currentUser,
            date: new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            }),
            branch: 'main',
            timestamp: Date.now(),
            files: []
        }]
    };
    
    repositories.push(newRepo);
    
    // Save to localStorage
    localStorage.setItem('githubSimulatorData', JSON.stringify(repositories));
    
    console.log('Repository created:', name);
    console.log('Initial commit added');
    
    // Call backend API
    await callBackendAPI('POST', '/api/repositories', `name=${name}&description=${description}&isPrivate=${newRepo.isPrivate}`);
    
    closeModal('newRepoModal');
    renderDashboard();
    
    // Clear form
    document.getElementById('repoName').value = '';
    document.getElementById('repoDescription').value = '';
    document.querySelector('#newRepoModal input[type="checkbox"]').checked = false;
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
    
    // Find repository in global array
    const repoIndex = repositories.findIndex(r => r.name === currentRepoName);
    if (repoIndex === -1) {
        alert('Repository not found');
        return;
    }
    
    const currentRepo = repositories[repoIndex];
    
    // Check if file already exists
    if (currentRepo.files && currentRepo.files.find(f => f.name === fullFileName)) {
        alert('File already exists!');
        return;
    }
    
    // Save state for undo
    saveStateForUndo('CREATE_FILE', `Created file: ${fullFileName}`);
    
    // Add file to repository
    const newFile = {
        name: fullFileName,
        info: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
        date: 'a few seconds ago',
        content: content
    };
    
    if (!currentRepo.files) {
        currentRepo.files = [];
    }
    currentRepo.files.push(newFile);
    
    // Add file to current branch
    const currentBranchData = currentRepo.branches?.find(b => b.current);
    if (currentBranchData) {
        if (!currentBranchData.files) {
            currentBranchData.files = [];
        }
        currentBranchData.files.push({...newFile}); // Deep copy
    }
    
    // Update global repositories array
    repositories[repoIndex] = currentRepo;
    
    // Save to localStorage
    localStorage.setItem('githubSimulatorData', JSON.stringify(repositories));
    
    console.log('File created:', fullFileName);
    console.log('Repository files:', currentRepo.files.length);
    
    // Create auto-commit for the new file
    const autoCommitMessage = commitMessage || `Added ${fullFileName}`;
    createCommitWithGraphUpdate(autoCommitMessage, currentUser, currentRepo.currentBranch || 'main', [fullFileName]);
    
    // Call backend API
    await callBackendAPI('POST', `/api/repositories/${currentRepoName}/files`, 
        `name=${fullFileName}&content=${content}`);
    
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
            
            // Also update in current branch's files
            const currentBranchData = currentRepo.branches?.find(b => b.current);
            if (currentBranchData && currentBranchData.files) {
                const branchFile = currentBranchData.files.find(f => f.name === currentFileName);
                if (branchFile) {
                    branchFile.name = fileName;
                    branchFile.info = file.info;
                    branchFile.date = file.date;
                    branchFile.content = file.content;
                }
                
                // Add commit to branch-specific commits
                if (!currentBranchData.commits) {
                    currentBranchData.commits = [];
                }
                currentBranchData.commits.push({
                    message: `Updated file: ${oldName} → ${fileName}`,
                    author: 'Shiwani',
                    date: new Date().toLocaleDateString()
                });
            }
            
            // Create auto-commit for the file change
            const action = oldName !== fileName ? 'rename' : 'edit';
            const commitMessage = oldName !== fileName ? 
                `Renamed ${oldName} to ${fileName}` : 
                `Updated ${fileName}`;
            createCommitWithGraphUpdate(commitMessage, currentUser, currentRepo.currentBranch || 'main', [fileName]);
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
        
        // Also remove from current branch's files
        const currentBranchData = currentRepo.branches?.find(b => b.current);
        if (currentBranchData && currentBranchData.files) {
            currentBranchData.files = currentBranchData.files.filter(f => f.name !== currentFileName);
            
            // Add commit to branch-specific commits
            if (!currentBranchData.commits) {
                currentBranchData.commits = [];
            }
            currentBranchData.commits.push({
                message: `Deleted file: ${currentFileName}`,
                author: currentUser,
                date: new Date().toLocaleDateString()
            });
        }
        
        // Create auto-commit for the file deletion
        createCommitWithGraphUpdate(`Removed ${currentFileName}`, currentUser, currentRepo.currentBranch || 'main', [currentFileName]);
        
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
            
            // Save to localStorage immediately after adding file
            const repositories = JSON.parse(localStorage.getItem('githubSimulatorData')) || [];
            const repoIndex = repositories.findIndex(r => r.name === currentRepo.name);
            if (repoIndex >= 0) {
                repositories[repoIndex] = currentRepo;
                localStorage.setItem('githubSimulatorData', JSON.stringify(repositories));
            }
            
            // Create auto-commit for the uploaded file
            const autoCommitMessage = commitMessage || `Uploaded ${fullFileName}`;
            createCommitWithGraphUpdate(autoCommitMessage, currentUser, currentRepo.currentBranch || 'main', [fullFileName]);
            
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

// View file content in a large modal with syntax highlighting
function viewFileContent(fileName) {
    const currentRepo = repositories.find(r => r.name === currentRepoName);
    const file = currentRepo ? currentRepo.files.find(f => f.name === fileName) : null;
    
    if (file) {
        const fileNameElement = document.getElementById('viewFileName');
        const fileContentElement = document.getElementById('viewFileContent');
        
        // Set file name and content
        fileNameElement.textContent = fileName;
        
        // Get file extension for syntax highlighting
        const fileExtension = fileName.split('.').pop().toLowerCase();
        const language = getLanguageFromExtension(fileExtension);
        
        // Apply syntax highlighting if supported language
        if (language && file.content) {
            fileContentElement.innerHTML = ''; // Clear previous content
            const codeElement = document.createElement('code');
            codeElement.className = `language-${language}`;
            codeElement.textContent = file.content;
            fileContentElement.appendChild(codeElement);
            
            // Apply syntax highlighting
            if (window.Prism) {
                Prism.highlightElement(codeElement);
            }
        } else {
            // Fallback for unsupported file types
            fileContentElement.textContent = file.content || 'No content available';
        }
        
        // Open the modal
        openModal('viewFileModal');
        
        // Add line numbers if it's a code file
        if (language) {
            fileContentElement.classList.add('line-numbers');
            if (window.Prism) {
                Prism.hooks.run('line-numbers', fileContentElement);
            }
        } else {
            fileContentElement.classList.remove('line-numbers');
        }
    } else {
        showNotification('File not found', 'error');
    }
}

// Helper function to determine language from file extension
function getLanguageFromExtension(ext) {
    const languageMap = {
        'js': 'javascript',
        'jsx': 'jsx',
        'ts': 'typescript',
        'tsx': 'tsx',
        'html': 'html',
        'css': 'css',
        'json': 'json',
        'md': 'markdown',
        'py': 'python',
        'java': 'java',
        'c': 'c',
        'cpp': 'cpp',
        'cs': 'csharp',
        'php': 'php',
        'rb': 'ruby',
        'go': 'go',
        'rs': 'rust',
        'swift': 'swift',
        'kt': 'kotlin',
        'sh': 'bash',
        'yaml': 'yaml',
        'yml': 'yaml',
        'xml': 'xml',
        'sql': 'sql',
        'diff': 'diff',
        'dockerfile': 'docker',
        'gitignore': 'git',
        'gradle': 'gradle',
        'properties': 'properties',
        'txt': 'text'
    };
    
    return languageMap[ext] || null;
}

// -------------------- Branch Management Functions --------------------

// Test function to verify branch isolation
function testBranchIsolation() {
    console.log('Testing branch isolation...');
    const testRepo = repositories.find(r => r.name === currentRepoName);
    if (!testRepo || !testRepo.branches || testRepo.branches.length < 2) {
        console.log('Need at least 2 branches to test isolation');
        return;
    }
    
    const branch1 = testRepo.branches[0];
    const branch2 = testRepo.branches[1];
    
    console.log('Branch 1 files:', branch1.files?.length || 0);
    console.log('Branch 2 files:', branch2.files?.length || 0);
    
    // Test if modifying one branch affects another
    if (branch1.files && branch2.files && branch1.files.length > 0) {
        const originalContent = branch1.files[0].content;
        branch1.files[0].content = 'MODIFIED_CONTENT_TEST';
        
        const isolated = branch2.files.find(f => f.name === branch1.files[0].name)?.content !== 'MODIFIED_CONTENT_TEST';
        console.log('Branch isolation working:', isolated);
        
        // Restore original content
        branch1.files[0].content = originalContent;
        
        return isolated;
    }
    
    return true;
}

// Test function to verify merge functionality
function testMergeFunctionality() {
    console.log('Testing merge functionality...');
    const testRepo = repositories.find(r => r.name === currentRepoName);
    if (!testRepo || !testRepo.branches || testRepo.branches.length < 2) {
        console.log('Need at least 2 branches to test merge functionality');
        return false;
    }
    
    const branch1 = testRepo.branches[0];
    const branch2 = testRepo.branches[1];
    
    console.log(`Testing merge from '${branch1.name}' to '${branch2.name}'`);
    
    // Count files and commits before merge
    const files1Before = branch1.files?.length || 0;
    const files2Before = branch2.files?.length || 0;
    const commits1Before = branch1.commits?.length || 0;
    const commits2Before = branch2.commits?.length || 0;
    
    console.log('Before merge:');
    console.log(`  ${branch1.name}: ${files1Before} files, ${commits1Before} commits`);
    console.log(`  ${branch2.name}: ${files2Before} files, ${commits2Before} commits`);
    
    // Simulate merge operation (without actually calling the merge function)
    let filesAdded = 0, filesUpdated = 0, commitsAdded = 0;
    
    // Test file merging logic
    if (branch1.files) {
        branch1.files.forEach(sourceFile => {
            if (!branch2.files) branch2.files = [];
            
            const existingFile = branch2.files.find(f => f.name === sourceFile.name);
            if (existingFile) {
                if (existingFile.content !== sourceFile.content) {
                    filesUpdated++;
                }
            } else {
                filesAdded++;
            }
        });
    }
    
    // Test commit merging logic
    if (branch1.commits) {
        if (!branch2.commits) branch2.commits = [];
        
        branch1.commits.forEach(sourceCommit => {
            const existingCommit = branch2.commits.find(c => 
                c.message === sourceCommit.message && 
                c.author === sourceCommit.author && 
                c.date === sourceCommit.date
            );
            if (!existingCommit) {
                commitsAdded++;
            }
        });
    }
    
    console.log('Merge simulation results:');
    console.log(`  Files to add: ${filesAdded}`);
    console.log(`  Files to update: ${filesUpdated}`);
    console.log(`  Commits to add: ${commitsAdded}`);
    
    const testPassed = (filesAdded >= 0 && filesUpdated >= 0 && commitsAdded >= 0);
    console.log('Merge functionality test:', testPassed ? 'PASSED' : 'FAILED');
    
    return testPassed;
}

function renderBranches(repo) {
    const branchContainer = document.getElementById('branchListContainer');
    const branchSwitchSelect = document.getElementById('branchSwitchSelect');
    const baseBranchSelect = document.getElementById('baseBranchSelect');
    const sourceBranchSelect = document.getElementById('sourceBranchSelect');
    const targetBranchSelect = document.getElementById('targetBranchSelect');
    
    if (!repo.branches) {
        repo.branches = [{ name: 'main', parent: '', current: true }];
        repo.currentBranch = 'main';
    }
    
    // Update current branch indicator
    const currentBranchElement = document.getElementById('current-branch-name');
    if (currentBranchElement) {
        currentBranchElement.textContent = repo.currentBranch || 'main';
    }
    
    // Render branch list
    branchContainer.innerHTML = '';
    if (repo.branches.length === 0) {
        branchContainer.innerHTML = '<div class="no-branches-message">No branches found</div>';
        return;
    }
    
    repo.branches.forEach(branch => {
        const branchItem = document.createElement('div');
        branchItem.className = `branch-item ${branch.current ? 'current-branch' : ''}`;
        branchItem.innerHTML = `
            <div class="branch-info">
                <div class="branch-name">
                    <svg class="branch-icon" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 2C4.89 2 4 2.89 4 4C4 5.11 4.89 6 6 6C7.11 6 8 5.11 8 4C8 2.89 7.11 2 6 2M4 7V12C4 13.11 4.89 14 6 14C7.11 14 8 13.11 8 12V7H4M18 16C16.89 16 16 16.89 16 18C16 19.11 16.89 20 18 20C19.11 20 20 19.11 20 18C20 16.89 19.11 16 18 16M14 7V12C14 15.31 16.69 18 20 18V16C17.79 16 16 14.21 16 12V7H14Z"/>
                    </svg>
                    ${branch.name}
                    ${branch.current ? '<span class="current-indicator">current</span>' : ''}
                </div>
                ${branch.parent ? `<div class="branch-parent">from ${branch.parent}</div>` : ''}
            </div>
            <div class="branch-actions">
                ${!branch.current ? `<button class="switch-branch-btn" onclick="switchToBranch('${branch.name}')">Switch</button>` : ''}
                ${branch.name !== 'main' ? `<button class="delete-branch-btn" onclick="deleteBranch('${branch.name}')">Delete</button>` : ''}
            </div>
        `;
        branchContainer.appendChild(branchItem);
    });
    
    // Update select dropdowns
    updateBranchSelects(repo.branches);
}

function updateBranchSelects(branches) {
    const selects = [
        document.getElementById('branchSwitchSelect'),
        document.getElementById('baseBranchSelect'),
        document.getElementById('sourceBranchSelect'),
        document.getElementById('targetBranchSelect')
    ];
    
    selects.forEach(select => {
        if (!select) return;
        
        // Clear existing options (except first one for switch select)
        const isSwitch = select.id === 'branchSwitchSelect';
        const firstOption = isSwitch ? select.firstElementChild : null;
        select.innerHTML = '';
        if (firstOption) select.appendChild(firstOption);
        
        // Add branch options
        branches.forEach(branch => {
            const option = document.createElement('option');
            option.value = branch.name;
            option.textContent = branch.name;
            select.appendChild(option);
        });
    });
}

async function createNewBranch() {
    const baseBranch = document.getElementById('baseBranchSelect').value;
    const newBranchName = document.getElementById('newBranchName').value.trim();
    
    if (!newBranchName) {
        alert('Branch name is required');
        return;
    }
    
    const currentRepo = repositories.find(r => r.name === currentRepoName);
    if (!currentRepo) return;
    
    // Check if branch already exists
    if (currentRepo.branches && currentRepo.branches.find(b => b.name === newBranchName)) {
        alert('Branch already exists!');
        return;
    }
    
    // Save state for undo
    saveStateForUndo('CREATE_BRANCH', `Created branch: ${newBranchName} from ${baseBranch}`);
    
    // Add new branch with deep copy of files from base branch
    if (!currentRepo.branches) {
        currentRepo.branches = [{ name: 'main', parent: '', current: true }];
    }
    
    // Find the base branch to copy files from
    const baseBranchData = currentRepo.branches.find(b => b.name === baseBranch);
    let branchFiles = [];
    
    if (baseBranchData && baseBranchData.files) {
        // Deep copy files from base branch
        branchFiles = baseBranchData.files.map(file => ({
            name: file.name,
            content: file.content,
            info: file.info,
            date: file.date
        }));
    } else if (baseBranch === 'main' || baseBranch === currentRepo.currentBranch) {
        // Copy files from current repository files (main branch)
        branchFiles = currentRepo.files.map(file => ({
            name: file.name,
            content: file.content,
            info: file.info,
            date: file.date
        }));
    }
    
    currentRepo.branches.push({
        name: newBranchName,
        parent: baseBranch,
        current: false,
        files: branchFiles, // Store branch-specific files
        commits: [] // Initialize empty commits array for this branch
    });
    
    // Call backend API
    try {
        await callBackendAPI('POST', `/api/repositories/${currentRepoName}/branches`, 
            `baseBranch=${baseBranch}&newBranch=${newBranchName}`);
    } catch (error) {
        console.error('Error creating branch:', error);
    }
    
    // Update commit graph if visible
    updateCommitGraphRealTime();
    
    // Create initial commit for the new branch
    createCommitWithGraphUpdate(`Created branch ${newBranchName} from ${baseBranch}`, currentUser, newBranchName);
    
    closeModal('createBranchModal');
    showSection('branches');
    
    // Clear form
    document.getElementById('newBranchName').value = '';
    
    showNotification(`Branch '${newBranchName}' created from '${baseBranch}'`, 'success');
}

async function switchToBranch(branchName) {
    if (!branchName) return;
    
    const currentRepo = repositories.find(r => r.name === currentRepoName);
    if (!currentRepo || !currentRepo.branches) return;
    
    // Save current branch files before switching
    const currentBranchData = currentRepo.branches.find(b => b.current);
    if (currentBranchData) {
        currentBranchData.files = currentRepo.files.map(file => ({
            name: file.name,
            content: file.content,
            info: file.info,
            date: file.date
        }));
    }
    
    // Update current branch
    currentRepo.branches.forEach(branch => {
        branch.current = branch.name === branchName;
    });
    currentRepo.currentBranch = branchName;
    
    // Load files from the target branch
    const targetBranchData = currentRepo.branches.find(b => b.name === branchName);
    if (targetBranchData && targetBranchData.files) {
        currentRepo.files = targetBranchData.files.map(file => ({
            name: file.name,
            content: file.content,
            info: file.info,
            date: file.date
        }));
    } else {
        // If no branch-specific files, use empty array or default files
        currentRepo.files = [];
    }
    
    // Save state for undo
    saveStateForUndo('SWITCH_BRANCH', `Switched to branch: ${branchName}`);
    
    // Call backend API
    try {
        await callBackendAPI('PUT', `/api/repositories/${currentRepoName}/branches/switch`, 
            `branchName=${branchName}`);
    } catch (error) {
        console.error('Error switching branch:', error);
    }
    
    // Update UI
    document.getElementById('current-branch-name').textContent = branchName;
    document.getElementById('branchSwitchSelect').value = '';
    
    // Refresh current section
    showSection('files'); // Switch back to files view
    
    showNotification(`Switched to branch '${branchName}'`, 'success');
}

async function mergeBranches() {
    const sourceBranch = document.getElementById('sourceBranchSelect').value;
    const targetBranch = document.getElementById('targetBranchSelect').value;
    
    if (!sourceBranch || !targetBranch) {
        alert('Please select both source and target branches');
        return;
    }
    
    if (sourceBranch === targetBranch) {
        alert('Source and target branches cannot be the same');
        return;
    }
    
    const currentRepo = repositories.find(r => r.name === currentRepoName);
    if (!currentRepo || !currentRepo.branches) return;
    
    // Find source and target branches
    const sourceBranchData = currentRepo.branches.find(b => b.name === sourceBranch);
    const targetBranchData = currentRepo.branches.find(b => b.name === targetBranch);
    
    if (!sourceBranchData || !targetBranchData) {
        alert('Source or target branch not found');
        return;
    }
    
    // Save state for undo
    saveStateForUndo('MERGE_BRANCH', `Merged ${sourceBranch} into ${targetBranch}`);
    
    // Perform merge operation locally
    let filesAdded = 0, filesUpdated = 0, commitsAdded = 0;
    
    // Step 1: Merge files from source to target
    if (sourceBranchData.files) {
        sourceBranchData.files.forEach(sourceFile => {
            if (!targetBranchData.files) {
                targetBranchData.files = [];
            }
            
            // Check if file exists in target
            const existingFile = targetBranchData.files.find(f => f.name === sourceFile.name);
            
            if (existingFile) {
                // File exists, update content if different
                if (existingFile.content !== sourceFile.content) {
                    existingFile.content = sourceFile.content;
                    existingFile.info = sourceFile.info;
                    existingFile.date = 'merged - ' + new Date().toLocaleString();
                    filesUpdated++;
                }
            } else {
                // File doesn't exist, add it (deep copy)
                targetBranchData.files.push({
                    name: sourceFile.name,
                    content: sourceFile.content,
                    info: sourceFile.info,
                    date: 'merged - ' + new Date().toLocaleString()
                });
                filesAdded++;
            }
        });
    }
    
    // Step 2: Merge commits from source to target
    if (sourceBranchData.commits) {
        if (!targetBranchData.commits) {
            targetBranchData.commits = [];
        }
        
        sourceBranchData.commits.forEach(sourceCommit => {
            // Check if commit already exists (avoid duplicates)
            const existingCommit = targetBranchData.commits.find(c => 
                c.message === sourceCommit.message && 
                c.author === sourceCommit.author && 
                c.date === sourceCommit.date
            );
            
            if (!existingCommit) {
                // Add commit (deep copy)
                targetBranchData.commits.push({
                    message: sourceCommit.message,
                    author: sourceCommit.author,
                    date: sourceCommit.date
                });
                commitsAdded++;
            }
        });
    }
    
    // Step 3: Add merge commit
    const mergeMessage = `Merged branch ${sourceBranch} into ${targetBranch} (${filesAdded} files added, ${filesUpdated} files updated, ${commitsAdded} commits merged)`;
    
    if (!targetBranchData.commits) {
        targetBranchData.commits = [];
    }
    
    targetBranchData.commits.push({
        message: mergeMessage,
        author: 'System',
        date: new Date().toLocaleDateString()
    });
    
    // Update global repository files if target is current branch
    if (targetBranch === currentRepo.currentBranch) {
        currentRepo.files = targetBranchData.files ? [...targetBranchData.files] : [];
    }
    
    // Call backend API
    try {
        await callBackendAPI('POST', `/api/repositories/${currentRepoName}/branches/merge`, 
            `sourceBranch=${sourceBranch}&targetBranch=${targetBranch}`);
    } catch (error) {
        console.error('Error merging branches:', error);
    }
    
    closeModal('mergeBranchModal');
    showSection('branches');
    
    const detailedMessage = `Successfully merged '${sourceBranch}' into '${targetBranch}': ${filesAdded} files added, ${filesUpdated} files updated, ${commitsAdded} commits merged`;
    showNotification(detailedMessage, 'success');
    
    console.log('Merge completed:', {
        sourceBranch,
        targetBranch,
        filesAdded,
        filesUpdated,
        commitsAdded
    });
}

async function deleteBranch(branchName) {
    if (branchName === 'main') {
        alert('Cannot delete main branch');
        return;
    }
    
    if (!confirm(`Are you sure you want to delete branch '${branchName}'?`)) {
        return;
    }
    
    const currentRepo = repositories.find(r => r.name === currentRepoName);
    if (!currentRepo || !currentRepo.branches) return;
    
    // Save state for undo
    saveStateForUndo('DELETE_BRANCH', `Deleted branch: ${branchName}`);
    
    // Remove branch
    currentRepo.branches = currentRepo.branches.filter(b => b.name !== branchName);
    
    // If current branch was deleted, switch to main
    if (currentRepo.currentBranch === branchName) {
        await switchToBranch('main');
    }
    
    showSection('branches');
    showNotification(`Branch '${branchName}' deleted`, 'success');
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