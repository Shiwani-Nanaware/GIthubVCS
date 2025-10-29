#include <iostream>
#include <string>
#include <stack>
#include <queue>
#include <ctime>
#include <fstream>
#include <sstream>
#include <algorithm>  // For transform function
#include <map>
#include <vector>
using namespace std;

// -------------------- Commit History --------------------
struct Commit
{
    string action;
    string user;
    string date;
    Commit *prev, *next;
    Commit(string a, string u) : action(a), user(u), prev(NULL), next(NULL) 
{
        time_t now = time(0);
        date = ctime(&now);
        date.pop_back(); // remove newline
    }
};

struct CommitHistory 
{
    Commit* head = NULL;
    Commit* tail = NULL;

    void addCommit(string action, string user) 
{
        Commit* c = new Commit(action, user);
        if (!head) head = tail = c;
        else 
        {
            tail->next = c;
            c->prev = tail;
            tail = c;
        }
    }

    void showCommits()
{
        if (!head) { cout << "No commits yet.\n"; return; }
        cout << "\n=== Commit History ===\n";
        Commit* temp = head;
        while (temp) {
            cout << "[" << temp->date << "] " << temp->user << " - " << temp->action << endl;
            temp = temp->next;
        }
    }
};

// -------------------- BST for Repository & File Searching --------------------
struct BSTNode {
    string key;
    string content;  // For file content search
    BSTNode *left, *right;
    BSTNode(string k, string c = "") : key(k), content(c), left(NULL), right(NULL) {}
};

struct BST {
    BSTNode* root = NULL;
    
    // Convert string to lowercase for case-insensitive search
    string toLower(string s) {
        transform(s.begin(), s.end(), s.begin(), ::tolower);
        return s;
    }
    
    // Insert a new node with optional content
    BSTNode* insert(BSTNode* node, string key, string content = "") {
        if (!node) return new BSTNode(key, content);
        if (toLower(key) < toLower(node->key)) 
            node->left = insert(node->left, key, content);
        else if (toLower(key) > toLower(node->key))
            node->right = insert(node->right, key, content);
        return node;
    }
    
    // Exact search (case-insensitive)
    bool search(BSTNode* node, string key) {
        if (!node) return false;
        if (toLower(node->key) == toLower(key)) return true;
        if (toLower(key) < toLower(node->key)) 
            return search(node->left, key);
        return search(node->right, key);
    }
    
    // Search for nodes containing the given substring in key (case-insensitive)
    void searchContaining(BSTNode* node, const string& term, vector<string>& results) {
        if (!node) return;
        
        // Search in left subtree first
        searchContaining(node->left, term, results);
        
        // Check current node
        if (toLower(node->key).find(toLower(term)) != string::npos) {
            results.push_back(node->key);
        }
        
        // Search in right subtree
        searchContaining(node->right, term, results);
    }
    
    // Search for nodes containing the given substring in content (case-insensitive)
    void searchInContent(BSTNode* node, const string& term, vector<string>& results) {
        if (!node) return;
        
        // Search in left subtree first
        searchInContent(node->left, term, results);
        
        // Check current node content if it exists
        if (!node->content.empty() && 
            toLower(node->content).find(toLower(term)) != string::npos) {
            results.push_back(node->key);
        }
        
        // Search in right subtree
        searchInContent(node->right, term, results);
    }
    
    // Find minimum value node
    BSTNode* minValueNode(BSTNode* node) {
        BSTNode* current = node;
        while (current && current->left != NULL)
            current = current->left;
        return current;
    }
    
    // Delete a node
    BSTNode* deleteNode(BSTNode* node, string key) {
        if (!node) return node;
        
        if (toLower(key) < toLower(node->key))
            node->left = deleteNode(node->left, key);
        else if (toLower(key) > toLower(node->key))
            node->right = deleteNode(node->right, key);
        else {
            // Node with only one child or no child
            if (!node->left) {
                BSTNode* temp = node->right;
                delete node;
                return temp;
            }
            else if (!node->right) {
                BSTNode* temp = node->left;
                delete node;
                return temp;
            }
            
            // Node with two children: Get the inorder successor
            BSTNode* temp = minValueNode(node->right);
            node->key = temp->key;
            node->content = temp->content;
            node->right = deleteNode(node->right, temp->key);
        }
        return node;
    }
};

// -------------------- Linked List for Files & Repositories --------------------
struct File {
    string name, content;
    File* next;
    File(string n, string c) : name(n), content(c), next(NULL) {}
};

// -------------------- Branch Management System --------------------
struct Branch {
    string branchName;
    string parentBranch;
    File* fileHead;
    CommitHistory commits;
    Branch* left;
    Branch* right;
    Branch* parent;
    vector<Branch*> children;
    
