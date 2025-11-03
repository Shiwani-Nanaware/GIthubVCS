# 🚀 Quick Start: Testing File Display in Commits

## Option 1: Use Test Page (Fastest)

1. Open `test_commits.html` in your browser
2. Click "Create Test Repo"
3. Click "Open TestRepo"
4. Go to "Commits" tab
5. ✅ You should see commits with file badges!

## Option 2: Manual Test

1. Open `index.html`
2. Click "New Repository"
3. Name it "TestRepo", click "Create Repository"
4. Click on "TestRepo" to open it
5. Click "Create File"
6. Enter filename: `test.js`
7. Enter content: `console.log('test');`
8. Click "Create File"
9. Go to "Commits" tab
10. ✅ You should see 2 commits:
    - "Created repository: TestRepo"
    - "Added test.js" with file badge 📄 test.js

## Option 3: Check Existing Data

1. Open `index.html`
2. Click on "LeetCode" repository
3. Go to "Commits" tab
4. ✅ You should see existing commits with file badges

## 🐛 If It Doesn't Work

1. Open browser console (F12)
2. Run: `localStorage.clear()`
3. Refresh the page
4. Try again

## ✅ What You Should See

### In Commit List:
```
┌────────────────────────────────┐
│ Added test.js            main  │
│ ┌──────────────┐               │
│ │ 📄 test.js   │  ← File badge │
│ └──────────────┘               │
│ by Shiwani on Nov 3, 2025     │
└────────────────────────────────┘
```

### In Commit Graph:
- Click "Show Graph" button
- See commits with filenames below messages
- Vertical network layout with branches

## 📞 Still Having Issues?

Check browser console (F12) for:
- Red error messages
- Debug logs: "File created", "Commit created"
- Data structure: Run `JSON.parse(localStorage.getItem('githubSimulatorData'))`

## 🎯 Key Features Working

✅ Repository creation commits
✅ File creation commits with badges
✅ File edit commits with badges
✅ File deletion commits with badges
✅ Commit graph with filenames
✅ Multiple files show multiple badges
✅ Data persists after reload
