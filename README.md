# 🚀 GitHub VCS Simulator

A fully functional **Version Control System** simulator built with HTML, CSS, and JavaScript that mimics GitHub's core features including repositories, commits, branches, and file management.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

## 📋 Table of Contents

- [Features](#-features)
- [Quick Start](#-quick-start)
- [How to Run](#-how-to-run)
- [Project Structure](#-project-structure)
- [Usage Guide](#-usage-guide)
- [Technical Details](#-technical-details)
- [Troubleshooting](#-troubleshooting)

---

## ✨ Features

### 🗂️ Repository Management
- ✅ Create, edit, and delete repositories
- ✅ Public/Private repository support
- ✅ Repository descriptions and metadata
- ✅ Access control for private repositories

### 📁 File Operations
- ✅ Create, edit, and delete files
- ✅ File content viewer with syntax highlighting
- ✅ Upload files from local system
- ✅ File search functionality

### 🌿 Branch Management
- ✅ Create branches from any base branch
- ✅ Switch between branches
- ✅ Merge branches with conflict detection
- ✅ Branch isolation (changes in one branch don't affect others)
- ✅ Visual branch indicators

### 📊 Commit System
- ✅ Automatic commit creation for all file operations
- ✅ Commit history with timestamps
- ✅ Commits grouped by branch
- ✅ File tracking in commits (shows which files changed)
- ✅ Commit messages with author information

### 📈 Commit Graph Visualization
- ✅ Interactive visual commit graph
- ✅ Different colors for different branches
- ✅ Branch lanes and connections
- ✅ Filenames displayed below commits
- ✅ Hover tooltips with full commit details
- ✅ Non-overlapping branch labels

### 🔄 Undo/Redo System
- ✅ Undo recent actions
- ✅ Redo undone actions
- ✅ Action history viewer

### 🔍 Search & Filter
- ✅ Search repositories by name
- ✅ Search files by name and content
- ✅ Filter commits by branch

### 💾 Data Persistence
- ✅ All data stored in browser's localStorage
- ✅ Data persists across sessions
- ✅ No backend required

---

## 🚀 Quick Start

### Prerequisites
- Any modern web browser (Chrome, Firefox, Safari, Edge)
- No installation required!

### Running the Application

**Option 1: Double-click (Easiest)**
```
Simply double-click on index.html
```

**Option 2: Using PowerShell**
```powershell
# Navigate to the project folder
cd path\to\GIthubVCS

# Open the application
Start-Process index.html
```

**Option 3: Using Command Prompt**
```cmd
# Navigate to the project folder
cd path\to\GIthubVCS

# Open the application
start index.html
```

That's it! The application will open in your default browser.

---

## 📂 Project Structure

```
GIthubVCS/
├── index.html              # Main dashboard page
├── repo.html               # Repository detail page
├── script.js               # Main JavaScript logic (3000+ lines)
├── style.css               # Styling (2000+ lines)
├── README.md               # This documentation
├── data.json               # Sample data (optional)
├── main.cpp                # C++ backend (optional)
└── run.bat                 # Batch file to compile C++ (optional)
```

---

## 📖 Usage Guide

### 1️⃣ Creating a Repository

1. Open `index.html` in your browser
2. Click the **"+ New Repository"** button
3. Enter repository name and description
4. Toggle **Private/Public** as needed
5. Click **"Create Repository"**

### 2️⃣ Managing Files

**Create a File:**
1. Open any repository
2. Go to **"Files"** tab
3. Click **"Create File"**
4. Enter filename and content
5. Add commit message (optional)
6. Click **"Create File"**

**Edit a 
File:**
1. Click the **edit icon** (✏️) on any file
2. Modify the content
3. Click **"Save Changes"**

**Delete a File:**
1. Click the **delete icon** (🗑️) on any file
2. Confirm deletion

### 3️⃣ Working with Branches

**Create a Branch:**
1. Go to **"Branches"** tab
2. Click **"Create Branch"**
3. Select base branch
4. Enter new branch name
5. Click **"Create Branch"**

**Switch Branches:**
1. Go to **"Branches"** tab
2. Click **"Switch"** on desired branch
3. Files will update to show that branch's content

**Merge Branches:**
1. Go to **"Branches"** tab
2. Click **"Merge Branch"**
3. Select source and target branches
4. Click **"Merge Branches"**

### 4️⃣ Viewing Commits

**Commit List:**
1. Go to **"Commits"** tab
2. See commits grouped by branch
3. Each commit shows:
   - Commit message
   - Files changed (with 📄 badges)
   - Author and date
   - Branch tag

**Commit Graph:**
1. Go to **"Commits"** tab
2. Click **"Show Graph"** button
3. See visual representation with:
   - Different colors for each branch
   - Branch lanes and connections
   - Filenames below commits
   - Hover for full details

### 5️⃣ Editing Repository Settings

1. Click the **edit icon** (✏️) on repository card
2. Update name, description, or privacy
3. Toggle **Private/Public** switch
4. Click **"Save Changes"**

---

## 🔧 Technical Details

### Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Storage**: Browser localStorage API
- **Graphics**: SVG for commit graph visualization
- **Backend** (Optional): C++ with file I/O

### Key Components

#### 1. Data Structure
```javascript
Repository {
    name: string,
    description: string,
    isPrivate: boolean,
    currentBranch: string,
    branches: Branch[],
    files: File[],
    commits: Commit[]
}

Commit {
    message: string,
    author: string,
    date: string,
    branch: string,
    timestamp: number,
    files: string[]  // Array of affected filenames
}

Branch {
    name: string,
    parent: string,
    current: boolean,
    files: File[],
    commits: Commit[]
}
```

#### 2. Storage
- All data stored in `localStorage` under key `githubSimulatorData`
- Automatic save on every operation
- Data persists across browser sessions

#### 3. Commit Graph Algorithm
- **Vertical layout**: Commits flow downward
- **Branch positioning**: Main at x=80, features offset left
- **Color assignment**: Unique color per branch
- **Overlap detection**: Branch labels auto-adjust to prevent overlap

### Browser Compatibility

✅ Chrome/Edge (Chromium) - Recommended
✅ Firefox
✅ Safari
✅ Opera

---

## 🛠️ Troubleshooting

### Issue: Data lost or corrupted

**Solution:**
```javascript
// Open browser console (F12) and run:
localStorage.clear();
location.reload();
```

---

## 🎨 Features Showcase

### Commit List with Branch Grouping
```
🌿 main                    5 commits
  ├─ Created repository
  ├─ Added test.js (📄 test.js)
  └─ Updated README (📄 README.md)

🌿 feature/auth            2 commits
  ├─ Added authentication (📄 auth.js)
  └─ Fixed login bug (📄 auth.js)
```

### Commit Graph Visualization
```
        main (Blue)
         │
         ●  Initial commit
         │  📄 README.md
         │
    ┌────┘
    │ feature/auth (Green)
    ●  Added authentication
    │  📄 auth.js
    │
    └────┐
         │ main (Blue)
         ●  Merged auth feature
```

### Branch Colors
- 🔵 **main**: Blue (#1f6feb)
- 🟢 **feature branches**: Green, Red, Purple, Orange
- 🔴 **hotfix branches**: Red/Orange
- Each branch gets a unique color automatically

---

## 📝 Tips & Best Practices

### 1. Commit Messages
- Be descriptive: "Added user authentication" ✅
- Avoid vague: "Updated file" ❌

### 2. Branch Naming
- Use prefixes: `feature/`, `hotfix/`, `bugfix/`
- Be specific: `feature/user-auth` ✅
- Avoid generic: `new-branch` ❌

### 3. File Organization
- Use folders: `src/components/Button.js`
- Group related files
- Keep names descriptive

### 4. Branch Strategy
- Keep `main` stable
- Create feature branches for new work
- Merge back when complete
- Delete old branches

---

## 🚀 Advanced Features

### Undo/Redo System
- Press **Undo** button to revert last action
- Press **Redo** to restore undone action
- View history with **History** button

### Search Functionality
- **Repository search**: Type in search box on dashboard
- **File search**: Use search box in repository view
- **Content search**: Searches inside file content

### Access Control
- **Private repos**: Only owner can access
- **Public repos**: Everyone can view
- Toggle privacy in edit modal

---

## 🎯 Use Cases

### 1. Learning Git/GitHub
- Practice version control concepts
- Understand branching and merging
- Visualize commit history

### 2. Project Planning
- Plan repository structure
- Design branch strategy
- Visualize workflow

### 3. Teaching
- Demonstrate VCS concepts
- Show branching strategies
- Explain commit graphs

### 4. Prototyping
- Quick project setup
- Test file structures
- Experiment with branches

---

## 🔮 Future Enhancements (Potential)

- [ ] Pull requests
- [ ] Code review system
- [ ] Conflict resolution UI
- [ ] File diff viewer
- [ ] Blame view
- [ ] Tags and releases
- [ ] Collaborators
- [ ] Issues and projects
- [ ] GitHub Actions simulation
- [ ] Export to real Git

---

## 📄 License

MIT License - Feel free to use, modify, and distribute.

---

## 👨‍💻 Author

Created as a comprehensive GitHub VCS simulator for learning and demonstration purposes.

---

## 🙏 Acknowledgments

- Inspired by GitHub's interface and functionality
- Built with modern web technologies
- Designed for educational purposes

---

## 📞 Support

If you encounter any issues:

1. Check the **Troubleshooting** section above
2. Use the utility tools (`fix_*.html` files)
3. Clear localStorage and start fresh
4. Check browser console for errors (F12)

---

## 🎉 Getting Started Now!

Ready to start? Just open `index.html` and begin exploring!

```powershell
# Quick start command
Start-Process index.html
```

**Happy coding! 🚀**

---

*Last Updated: November 2025*
