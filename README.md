# GitHub Simulator

A comprehensive GitHub-like repository management system with both C++ backend and modern web frontend integration.

## Features

- **Dual Interface**: Console-based CLI and modern web interface
- **Repository Management**: Create, edit, delete, and manage repositories
- **File Operations**: Create, edit, delete, upload, and view files within repositories
- **Branch Management**: Complete Git-like branching system with **full branch isolation**
  - Create, switch, merge, and delete branches
  - **Deep copy isolation**: Each branch maintains independent file copies
  - **Per-branch commit history**: Isolated commit logs for each branch
  - **Memory-safe operations**: No shared references between branches
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

### Option 1: Quick Start with Batch Script (Windows)
```bash
.\run.bat
```
This will automatically compile and run the C++ backend, then open the web interface.

### Option 2: Web Interface Only (Recommended)
1. Open `index.html` directly in your web browser
2. The application runs entirely in the browser with localStorage persistence
3. No compilation required - works out of the box

### Option 3: Manual C++ Backend Setup
1. **Compile**: `g++ -o github_simulator main.cpp`
2. **Run Backend**: `./github_simulator` or `github_simulator.exe`
3. **Choose Mode**:
   - **Web Mode**: Generates `data.json` for web interface
   - **Console Mode**: Interactive CLI for terminal usage
4. **Open Web Interface**: Launch `index.html` in your browser

### Option 4: Console Mode Only (C++ CLI)
1. Compile and run: `g++ -o github_simulator main.cpp && ./github_simulator`
2. Choose option `1` for console mode
3. Use interactive CLI commands to manage repositories and test branch isolation

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
- **Complete Branch Isolation**: Deep copy implementation ensures no shared memory
- **Branch Operations**:
  - `createBranch(baseBranch, newBranch)`: Create new branch with deep-copied files
  - `switchBranch(branchName)`: Switch active branch context with file isolation
  - `mergeBranch(sourceBranch, targetBranch)`: Merge branch changes safely
  - `listBranches()`: Get all available branches
  - `testBranchIsolation()`: Verify branch isolation integrity
- **Per-Branch Data**: Each branch maintains completely independent file versions and commit history
- **Memory Management**: Proper destructors and cleanup prevent memory leaks
- **Visual Indicators**: Current branch display and branch hierarchy visualization

### Data Management

- **JSON Serialization**: Structured data export/import with branch information
- **localStorage Integration**: Browser-based data persistence including branch state
- **Fallback Data**: Default repository data with main branch initialization
- **State Synchronization**: Consistent data across all interfaces and branches

## Files Structure

```
├── main.cpp              # C++ backend with data structures and branch isolation
├── index.html            # Main dashboard page
├── repo.html             # Repository details page with branch management
├── script.js             # Frontend JavaScript with branch isolation logic
├── style.css             # Modern UI styling and branch management themes
├── run.bat               # Windows compilation and execution script
├── data.json             # Backend-generated data with branch information (optional)
└── README.md             # Project documentation
```

## Batch Script Details

The `run.bat` script provides an automated way to compile and run the project:

```batch
.\run.bat
```

**What it does:**
1. Compiles the C++ backend using `g++ -o github_simulator main.cpp`
2. Handles compilation errors gracefully
3. Runs the compiled executable
4. Provides user-friendly prompts for mode selection
5. Gives instructions for opening the web interface

**Requirements:**
- Windows operating system
- MinGW-w64 or similar C++ compiler with `g++` command available
- Modern web browser for web interface

## Browser Compatibility

- **Chrome/Chromium**: Full support
- **Firefox**: Full support
- **Safari**: Full support
- **Edge**: Full support
- **Mobile Browsers**: Responsive design support

## Getting Started

### Quick Start Guide
1. **Launch Application**: Run `.\run.bat` (Windows) or open `index.html` directly
2. **Create Repository**: Click "New Repository" to create your first repo
3. **Add Files**: Navigate to a repository and use "Create File" or "Upload File"
4. **Explore Branches**: 
   - Go to "Branches" tab in repository view
   - Create a new branch from main
   - Switch between branches and notice file isolation
   - Add different files to different branches
5. **Test Branch Isolation**: 
   - Console mode: Use option 14 "Test Branch Isolation"
   - Web mode: Create files in different branches and verify independence
6. **Explore Features**: Try the undo/redo functionality and task management
7. **View History**: Use the history button to see operation tracking

### Branch Isolation Demo
```bash
# Console Mode Demo
1. Create repository "TestRepo"
2. Create branch "feature" from "main"
3. Add file "main.txt" to main branch
4. Switch to "feature" branch
5. Add file "feature.txt" to feature branch
6. Run "Test Branch Isolation" - should show "YES"
7. Switch between branches to see different files
```

## Testing & Verification

### Branch Isolation Testing
The system includes built-in testing to verify branch isolation:

**Console Mode Testing:**
- Menu option 14: "Test Branch Isolation"
- Automatically tests file independence between branches
- Reports: "Branch isolation working: YES/NO"

**Web Mode Testing:**
- JavaScript function: `testBranchIsolation()`
- Can be called from browser console
- Verifies frontend branch isolation

**Manual Testing Steps:**
1. Create a repository with multiple branches
2. Add different files to different branches
3. Modify files in one branch
4. Switch to another branch and verify files are unchanged
5. Use the built-in test functions to verify programmatically

### Expected Test Results
✅ **Branch Isolation**: Each branch maintains independent file copies  
✅ **Memory Safety**: No shared pointers between branches  
✅ **File Operations**: CRUD operations work correctly per branch  
✅ **Commit History**: Each branch has independent commit logs  
✅ **Branch Switching**: Files change correctly when switching branches

## Recent Updates

### ✅ Branch Isolation Implementation (Latest)
- **Deep Copy Architecture**: Complete file and commit isolation between branches
- **Memory Safety**: Proper destructors and cleanup prevent memory leaks
- **Testing Framework**: Built-in branch isolation testing in both console and web modes
- **Performance**: O(1) branch lookup with efficient memory management
- **Verification**: Console test confirms "Branch isolation working: YES"

### ✅ Enhanced Branch Management
- **Visual Branch Indicator**: Current branch displayed in repository header
- **Branch-Specific Operations**: All file operations respect current branch context
- **Independent Commit History**: Each branch maintains its own commit log
- **Safe Merging**: Conflict-free branch merging with proper file handling

## Future Enhancements

- Advanced merge conflict resolution
- Branch comparison and diff visualization
- Collaborative features with multi-user support
- Plugin system for extensions
- Cloud storage integration
- Git-style staging area
- Advanced search with branch filtering
