# 🚀 GitHub VCS Simulator

A Version Control System simulator built with HTML, CSS, JavaScript, and C++ that mimics GitHub's core features.


---

## ✨ Features

- 🗂️ **Repository Management**: Create, edit, delete repositories (public/private)
- 📁 **File Operations**: Create, edit, delete, and search files
- 🌿 **Branch Management**: Create, switch, merge branches with isolation
- 📊 **Commit System**: Automatic commits with history and graph visualization
- 🔄 **Undo/Redo**: Full action history with undo/redo support
- 💾 **Data Persistence**: localStorage-based (no backend required)

---

## 🚀 Quick Start

**Just double-click `index.html`** - That's it!

Or use command line:
```powershell
Start-Process index.html
```

---

## 📂 Project Structure

```
GIthubVCS/
├── index.html      # Main dashboard
├── repo.html       # Repository detail page
├── script.js       # JavaScript logic
├── style.css       # Styling
├── main.cpp        # C++ backend (optional)
└── README.md       # Documentation
```

---

## 💻 C++ Data Structures Used

### 1. **Doubly Linked List** (Commit History)
- Bidirectional traversal of commits
- O(1) insertion, O(n) traversal

### 2. **Binary Search Tree** (Repository Search)
- Case-insensitive search
- O(log n) insert/search, supports substring matching
- Three-case deletion (leaf, one child, two children)

### 3. **Singly Linked List** (File Management)
- Dynamic file storage per branch
- O(1) insertion at head, O(n) search/delete
- Deep copy for branch isolation

### 4. **Tree Structure** (Branch Management)
- Parent-child branch relationships
- Deep copy mechanism ensures branch isolation
- Map-based O(log n) branch lookup

### 5. **Stack** (Undo/Redo)
- Two stacks: `undoStack` and `redoStack`
- O(1) push/pop operations
- Stores operation metadata for reversal

### 6. **Queue** (Task Management)
- FIFO task processing
- O(1) enqueue/dequeue

### 7. **Hash Map** (Branch Lookup)
- `map<string, Branch*>` for fast branch access
- O(log n) lookup (Red-Black Tree implementation)

### 8. **Vector** (Dynamic Arrays)
- Search results and child branch storage
- O(1) random access, O(1) amortized append

---

## 🔧 Key Algorithms

**BST Deletion**: Handles three cases (leaf, one child, two children with inorder successor)

**Deep Copy**: Prevents shared references between branches for true isolation

**Branch Merge**: Iterates source files, updates/adds to target, copies unique commits

**Case-Insensitive Search**: Transforms strings to lowercase for comparison

---

## ⏱️ Time Complexity Summary

| Operation | Data Structure | Complexity |
|-----------|---------------|------------|
| Add Commit | Doubly Linked List | O(1) |
| Search Repository | BST | O(log n) |
| Create File | Singly Linked List | O(1) |
| Find File | Singly Linked List | O(n) |
| Undo/Redo | Stack | O(1) |
| Task Operations | Queue | O(1) |
| Branch Lookup | Map | O(log n) |

---

## 📖 Usage

### Create Repository
1. Click **"+ New Repository"**
2. Enter name and description
3. Toggle Public/Private

### Manage Files
- **Create**: Files tab → Create File
- **Edit**: Click edit icon (✏️)
- **Delete**: Click delete icon (🗑️)

### Work with Branches
- **Create**: Branches tab → Create Branch
- **Switch**: Click Switch on desired branch
- **Merge**: Select source and target branches

### View Commits
- **List**: Commits tab shows grouped commits
- **Graph**: Click "Show Graph" for visualization

---

## 🛠️ Troubleshooting

**Data corrupted?**
```javascript
// Open browser console (F12):
localStorage.clear();
location.reload();
```

---

## 🎯 Technologies

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Storage**: Browser localStorage
- **Graphics**: SVG for commit graphs
- **Backend**: C++ with STL data structures

---

## 📄 License

MIT License

---

*Last Updated: November 2025*
