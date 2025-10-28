#include <iostream>
#include <string>
#include <stack>
#include <queue>
#include <ctime>
#include <fstream>
#include <sstream>
#include <algorithm>  // For transform function
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

struct Repository {
    string repoName;
    File* fileHead;
    queue<string> tasks;
    Repository* next;
    Repository(string n) : repoName(n), fileHead(NULL), next(NULL) {}
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
        File* temp = repo->fileHead;
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
        if (findFile(repo, fileName)) { cout << "File already exists!\n"; return; }
        File* newFile = new File(fileName, content);
        newFile->next = repo->fileHead;
        repo->fileHead = newFile;
        commits.addCommit("Created File: " + fileName, currentUser);
        undoStack.push({"deleteFile", repo->repoName, fileName, ""});
        cout << "File created successfully.\n";
    }

    void deleteFile(Repository* repo, string fileName) {
        File* temp = repo->fileHead, *prev = NULL;
        while (temp && temp->name != fileName) { prev = temp; temp = temp->next; }
        if (!temp) { cout << "File not found.\n"; return; }
        undoStack.push({"createFile", repo->repoName, temp->name, temp->content});
        if (prev) prev->next = temp->next; else repo->fileHead = temp->next;
        commits.addCommit("Deleted File: " + fileName, currentUser);
        delete temp;
        cout << "File deleted successfully.\n";
    }

    void editFile(Repository* repo, string fileName, string newContent) {
        File* temp = findFile(repo, fileName);
        if (!temp) { cout << "File not found.\n"; return; }
        undoStack.push({"editFile", repo->repoName, fileName, temp->content});
        temp->content = newContent;
        commits.addCommit("Edited File: " + fileName, currentUser);
        cout << "File edited successfully.\n";
    }

    void showFiles(Repository* repo) {
        if (!repo->fileHead) { cout << "No files.\n"; return; }
        File* temp = repo->fileHead;
        cout << "\nFiles in " << repo->repoName << ":\n";
        while (temp) { cout << "- " << temp->name << endl; temp = temp->next; }
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
        if (undoStack.empty()) { cout << "Nothing to undo.\n"; return; }
        Operation op = undoStack.top(); undoStack.pop();
        redoStack.push(op);

        Repository* r = findRepo(op.repoName);
        if (op.type == "deleteRepo") deleteRepository(op.repoName);
        else if (op.type == "createRepo") createRepository(op.repoName);
        else if (op.type == "deleteFile" && r) deleteFile(r, op.fileName);
        else if (op.type == "createFile" && r) createFile(r, op.fileName, op.content);
        else if (op.type == "editFile" && r) editFile(r, op.fileName, op.content);
        else if (op.type == "addTask" && r) addTask(r, op.content);
        else if (op.type == "removeTask" && r) removeTask(r);
        cout << "Undo performed.\n";
    }

    void redo() {
        if (redoStack.empty()) { cout << "Nothing to redo.\n"; return; }
        Operation op = redoStack.top(); redoStack.pop();
        undoStack.push(op);
        cout << "Redo performed. Reapply action: " << op.type << endl;
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
        
        File* current = repo->fileHead;
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
            json << "{\"name\":\"" << temp->repoName << "\",\"description\":\"Repository\",\"createdDate\":\"" << getCurrentDate() << "\",\"isPrivate\":false,\"files\":[";
            
            File* fileTemp = temp->fileHead;
            bool firstFile = true;
            while (fileTemp) {
                if (!firstFile) json << ",";
                json << "{\"name\":\"" << fileTemp->name << "\",\"info\":\"" << fileTemp->content.substr(0, 50) << "\",\"date\":\"a few seconds ago\"}";
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
    string handleRequest(string method, string endpoint, string data = "") {
        if (method == "GET" && endpoint == "/api/repositories") {
            return toJSON();
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
                cout << "\n--- Manage " << repoName << " ---\n";
                cout << "1. Create File\n2. Edit File\n3. Delete File\n4. Show Files\n";
                cout << "5. Add Task\n6. Remove Task\n7. View Tasks\n8. Undo\n9. Redo\n10. Back\nEnter: ";
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
                }
            } while(sub != 10);
            break;
        }
        case 5: git.undo(); break;
        case 6: git.redo(); break;
        case 7: git.showHistory(); break;
        case 8: cout << "Exiting...\n"; break;
        }
    } while(choice != 8);
}