    Branch(string name, string parent = "") : branchName(name), parentBranch(parent), 
           fileHead(NULL), left(NULL), right(NULL), parent(NULL) {}
    
    // Deep copy files from another branch
    void copyFilesFrom(Branch* source) {
        if (!source || !source->fileHead) return;
        
        File* sourceFile = source->fileHead;
        File* prevFile = NULL;
        
        while (sourceFile) {
            File* newFile = new File(sourceFile->name, sourceFile->content);
            if (!fileHead) {
                fileHead = newFile;
            } else {
                prevFile->next = newFile;
            }
            prevFile = newFile;
            sourceFile = sourceFile->next;
        }
    }
};

struct BranchManager {
    Branch* root;
    map<string, Branch*> branchMap;
    string currentBranch;
    
    BranchManager() : root(NULL), currentBranch("main") {
        // Create main branch
        root = new Branch("main");
        branchMap["main"] = root;
    }
    
    bool createBranch(string baseBranch, string newBranch) {
        if (branchMap.find(newBranch) != branchMap.end()) {
            return false; // Branch already exists
        }
        
        Branch* base = branchMap[baseBranch];
        if (!base) return false;
        
        Branch* newBr = new Branch(newBranch, baseBranch);
        newBr->copyFilesFrom(base);
        newBr->parent = base;
        base->children.push_back(newBr);
        branchMap[newBranch] = newBr;
        
        return true;
    }
    
    bool switchBranch(string branchName) {
        if (branchMap.find(branchName) == branchMap.end()) {
            return false;
        }
        currentBranch = branchName;
        return true;
    }
    
    Branch* getCurrentBranch() {
        return branchMap[currentBranch];
    }
    
    vector<string> listBranches() {
        vector<string> branches;
        for (auto& pair : branchMap) {
            branches.push_back(pair.first);
        }
        return branches;
    }
    
    bool mergeBranch(string sourceBranch, string targetBranch) {
        Branch* source = branchMap[sourceBranch];
        Branch* target = branchMap[targetBranch];
        
        if (!source || !target) return false;
        
        // Simple merge: copy files from source to target
        File* sourceFile = source->fileHead;
        while (sourceFile) {
            // Check if file exists in target
            File* targetFile = target->fileHead;
            bool found = false;
            while (targetFile) {
                if (targetFile->name == sourceFile->name) {
                    // File exists, update content
                    targetFile->content = sourceFile->content;
                    found = true;
                    break;
                }
                targetFile = targetFile->next;
            }
            
            if (!found) {
                // File doesn't exist, add it
                File* newFile = new File(sourceFile->name, sourceFile->content);
                newFile->next = target->fileHead;
                target->fileHead = newFile;
            }
            
            sourceFile = sourceFile->next;
        }
        
        target->commits.addCommit("Merged branch " + sourceBranch + " into " + targetBranch, "System");
        return true;
    }
    
    string getBranchesJSON() {
        stringstream json;
        json << "{\"branches\":[";
        bool first = true;
        for (auto& pair : branchMap) {
            if (!first) json << ",";
            json << "{\"name\":\"" << pair.first 
                 << "\",\"parent\":\"" << pair.second->parentBranch 
                 << "\",\"current\":" << (pair.first == currentBranch ? "true" : "false") << "}";
            first = false;
        }
        json << "],\"currentBranch\":\"" << currentBranch << "\"}";
        return json.str();
    }
};

struct Repository {
    string repoName;
    BranchManager branchManager;
    queue<string> tasks;
    Repository* next;
    Repository(string n) : repoName(n), next(NULL) {}
    
    File* getCurrentFiles() {
        Branch* current = branchManager.getCurrentBranch();
        return current ? current->fileHead : NULL;
    }
    
    void setCurrentFiles(File* files) {
        Branch* current = branchManager.getCurrentBranch();
        if (current) {
            current->fileHead = files;
        }
    }
};

// -------------------- Operation Struct for Undo/Redo --------------------
struct Operation {
    string type;       // createRepo, deleteRepo, createFile, editFile, deleteFile, addTask, removeTask
    string repoName;
    string fileName;
    string content;
};

// -------------------- GitHub Simulation --------------------
class GitHub {
private:
    Repository* head = NULL;
    BST repoBST;
    stack<Operation> undoStack, redoStack;
    CommitHistory commits;
    string currentUser = "Shiwani";

public:
    // -------------------- Helper Functions --------------------
    Repository* findRepo(string name) {
        Repository* temp = head;
        while (temp) {
            if (temp->repoName == name) return temp;
            temp = temp->next;
        }
        return NULL;
    }

    File* findFile(Repository* repo, string name) {
        File* temp = repo->getCurrentFiles();
        while (temp) {
            if (temp->name == name) return temp;
            temp = temp->next;
        }
        return NULL;
    }

