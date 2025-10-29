# GitHub Simulator

A comprehensive GitHub-like repository management system with both C++ backend and modern web frontend integration.

## Features

- **Dual Interface**: Console-based CLI and modern web interface
- **Repository Management**: Create, edit, delete, and manage repositories
- **File Operations**: Create, edit, delete, upload, and view files within repositories
- **Branch Management**: Complete Git-like branching system with create, switch, merge, and delete operations
- **Version Control**: Advanced undo/redo functionality with operation history tracking
- **Task Management**: Add, manage, and track tasks for repositories
- **Search Functionality**: Search repositories and files with real-time filtering
- **Data Persistence**: JSON-based data storage with localStorage integration

## Data Structures Used

| Feature                     | Data Structure Used      | Implementation Details          |
| --------------------------- | ------------------------ | ------------------------------- |
| Repository Management       | Singly Linked List       | Dynamic repository storage      |
| File Management             | Singly Linked List       | File organization within repos  |
| Branch Management           | Tree/Graph + Map         | Hierarchical branch structure with fast lookup |
| Undo/Redo Operations        | Stack (Dual Stack)       | Separate undo and redo stacks   |
| Task Management             | Queue                    | FIFO task processing            |
| Search Repositories & Files | Binary Search Tree (BST) | Optimized search operations     |
| Commit History              | Doubly Linked List (DLL) | Bidirectional commit navigation per branch |

## Architecture

- **Backend**: C++ application implementing core data structures and algorithms
- **Frontend**: Modern HTML5, CSS3, JavaScript with responsive design
- **Data Layer**: JSON-based communication with localStorage fallback
- **UI/UX**: Clean, GitHub-inspired interface with dark theme

## How to Run

### Option 1: Web Interface (Recommended)

1. Open `index.html` directly in your web browser
2. The application runs entirely in the browser with localStorage persistence
3. No compilation required - works out of the box

### Option 2: With C++ Backend

1. Compile: `g++ -o github_simulator main.cpp`
2. Run: `./github_simulator` or `github_simulator.exe`
3. Choose web mode to generate `data.json`
4. Open `index.html` in your browser for enhanced backend integration

### Option 3: Console Mode (C++ CLI)

1. Compile and run the C++ program
2. Choose console mode for command-line interface
3. Use interactive CLI commands to manage repositories

## Web Interface Features

### Dashboard (index.html)

- **Repository Grid**: Visual repository cards with descriptions and metadata
- **Search & Filter**: Real-time repository search functionality
- **Create Repository**: Modal-based repository creation with privacy settings
- **Edit/Delete**: Inline repository management options
- **Undo/Redo/History**: Full operation tracking and reversal capabilities

### Repository View (repo.html)

- **File Management**: Create, upload, edit, and delete files
- **File Viewer**: Syntax-highlighted file content display
- **Search Files**: Filter files by name and content
- **Branch Management**: Complete branching system with visual branch indicator
  - Create new branches from existing branches
  - Switch between branches with dropdown selection
  - Merge branches with conflict-free merging
  - Delete branches (except main branch)
  - Visual branch hierarchy and current branch indicator
- **Commit Tracking**: View repository commit history per branch
- **Task Management**: Add and track repository-specific tasks
- **Operation History**: Dedicated undo/redo stack visualization

### Key Features

- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Dark Theme**: Modern GitHub-inspired dark interface
- **Modal Dialogs**: Clean, accessible modal interfaces for all operations
- **Real-time Updates**: Instant UI updates with data persistence
- **Notification System**: User feedback for all operations
- **Local Storage**: Persistent data storage in browser

## Technical Implementation

### Undo/Redo System

- **Dual Stack Architecture**: Separate undo and redo operation stacks
- **State Snapshots**: Complete application state preservation
- **Operation Tracking**: Detailed action history with timestamps
- **UI Integration**: Visual indicators and history modal

### Branch Management System
- **Tree Structure**: Branches organized in a hierarchical tree/graph structure
- **Fast Lookup**: Map-based branch indexing for O(1) branch access
- **Branch Operations**:
  - `createBranch(baseBranch, newBranch)`: Create new branch from existing branch
  - `switchBranch(branchName)`: Switch active branch context
  - `mergeBranch(sourceBranch, targetBranch)`: Merge branch changes
  - `listBranches()`: Get all available branches
- **Per-Branch Data**: Each branch maintains its own file versions and commit history
- **Visual Indicators**: Current branch display and branch hierarchy visualization

### Data Management

- **JSON Serialization**: Structured data export/import with branch information
- **localStorage Integration**: Browser-based data persistence including branch state
- **Fallback Data**: Default repository data with main branch initialization
- **State Synchronization**: Consistent data across all interfaces and branches

## Files Structure

```
├── main.cpp              # C++ backend with data structures
├── index.html            # Main dashboard page
├── repo.html             # Repository details page
├── script.js             # Frontend JavaScript logic
├── style.css             # Modern UI styling and themes
├── run.bat               # Windows compilation script
├── data.json             # Backend-generated data (optional)
└── README.md             # Project documentation
```

## Browser Compatibility

- **Chrome/Chromium**: Full support
- **Firefox**: Full support
- **Safari**: Full support
- **Edge**: Full support
- **Mobile Browsers**: Responsive design support

## Getting Started

1. **Quick Start**: Simply open `index.html` in any modern web browser
2. **Create Repository**: Click "New Repository" to create your first repo
3. **Add Files**: Navigate to a repository and use "Create File" or "Upload File"
4. **Explore Features**: Try the undo/redo functionality and task management
5. **View History**: Use the history button to see operation tracking

## Future Enhancements

- Branch management system
- Collaborative features
- Advanced file diff visualization
- Plugin system for extensions
- Cloud storage integration