    // -------------------- Repository Operations --------------------
    void createRepository(string name) {
        if (repoBST.search(repoBST.root, name)) { cout << "Repository already exists!\n"; return; }
        Repository* newRepo = new Repository(name);
        newRepo->next = head;
        head = newRepo;
        repoBST.root = repoBST.insert(repoBST.root, name);
        commits.addCommit("Created Repository: " + name, currentUser);
        undoStack.push({"deleteRepo", name, "", ""});
        cout << "Repository '" << name << "' created.\n";
    }

    void deleteRepository(string name) {
        Repository* temp = head, *prev = NULL;
        while (temp && temp->repoName != name) { prev = temp; temp = temp->next; }
        if (!temp) { cout << "Repository not found.\n"; return; }
        undoStack.push({"createRepo", temp->repoName, "", ""});
        if (prev) prev->next = temp->next; else head = temp->next;
        commits.addCommit("Deleted Repository: " + name, currentUser);
        delete temp;
        cout << "Repository deleted.\n";
    }

    void showRepositories() {
        if (!head) { cout << "No repositories.\n"; return; }
        Repository* temp = head;
        cout << "\nRepositories:\n";
        while (temp) { cout << "- " << temp->repoName << endl; temp = temp->next; }
    }

    // -------------------- File Operations --------------------
    void createFile(Repository* repo, string fileName, string content) {
        if (findFile(repo, fileName)) { 
            cout << "File already exists!\n"; 
            return; 
        }
        // Save the current state for undo
        undoStack.push({"createFile", repo->repoName, fileName, content});
        
        // Perform the operation
        File* newFile = new File(fileName, content);
        File* currentFiles = repo->getCurrentFiles();
        newFile->next = currentFiles;
        repo->setCurrentFiles(newFile);
        
        // Add to commit history for current branch
        Branch* currentBranch = repo->branchManager.getCurrentBranch();
        if (currentBranch) {
            currentBranch->commits.addCommit("Created File: " + fileName, currentUser);
        }
        commits.addCommit("Created File: " + fileName + " in branch " + repo->branchManager.currentBranch, currentUser);
        cout << "File created successfully in branch " << repo->branchManager.currentBranch << ".\n";
    }

    void deleteFile(Repository* repo, string fileName) {
        File* temp = repo->getCurrentFiles(), *prev = NULL;
        while (temp && temp->name != fileName) { prev = temp; temp = temp->next; }
        if (!temp) { 
            cout << "File not found.\n"; 
            return; 
        }
        
        // Save the current state for undo before deleting
        undoStack.push({"deleteFile", repo->repoName, temp->name, temp->content});
        
        // Perform the operation
        if (prev) 
            prev->next = temp->next; 
        else 
            repo->setCurrentFiles(temp->next);
            
        // Add to commit history for current branch
        Branch* currentBranch = repo->branchManager.getCurrentBranch();
        if (currentBranch) {
            currentBranch->commits.addCommit("Deleted File: " + fileName, currentUser);
        }
        commits.addCommit("Deleted File: " + fileName + " in branch " + repo->branchManager.currentBranch, currentUser);
        
        // Delete the file
        delete temp;
        cout << "File deleted successfully from branch " << repo->branchManager.currentBranch << ".\n";
    }

    void editFile(Repository* repo, string fileName, string newContent) {
        File* temp = findFile(repo, fileName);
        if (!temp) { 
            cout << "File not found.\n"; 
            return; 
        }
        
        // Save the current state for undo before editing
        string oldContent = temp->content;
        undoStack.push({"editFile", repo->repoName, fileName, oldContent});
        
        // Perform the operation
        temp->content = newContent;
        
        // Add to commit history for current branch
        Branch* currentBranch = repo->branchManager.getCurrentBranch();
        if (currentBranch) {
            currentBranch->commits.addCommit("Edited File: " + fileName, currentUser);
        }
        commits.addCommit("Edited File: " + fileName + " in branch " + repo->branchManager.currentBranch, currentUser);
        cout << "File edited successfully in branch " << repo->branchManager.currentBranch << ".\n";
    }

    void showFiles(Repository* repo) {
        File* files = repo->getCurrentFiles();
        if (!files) { 
            cout << "No files in branch " << repo->branchManager.currentBranch << ".\n"; 
            return; 
        }
        File* temp = files;
        cout << "\nFiles in " << repo->repoName << " (branch: " << repo->branchManager.currentBranch << "):\n";
        while (temp) { cout << "- " << temp->name << endl; temp = temp->next; }
    }

    // -------------------- Branch Operations --------------------
    void createBranch(Repository* repo, string baseBranch, string newBranch) {
        if (repo->branchManager.createBranch(baseBranch, newBranch)) {
            commits.addCommit("Created branch: " + newBranch + " from " + baseBranch, currentUser);
            cout << "Branch '" << newBranch << "' created from '" << baseBranch << "'.\n";
        } else {
            cout << "Failed to create branch. Branch may already exist or base branch not found.\n";
        }
    }
    
    void switchBranch(Repository* repo, string branchName) {
        if (repo->branchManager.switchBranch(branchName)) {
            commits.addCommit("Switched to branch: " + branchName, currentUser);
            cout << "Switched to branch '" << branchName << "'.\n";
        } else {
            cout << "Branch '" << branchName << "' not found.\n";
        }
    }
    
    void mergeBranch(Repository* repo, string sourceBranch, string targetBranch) {
        if (repo->branchManager.mergeBranch(sourceBranch, targetBranch)) {
            commits.addCommit("Merged branch " + sourceBranch + " into " + targetBranch, currentUser);
            cout << "Successfully merged '" << sourceBranch << "' into '" << targetBranch << "'.\n";
        } else {
            cout << "Failed to merge branches. One or both branches may not exist.\n";
        }
    }
    
    void listBranches(Repository* repo) {
        vector<string> branches = repo->branchManager.listBranches();
        cout << "\nBranches in " << repo->repoName << ":\n";
        for (const string& branch : branches) {
            if (branch == repo->branchManager.currentBranch) {
                cout << "* " << branch << " (current)\n";
            } else {
                cout << "  " << branch << "\n";
            }
        }
    }

    // -------------------- Task Operations --------------------
    void addTask(Repository* repo, string task) {
        repo->tasks.push(task);
        commits.addCommit("Added Task: " + task, currentUser);
        undoStack.push({"removeTask", repo->repoName, "", task});
        cout << "Task added.\n";
    }

    void removeTask(Repository* repo) {
        if (repo->tasks.empty()) { cout << "No tasks.\n"; return; }
        string t = repo->tasks.front();
        repo->tasks.pop();
        commits.addCommit("Removed Task: " + t, currentUser);
        undoStack.push({"addTask", repo->repoName, "", t});
        cout << "Task removed.\n";
    }

    void viewTasks(Repository* repo) {
        if (repo->tasks.empty()) { cout << "No tasks.\n"; return; }
        queue<string> q = repo->tasks;
        cout << "\nTasks in " << repo->repoName << ":\n";
        while (!q.empty()) { cout << "- " << q.front() << endl; q.pop(); }
    }

    // -------------------- Undo/Redo --------------------
    void undo() {
        if (undoStack.empty()) { 
            cout << "Nothing to undo.\n"; 
            return; 
        }
        
        // Get the operation to undo
        Operation op = undoStack.top(); 
        undoStack.pop();
        
        // Push to redo stack before performing the operation
        redoStack.push(op);
        
        // Find the repository if needed
        Repository* r = findRepo(op.repoName);
        
        // Perform the inverse operation without pushing to undo stack
        if (op.type == "createFile" && r) {
            // To undo create, we need to delete the file
            File* temp = r->getCurrentFiles(), *prev = NULL;
            while (temp && temp->name != op.fileName) { prev = temp; temp = temp->next; }
            if (temp) {
                if (prev) prev->next = temp->next; 
                else r->setCurrentFiles(temp->next);
                delete temp;
                commits.addCommit("Undo: Deleted file " + op.fileName, currentUser);
            }
        }
        else if (op.type == "deleteFile" && r) {
            // To undo delete, we need to create the file with its content
            File* newFile = new File(op.fileName, op.content);
            File* currentFiles = r->getCurrentFiles();
            newFile->next = currentFiles;
            r->setCurrentFiles(newFile);
            commits.addCommit("Undo: Restored file " + op.fileName, currentUser);
        }
        else if (op.type == "editFile" && r) {
            // To undo edit, we need to restore the old content
            File* temp = findFile(r, op.fileName);
            if (temp) {
                string currentContent = temp->content;
                temp->content = op.content;
                commits.addCommit("Undo: Reverted changes to " + op.fileName, currentUser);
                // Update the redo stack with the current content for redo
                redoStack.top().content = currentContent;
            }
        }
        else {
            // For other operation types, use the original logic
            if (op.type == "deleteRepo") deleteRepository(op.repoName);
            else if (op.type == "createRepo") createRepository(op.repoName);
            else if (op.type == "addTask" && r) addTask(r, op.content);
            else if (op.type == "removeTask" && r) removeTask(r);
        }
        
        cout << "Undo performed: " << op.type << " on " << op.fileName << "\n";
    }

    void redo() {
        if (redoStack.empty()) { 
            cout << "Nothing to redo.\n"; 
            return; 
        }
        
        // Get the operation to redo
        Operation op = redoStack.top();
        redoStack.pop();
        
        // Push to undo stack before performing the operation
        undoStack.push(op);
        
        // Find the repository if needed
        Repository* r = findRepo(op.repoName);
        
        // Perform the operation without pushing to redo stack
        if (op.type == "createFile" && r) {
            File* newFile = new File(op.fileName, op.content);
            File* currentFiles = r->getCurrentFiles();
            newFile->next = currentFiles;
            r->setCurrentFiles(newFile);
            commits.addCommit("Redo: Created file " + op.fileName, currentUser);
        }
        else if (op.type == "deleteFile" && r) {
            File* temp = r->getCurrentFiles(), *prev = NULL;
            while (temp && temp->name != op.fileName) { prev = temp; temp = temp->next; }
            if (temp) {
                if (prev) prev->next = temp->next; 
                else r->setCurrentFiles(temp->next);
                delete temp;
                commits.addCommit("Redo: Deleted file " + op.fileName, currentUser);
            }
        }
        else if (op.type == "editFile" && r) {
            File* temp = findFile(r, op.fileName);
            if (temp) {
                string oldContent = temp->content;
                temp->content = op.content;
                commits.addCommit("Redo: Edited file " + op.fileName, currentUser);
                // Update the undo stack with the old content for undo
                undoStack.top().content = oldContent;
            }
        }
        else {
            // For other operation types, use the original logic
            if (op.type == "deleteRepo") deleteRepository(op.repoName);
            else if (op.type == "createRepo") createRepository(op.repoName);
            else if (op.type == "addTask" && r) addTask(r, op.content);
            else if (op.type == "removeTask" && r) removeTask(r);
        }
        
        cout << "Redo performed: " << op.type << " on " << op.fileName << "\n";
    }

    void showHistory() { commits.showCommits(); }

    // -------------------- Search Methods --------------------
    vector<string> searchRepositories(const string& term) {
        vector<string> results;
        repoBST.searchContaining(repoBST.root, term, results);
        return results;
    }
    
    vector<string> searchInRepository(Repository* repo, const string& term, bool searchContent = false) {
        vector<string> results;
        if (!repo) return results;
        
        File* current = repo->getCurrentFiles();
        while (current) {
            if (searchContent) {
                // Search in file content
                string contentLower = current->content;
                transform(contentLower.begin(), contentLower.end(), contentLower.begin(), ::tolower);
                string termLower = term;
                transform(termLower.begin(), termLower.end(), termLower.begin(), ::tolower);
                
                if (contentLower.find(termLower) != string::npos) {
                    results.push_back(current->name);
                }
            } else {
                // Search in filename
                string nameLower = current->name;
                transform(nameLower.begin(), nameLower.end(), nameLower.begin(), ::tolower);
                string termLower = term;
                transform(termLower.begin(), termLower.end(), termLower.begin(), ::tolower);
                
                if (nameLower.find(termLower) != string::npos) {
                    results.push_back(current->name);
                }
            }
            current = current->next;
        }
        return results;
    }
    
    // -------------------- Web Interface Methods --------------------
    string toJSON() {
        stringstream json;
        json << "{\"repositories\":[";
        Repository* temp = head;
        bool first = true;
        while (temp) {
            if (!first) json << ",";
            json << "{\"name\":\"" << temp->repoName 
                 << "\",\"description\":\"Repository\",\"createdDate\":\"" << getCurrentDate() 
                 << "\",\"isPrivate\":false,\"currentBranch\":\"" << temp->branchManager.currentBranch 
                 << "\",\"branches\":" << temp->branchManager.getBranchesJSON().substr(1, temp->branchManager.getBranchesJSON().length()-2) // Remove outer braces
                 << ",\"files\":[";
            
            File* fileTemp = temp->getCurrentFiles();
            bool firstFile = true;
            while (fileTemp) {
                if (!firstFile) json << ",";
                json << "{\"name\":\"" << fileTemp->name 
                     << "\",\"info\":\"" << (fileTemp->content.length() > 50 ? fileTemp->content.substr(0, 50) + "..." : fileTemp->content)
                     << "\",\"date\":\"a few seconds ago\",\"content\":\"";
                
                // Escape quotes and newlines in content
                string escapedContent = fileTemp->content;
                size_t pos = 0;
                while ((pos = escapedContent.find("\"", pos)) != string::npos) {
                    escapedContent.replace(pos, 1, "\\\"");
                    pos += 2;
                }
                pos = 0;
                while ((pos = escapedContent.find("\n", pos)) != string::npos) {
                    escapedContent.replace(pos, 1, "\\n");
                    pos += 2;
                }
                
                json << escapedContent << "\"}";
                fileTemp = fileTemp->next;
                firstFile = false;
            }
            json << "],\"commits\":[{\"message\":\"Repository created\",\"author\":\"" << currentUser << "\",\"date\":\"" << getCurrentDate() << "\"}]}";
            temp = temp->next;
            first = false;
        }
        json << "]}";
        return json.str();
    }

    string getCurrentDate() {
        time_t now = time(0);
        string date = ctime(&now);
        date.pop_back(); // remove newline
        return date;
    }

    void saveToFile() {
        ofstream file("data.json");
        file << toJSON();
        file.close();
    }

    void loadFromFile() {
        // Simple initialization with sample data if file doesn't exist
        ifstream file("data.json");
        if (!file.good()) {
            // Create sample repository with files
            createRepository("LeetCode");
            Repository* repo = findRepo("LeetCode");
            if (repo) {
                createFile(repo, "LeetCodeSolutions.js", "// JavaScript solutions for LeetCode problems\n\n// Two Sum Problem\nfunction twoSum(nums, target) {\n    const map = new Map();\n    for (let i = 0; i < nums.length; i++) {\n        const complement = target - nums[i];\n        if (map.has(complement)) {\n            return [map.get(complement), i];\n        }\n        map.set(nums[i], i);\n    }\n    return [];\n}");
                createFile(repo, "README.md", "# LeetCode Solutions\n\nThis repository contains my solutions to various LeetCode problems.\n\n## Structure\n- Each solution includes time and space complexity analysis\n- Solutions are organized by difficulty level\n- Test cases are provided for each problem");
            }
            saveToFile();
        }
        file.close();
    }

    // Web API Methods
    // Get undo and redo stacks as JSON
    string getStacksJSON() {
        stringstream json;
        json << "{\"undoStack\":[";
        
        // Create a temporary stack to reverse the order (since stack is LIFO)
        stack<Operation> tempStack = undoStack;
        vector<Operation> reversedUndo;
        while (!tempStack.empty()) {
            reversedUndo.push_back(tempStack.top());
            tempStack.pop();
        }
        
        // Add undo stack items in chronological order (oldest first)
        for (size_t i = reversedUndo.size(); i > 0; i--) {
            const Operation& op = reversedUndo[i-1];
            if (i < reversedUndo.size()) json << ",";
            json << "{\"type\":\"" << op.type 
                 << "\",\"repoName\":\"" << op.repoName 
                 << "\",\"fileName\":\"" << op.fileName 
                 << "\",\"content\":\"" << op.content << "\"}";
        }
        
        json << "],\"redoStack\":[";
        
        // Add redo stack items
        tempStack = redoStack;
        int count = 0;
        while (!tempStack.empty()) {
            Operation op = tempStack.top();
            tempStack.pop();
            if (count++ > 0) json << ",";
            json << "{\"type\":\"" << op.type 
                 << "\",\"repoName\":\"" << op.repoName 
                 << "\",\"fileName\":\"" << op.fileName 
                 << "\",\"content\":\"" << op.content << "\"}";
        }
        
        json << "]}";
        return json.str();
    }

    string handleRequest(string method, string endpoint, string data = "") {
        if (method == "GET" && endpoint == "/api/repositories") {
            return toJSON();
        }
        else if (method == "GET" && endpoint == "/api/undo-redo-stacks") {
            return getStacksJSON();
        }
        else if (method == "POST" && endpoint == "/api/repositories") {
            // Parse repository name from data (simplified)
            size_t pos = data.find("name=");
            if (pos != string::npos) {
                string name = data.substr(pos + 5);
                size_t endPos = name.find("&");
                if (endPos != string::npos) name = name.substr(0, endPos);
                createRepository(name);
                saveToFile();
                return "{\"success\":true,\"message\":\"Repository created\"}";
            }
        }
        else if (method == "DELETE" && endpoint.find("/api/repositories/") == 0) {
            string repoName = endpoint.substr(17); // Remove "/api/repositories/"
            deleteRepository(repoName);
            saveToFile();
            return "{\"success\":true,\"message\":\"Repository deleted\"}";
        }
        else if (method == "POST" && endpoint.find("/api/repositories/") == 0 && endpoint.find("/files") != string::npos) {
            // Extract repo name
            size_t start = 17; // "/api/repositories/"
            size_t end = endpoint.find("/files");
            string repoName = endpoint.substr(start, end - start);
            Repository* repo = findRepo(repoName);
            
            if (repo) {
                // Parse file data (simplified)
                size_t namePos = data.find("name=");
                size_t contentPos = data.find("content=");
                if (namePos != string::npos && contentPos != string::npos) {
                    string fileName = data.substr(namePos + 5, data.find("&", namePos) - namePos - 5);
                    string content = data.substr(contentPos + 8);
                    createFile(repo, fileName, content);
                    saveToFile();
                    return "{\"success\":true,\"message\":\"File created\"}";
                }
            }
        }
        else if (method == "POST" && endpoint == "/api/undo") {
            undo();
            saveToFile();
            return "{\"success\":true,\"message\":\"Undo performed\"}";
        }
        else if (method == "POST" && endpoint == "/api/redo") {
            redo();
            saveToFile();
            return "{\"success\":true,\"message\":\"Redo performed\"}";
        }
        // Branch management endpoints
        else if (method == "POST" && endpoint.find("/api/repositories/") == 0 && endpoint.find("/branches") != string::npos) {
            // Extract repo name
            size_t start = 17; // "/api/repositories/"
            size_t end = endpoint.find("/branches");
            string repoName = endpoint.substr(start, end - start);
            Repository* repo = findRepo(repoName);
            
            if (repo) {
                // Parse branch data (format: baseBranch=main&newBranch=feature)
                size_t basePos = data.find("baseBranch=");
                size_t newPos = data.find("newBranch=");
                if (basePos != string::npos && newPos != string::npos) {
                    string baseBranch = data.substr(basePos + 11, data.find("&", basePos) - basePos - 11);
                    string newBranch = data.substr(newPos + 10);
                    createBranch(repo, baseBranch, newBranch);
                    saveToFile();
                    return "{\"success\":true,\"message\":\"Branch created\"}";
                }
            }
        }
        else if (method == "PUT" && endpoint.find("/api/repositories/") == 0 && endpoint.find("/branches/switch") != string::npos) {
            // Extract repo name
            size_t start = 17; // "/api/repositories/"
            size_t end = endpoint.find("/branches");
            string repoName = endpoint.substr(start, end - start);
            Repository* repo = findRepo(repoName);
            
            if (repo) {
                // Parse branch name (format: branchName=main)
                size_t pos = data.find("branchName=");
                if (pos != string::npos) {
                    string branchName = data.substr(pos + 11);
                    switchBranch(repo, branchName);
                    saveToFile();
                    return "{\"success\":true,\"message\":\"Branch switched\"}";
                }
            }
        }
        else if (method == "POST" && endpoint.find("/api/repositories/") == 0 && endpoint.find("/branches/merge") != string::npos) {
            // Extract repo name
            size_t start = 17; // "/api/repositories/"
            size_t end = endpoint.find("/branches");
            string repoName = endpoint.substr(start, end - start);
            Repository* repo = findRepo(repoName);
            
            if (repo) {
                // Parse merge data (format: sourceBranch=feature&targetBranch=main)
                size_t sourcePos = data.find("sourceBranch=");
                size_t targetPos = data.find("targetBranch=");
                if (sourcePos != string::npos && targetPos != string::npos) {
                    string sourceBranch = data.substr(sourcePos + 13, data.find("&", sourcePos) - sourcePos - 13);
                    string targetBranch = data.substr(targetPos + 13);
                    mergeBranch(repo, sourceBranch, targetBranch);
                    saveToFile();
                    return "{\"success\":true,\"message\":\"Branch merged\"}";
                }
            }
        }
        else if (method == "GET" && endpoint.find("/api/repositories/") == 0 && endpoint.find("/branches") != string::npos) {
            // Extract repo name
            size_t start = 17; // "/api/repositories/"
            size_t end = endpoint.find("/branches");
            string repoName = endpoint.substr(start, end - start);
            Repository* repo = findRepo(repoName);
            
            if (repo) {
                return repo->branchManager.getBranchesJSON();
            }
        }
        // Search endpoints
        else if (method == "GET" && endpoint.find("/api/search/repos/") == 0) {
            string term = endpoint.substr(18); // Remove "/api/search/repos/"
            vector<string> results = searchRepositories(term);
            
            stringstream json;
            json << "{\"results\":[";
            for (size_t i = 0; i < results.size(); i++) {
                if (i > 0) json << ",";
                json << "\"" << results[i] << "\"";
            }
            json << "]}";
            return json.str();
        }
        else if (method == "GET" && endpoint.find("/api/search/files/") == 0) {
            // Format: /api/search/files/REPO_NAME/SEARCH_TERM?content=true
            size_t repoEnd = endpoint.find("/", 17); // After "/api/search/files/"
            if (repoEnd == string::npos) return "{\"error\":\"Invalid endpoint\"}";
            
            string repoName = endpoint.substr(17, repoEnd - 17);
            string term = endpoint.substr(repoEnd + 1);
            bool searchContent = (term.find("?content=true") != string::npos);
            if (searchContent) {
                term = term.substr(0, term.find("?"));
            }
            
            Repository* repo = findRepo(repoName);
            if (!repo) return "{\"error\":\"Repository not found\"}";
            
            vector<string> results = searchInRepository(repo, term, searchContent);
            
            stringstream json;
            json << "{\"repository\":\"" << repoName << "\",\"results\":[";
            for (size_t i = 0; i < results.size(); i++) {
                if (i > 0) json << ",";
                json << "\"" << results[i] << "\"";
            }
            json << "]}";
            return json.str();
        }
        
        return "{\"error\":\"Endpoint not found\"}";
    }
};

// -------------------- Web Server Simulation --------------------
void runWebServer(GitHub& git) {
    cout << "Web server mode started. Data will be saved to data.json\n";
    cout << "Open index.html in your browser to use the web interface.\n";
    cout << "The data.json file will be created for the web interface.\n";
    cout << "Press any key to exit...\n\n";
    
    git.loadFromFile();
    git.saveToFile();
    
    cout << "Data saved to data.json. You can now use the web interface.\n";
    cout << "To update data, restart this program and choose web mode again.\n";
    
    // Wait for user input to exit
    cin.get();
}

// -------------------- MAIN --------------------
int main() {
    GitHub git;
    int mode;
    
    cout << "=== Mini GitHub ===\n";
    cout << "Choose mode:\n";
    cout << "1. Console Mode (Interactive CLI)\n";
    cout << "2. Web Mode (Browser Interface)\n";
    cout << "Enter choice: ";
    cin >> mode;
    cin.ignore();
    
    if (mode == 2) {
        runWebServer(git);
        return 0;
    }
    
    // Console mode (original functionality)
    int choice;
    string repoName, fileName, content, task;

    do {
        cout << "\n=== Mini GitHub Console ===\n";
        cout << "1. Create Repository\n2. Delete Repository\n3. Show Repositories\n4. Manage Repository\n5. Undo\n6. Redo\n7. Show History\n8. Exit\nEnter choice: ";
        cin >> choice; cin.ignore();

        switch(choice) {
        case 1:
            cout << "Repository name: "; getline(cin, repoName);
            git.createRepository(repoName); break;
        case 2:
            cout << "Repository name: "; getline(cin, repoName);
            git.deleteRepository(repoName); break;
        case 3:
            git.showRepositories(); break;
        case 4: {
            cout << "Repository to manage: "; getline(cin, repoName);
            Repository* repo = git.findRepo(repoName);
            if (!repo) { cout << "Repository not found.\n"; break; }

            int sub;
            do {
                cout << "\n--- Manage " << repoName << " (Current Branch: " << repo->branchManager.currentBranch << ") ---\n";
                cout << "1. Create File\n2. Edit File\n3. Delete File\n4. Show Files\n";
                cout << "5. Add Task\n6. Remove Task\n7. View Tasks\n8. Undo\n9. Redo\n";
                cout << "10. Create Branch\n11. Switch Branch\n12. Merge Branch\n13. List Branches\n14. Back\nEnter: ";
                cin >> sub; cin.ignore();
                switch(sub) {
                    case 1: cout << "File name: "; getline(cin, fileName);
                            cout << "Content: "; getline(cin, content);
                            git.createFile(repo, fileName, content); break;
                    case 2: cout << "File name: "; getline(cin, fileName);
                            cout << "New content: "; getline(cin, content);
                            git.editFile(repo, fileName, content); break;
                    case 3: cout << "File name: "; getline(cin, fileName);
                            git.deleteFile(repo, fileName); break;
                    case 4: git.showFiles(repo); break;
                    case 5: cout << "Task: "; getline(cin, task);
                            git.addTask(repo, task); break;
                    case 6: git.removeTask(repo); break;
                    case 7: git.viewTasks(repo); break;
                    case 8: git.undo(); break;
                    case 9: git.redo(); break;
                    case 10: {
                        string baseBranch, newBranch;
                        cout << "Base branch: "; getline(cin, baseBranch);
                        cout << "New branch name: "; getline(cin, newBranch);
                        git.createBranch(repo, baseBranch, newBranch);
                        break;
                    }
                    case 11: {
                        string branchName;
                        cout << "Branch to switch to: "; getline(cin, branchName);
                        git.switchBranch(repo, branchName);
                        break;
                    }
                    case 12: {
                        string sourceBranch, targetBranch;
                        cout << "Source branch: "; getline(cin, sourceBranch);
                        cout << "Target branch: "; getline(cin, targetBranch);
                        git.mergeBranch(repo, sourceBranch, targetBranch);
                        break;
                    }
                    case 13: git.listBranches(repo); break;
                }
            } while(sub != 14);
            break;
        }
        case 5: git.undo(); break;
        case 6: git.redo(); break;
        case 7: git.showHistory(); break;
        case 8: cout << "Exiting...\n"; break;
        }
    } while(choice != 8);
}
