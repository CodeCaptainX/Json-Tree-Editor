"use client";

import React, { useState, useEffect, useRef } from "react";
import JsonTreeNode from "../components/HomePages/JsonTreeNode";
import SelectionsPanel from "../components/HomePages/bottom-panel/SelectionsPanel";
import { Icon } from "@iconify/react";
import RemovedKeysHistoryPanel from "../components/HomePages/bottom-panel/HistoryAction";
import KeyRenameDialog from "../components/HomePages/KeyRenameDialog";

import Ads from "../components/HomePages/Ads";
import Header from "../components/HomePages/Header";

// Type definitions
interface ParentChildPair {
  parentPath: string;
  childPath: string;
}

interface KeyOccurrences {
  [key: string]: string[];
}

interface RemovedKeyHistory {
  keyName: string;
  paths: string[];
  timestamp: number;
}

const JsonTreeEditor: React.FC = () => {
  const [jsonInput, setJsonInput] = useState<string>(
    '{\n  "person": {\n    "name": "John",\n    "age": 30,\n    "address": {\n      "street": "123 Main St",\n      "city": "Anytown",\n      "name": "Home"\n    },\n    "contact": {\n      "email": "john@example.com",\n      "name": "John Doe"\n    },\n    "hobbies": ["reading", "gaming", "hiking"]\n  },\n  "settings": {\n    "theme": "dark",\n    "notifications": true,\n    "name": "UserSettings"\n  }\n}'
  );
  const [jsonData, setJsonData] = useState<any>(null);
  const [error, setError] = useState<string>("");
  const [height, setHeight] = useState(500);
  const resizerRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [keyOccurrences, setKeyOccurrences] = useState<KeyOccurrences>({});
  const [parentsToRemove, setParentsToRemove] = useState<ParentChildPair[]>([]);
  const [removedKeysHistory, setRemovedKeysHistory] = useState<
    RemovedKeyHistory[]
  >([]);
  const [renameDialogOpen, setRenameDialogOpen] = useState<boolean>(false);
  const [keyToRename, setKeyToRename] = useState<string>("");
  const [currentKeyName, setCurrentKeyName] = useState<string>("");
  const [showUndoPanel, setShowUndoPanel] = useState<boolean>(false);
  const [excludedPaths, setExcludedPaths] = useState<string[]>([]);
  const [isAdsExist,_] = useState<boolean>(false)

  const closeRenameDialog = (): void => {
    setRenameDialogOpen(false);
    setKeyToRename("");
    setCurrentKeyName("");
  };

  const onMouseDown = () => {
    isResizing.current = true;
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!isResizing.current || !resizerRef.current) return;
    const top = resizerRef.current.getBoundingClientRect().top;
    const newHeight = e.clientY - top;
    setHeight(newHeight);
  };

  const onMouseUp = () => {
    isResizing.current = false;
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  };

  const handleRenameKey = (
    keyPath: string,
    newKeyName: string,
    renameAllMatching: boolean
  ): void => {
    if (!keyPath || newKeyName === currentKeyName) return;

    // Create a deep copy of the current JSON
    const newData = JSON.parse(JSON.stringify(jsonData));

    if (renameAllMatching) {
      // If renaming all matching keys, we need to traverse the entire JSON
      const currentKeyName = keyPath.split(".").pop() as string;

      // Recursive function to rename all keys with the same name while preserving order
      const renameAllMatchingKeys = (
        obj: any,
        keyToRename: string,
        newName: string
      ): void => {
        if (!obj || typeof obj !== "object") return;

        if (Array.isArray(obj)) {
          // If it's an array, process each element
          obj.forEach((item) => {
            if (item && typeof item === "object") {
              renameAllMatchingKeys(item, keyToRename, newName);
            }
          });
        } else {
          // Process object properties
          const keys = Object.keys(obj);

          // Check if this object has the key we want to rename
          if (keys.includes(keyToRename)) {
            // Create new object with same key order but renamed key
            const newObj: Record<string, any> = {};

            keys.forEach((k) => {
              if (k === keyToRename) {
                newObj[newName] = obj[k];
              } else {
                newObj[k] = obj[k];
              }
            });

            // Replace all properties in the original object
            // First clear all existing properties
            keys.forEach((k) => delete obj[k]);

            // Then add back all properties in the correct order
            Object.keys(newObj).forEach((k) => {
              obj[k] = newObj[k];
            });
          }

          // Recursively process all values that are objects
          keys.forEach((k) => {
            if (obj[k] && typeof obj[k] === "object") {
              renameAllMatchingKeys(obj[k], keyToRename, newName);
            }
          });
        }
      };

      // Start the recursive renaming process
      renameAllMatchingKeys(newData, currentKeyName, newKeyName);
    } else {
      // Just rename the specific key at the given path
      const parts = keyPath.split(".");
      const keyName = parts.pop() as string;

      // Navigate to the parent object
      let parent = newData;
      for (let i = 0; i < parts.length; i++) {
        if (!parent[parts[i]]) {
          console.error("Path not found in JSON data");
          return;
        }
        parent = parent[parts[i]];
      }

      // Check if the new key already exists in the parent
      if (parent.hasOwnProperty(newKeyName)) {
        setError(`Key "${newKeyName}" already exists at this level`);
        return;
      }

      // Rename the key while preserving order
      const keys = Object.keys(parent);
      const newObj: Record<string, any> = {};

      // Create a new object with the same order but with the renamed key
      keys.forEach((k) => {
        if (k === keyName) {
          newObj[newKeyName] = parent[k];
        } else {
          newObj[k] = parent[k];
        }
      });

      // Clear the parent object
      keys.forEach((k) => delete parent[k]);

      // Restore all properties in the correct order
      Object.keys(newObj).forEach((k) => {
        parent[k] = newObj[k];
      });
    }

    // Update JSON data and input
    setJsonData(newData);
    setJsonInput(JSON.stringify(newData, null, 2));

    // Recalculate paths and key occurrences
    const keys = getAllPaths(newData);
    setExpandedKeys(keys);

    // Recalculate key occurrences
    const occurrences = calculateKeyOccurrences(newData);
    setKeyOccurrences(occurrences);

    // Clear error if there was one
    setError("");

    // Close the dialog
    closeRenameDialog();
  };

  // Parse JSON input
  const parseJson = (): void => {
    try {
      const parsed = JSON.parse(jsonInput);
      setJsonData(parsed);

      // Format the JSON input properly with indentation
      setJsonInput(JSON.stringify(parsed, null, 2));

      setError("");

      // Initially expand all nodes
      const keys = getAllPaths(parsed);
      setExpandedKeys(keys);

      // Calculate key occurrences
      const occurrences = calculateKeyOccurrences(parsed);
      setKeyOccurrences(occurrences);
    } catch (err) {
      if (err instanceof Error) {
        setError(`JSON Parse Error: ${err.message}`);
      } else {
        setError("JSON Parse Error: Unknown error");
      }
      setJsonData(null);
    }
  };

  const openRenameDialog = (path: string, currentName: string): void => {
    setKeyToRename(path);
    setCurrentKeyName(currentName);
    setRenameDialogOpen(true);
  };

  // Format input on change
  const handleInputChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ): void => {
    setJsonInput(e.target.value);
    try {
      // Try to parse and format the JSON as the user types
      const parsed = JSON.parse(e.target.value);
      setJsonData(parsed);

      // Don't auto-format while typing as it may disrupt user input
      // but keep the parsed data updated

      // Calculate key occurrences
      const occurrences = calculateKeyOccurrences(parsed);
      setKeyOccurrences(occurrences);

      setError("");
    } catch (err) {
      // Silent error handling while typing
    }
  };

  // Calculate occurrences of each key name
  const calculateKeyOccurrences = (obj: any): KeyOccurrences => {
    const occurrences: KeyOccurrences = {};

    const traverse = (o: any, path = ""): void => {
      if (o && typeof o === "object") {
        Object.keys(o).forEach((key) => {
          // Increment the count for this key name
          if (!occurrences[key]) {
            occurrences[key] = [];
          }

          const fullPath = path ? `${path}.${key}` : key;
          occurrences[key].push(fullPath);

          // Continue traversing if this is an object
          if (o[key] && typeof o[key] === "object") {
            const newPath = path ? `${path}.${key}` : key;
            traverse(o[key], newPath);
          }
        });
      }
    };

    traverse(obj);
    return occurrences;
  };

  // Get all paths in the JSON for initial expansion
  const getAllPaths = (obj: any, prefix = ""): string[] => {
    let paths: string[] = [];
    if (obj && typeof obj === "object") {
      Object.keys(obj).forEach((key) => {
        const currentPath = prefix ? `${prefix}.${key}` : key;
        paths.push(currentPath);
        if (obj[key] && typeof obj[key] === "object") {
          paths = [...paths, ...getAllPaths(obj[key], currentPath)];
        }
      });
    }
    return paths;
  };

  // Toggle expansion of a node
  const toggleExpand = (path: string): void => {
    if (expandedKeys.includes(path)) {
      setExpandedKeys(expandedKeys.filter((k) => k !== path));
    } else {
      setExpandedKeys([...expandedKeys, path]);
    }
  };

  // Toggle a specific key selection
  const toggleKeySelection = (path: string): void => {
    if (selectedKeys.includes(path)) {
      // Remove from selected
      setSelectedKeys(selectedKeys.filter((k) => k !== path));

      // If this path was excluded, remove it from excluded
      if (excludedPaths.includes(path)) {
        setExcludedPaths(excludedPaths.filter((p) => p !== path));
      }
    } else {
      // Add to selected
      setSelectedKeys([...selectedKeys, path]);

      // If this path was excluded, remove it from excluded
      if (excludedPaths.includes(path)) {
        setExcludedPaths(excludedPaths.filter((p) => p !== path));
      }
    }
  };

  // Add key to selected keys - this now adds all occurrences of a key name
  const addKeyToRemove = (keyName: string): void => {
    if (keyOccurrences[keyName]) {
      const allPaths = keyOccurrences[keyName];

      // Filter out any paths that were previously excluded
      const pathsToAdd = allPaths.filter(
        (path) => !excludedPaths.includes(path)
      );

      // Add all paths for this key name that aren't already selected
      const newSelected = [...selectedKeys];
      pathsToAdd.forEach((path) => {
        if (!newSelected.includes(path)) {
          newSelected.push(path);
        }
      });
      setSelectedKeys(newSelected);
    }
  };

  // Remove key from selected keys
  const removeFromSelected = (path: string): void => {
    setSelectedKeys(selectedKeys.filter((k) => k !== path));
  };

  // Exclude a specific occurrence of a key from removal
  const excludeSpecificPath = (path: string): void => {
    // Add to excluded paths
    if (!excludedPaths.includes(path)) {
      setExcludedPaths([...excludedPaths, path]);
    }

    // Remove from selected keys if it's there
    if (selectedKeys.includes(path)) {
      setSelectedKeys(selectedKeys.filter((k) => k !== path));
    }
  };

  // Remove all occurrences of a key name, except for specific excluded paths
  const removeAllOfKeyName = (
    keyName: string,
    exceptions: string[] = []
  ): void => {
    if (keyOccurrences[keyName]) {
      const pathsToRemove = keyOccurrences[keyName].filter(
        (path) => !exceptions.includes(path) // keep paths that are NOT in exceptions
      );
      setSelectedKeys(
        selectedKeys.filter((path) => !pathsToRemove.includes(path))
      );
    }
  };

  // Mark parent for removal and promote child
  const removeParentPromoteChild = (childPath: string): void => {
    const parts = childPath.split(".");

    // Check if this is a top-level key (no parent)
    if (parts.length <= 1) {
      setError("This key has no parent to remove.");
      return;
    }

    // Get the parent path
    const parentPath = parts.slice(0, -1).join(".");

    // Add to parents to remove list
    if (
      !parentsToRemove.some(
        (item) => item.parentPath === parentPath && item.childPath === childPath
      )
    ) {
      setParentsToRemove([...parentsToRemove, { parentPath, childPath }]);
    }
  };

  // Remove a parent-child restructuring from the list
  const removeFromParentsList = (
    parentPath: string,
    childPath: string
  ): void => {
    setParentsToRemove(
      parentsToRemove.filter(
        (item) =>
          !(item.parentPath === parentPath && item.childPath === childPath)
      )
    );
  };

  // Process the removal of selected keys and restructuring
  const processChanges = (): void => {
    // Save removed keys to history before processing
    const removedByName: Record<string, string[]> = {};
    selectedKeys.forEach((path) => {
      const keyName = getKeyNameFromPath(path);
      if (!removedByName[keyName]) {
        removedByName[keyName] = [];
      }
      removedByName[keyName].push(path);
    });

    // Add to history
    const historyEntries: RemovedKeyHistory[] = Object.keys(removedByName).map(
      (keyName) => ({
        keyName,
        paths: removedByName[keyName],
        timestamp: Date.now(),
      })
    );

    if (historyEntries.length > 0) {
      setRemovedKeysHistory([...removedKeysHistory, ...historyEntries]);
      // Show undo panel if we have new items
      setShowUndoPanel(true);
    }

    let newData = JSON.parse(JSON.stringify(jsonData));

    // First handle parent removals with child promotion
    if (parentsToRemove.length > 0) {
      parentsToRemove.forEach(({ parentPath, childPath }) => {
        // Extract the parent key and the child key
        const parentParts = parentPath.split(".");
        const childKey = childPath.split(".").pop() as string;
        const parentKey = parentParts.pop() as string;
        const grandparentPath =
          parentParts.length > 0 ? parentParts.join(".") : "";

        // Navigate to the grandparent (parent of the parent)
        let grandparent: any = newData;
        if (grandparentPath) {
          for (const part of grandparentPath.split(".")) {
            if (grandparent[part] === undefined) return;
            grandparent = grandparent[part];
          }
        }

        // Get the parent object
        const parent = grandparent[parentKey];

        // Get the child value to be promoted
        const childValue = parent[childKey];

        // Replace the parent with the child value in the grandparent
        grandparent[childKey] = childValue;

        // Remove the parent
        delete grandparent[parentKey];
      });

      // After restructuring, update the JSON
      setJsonData(newData);
      setJsonInput(JSON.stringify(newData, null, 2));
      setParentsToRemove([]);
    }

    // Then handle regular key removals
    if (selectedKeys.length > 0) {
      // Sort by path length descending so we remove deeper paths first
      const sortedKeys = [...selectedKeys].sort(
        (a, b) => b.split(".").length - a.split(".").length
      );

      sortedKeys.forEach((path) => {
        const parts = path.split(".");
        const lastKey = parts.pop() as string;
        let current: any = newData;

        // Navigate to the parent object
        let valid = true;
        for (const part of parts) {
          if (current[part] === undefined) {
            valid = false;
            break;
          }
          current = current[part];
        }

        // Remove the key if the path is still valid
        if (valid) {
          if (Array.isArray(current)) {
            const index = parseInt(lastKey);
            if (!isNaN(index)) {
              current.splice(index, 1);
            }
          } else if (typeof current === "object") {
            delete current[lastKey];
          }
        }
      });

      setJsonData(newData);
      setJsonInput(JSON.stringify(newData, null, 2));
      setSelectedKeys([]);
      setExcludedPaths([]);
    }

    // Recalculate key occurrences
    const occurrences = calculateKeyOccurrences(newData);
    setKeyOccurrences(occurrences);
  };

  // Get the key name from a path
  const getKeyNameFromPath = (path: string): string => {
    const parts = path.split(".");
    return parts[parts.length - 1];
  };

  // Group selected keys by name
  const getSelectedKeysByName = (): Record<string, string[]> => {
    const grouped: Record<string, string[]> = {};
    selectedKeys.forEach((path) => {
      const keyName = getKeyNameFromPath(path);
      if (!grouped[keyName]) {
        grouped[keyName] = [];
      }
      grouped[keyName].push(path);
    });
    return grouped;
  };

  // Get paths that are excluded from selection for each key name
  const getExcludedPathsByName = (): Record<string, string[]> => {
    const grouped: Record<string, string[]> = {};
    excludedPaths.forEach((path) => {
      const keyName = getKeyNameFromPath(path);
      if (!grouped[keyName]) {
        grouped[keyName] = [];
      }
      grouped[keyName].push(path);
    });
    return grouped;
  };

  // Restore a removed key
  const restoreRemovedKey = (keyPath: string): void => {
    // Find the history entry containing this path
    const entryIndex = removedKeysHistory.findIndex((entry) =>
      entry.paths.includes(keyPath)
    );

    if (entryIndex === -1) return;

    // Get the entry
    const entry = removedKeysHistory[entryIndex];

    // Create a deep copy of the current JSON
    const newData = JSON.parse(JSON.stringify(jsonData));

    // Navigate to the parent path
    const parts = keyPath.split(".");
    const keyName = parts.pop() as string;
    const parentPath = parts;

    let current = newData;
    for (const part of parentPath) {
      if (!current[part]) {
        // If the parent path doesn't exist, create it
        current[part] = {};
      }
      current = current[part];
    }

    // Add back the key with a placeholder value
    // In a real implementation, we'd use the stored value
    if (typeof keyName === "string") {
      // For object keys
      current[keyName] = "[Restored value]";
    } else if (!isNaN(parseInt(keyName))) {
      // For array indices
      const index = parseInt(keyName);
      if (Array.isArray(current)) {
        current.splice(index, 0, "[Restored value]");
      }
    }

    // Update the JSON data
    setJsonData(newData);
    setJsonInput(JSON.stringify(newData, null, 2));

    // Update the history
    const updatedEntry = {
      ...entry,
      paths: entry.paths.filter((p) => p !== keyPath),
    };

    let newHistory;
    if (updatedEntry.paths.length > 0) {
      // If there are still paths in this entry, update it
      newHistory = [...removedKeysHistory];
      newHistory[entryIndex] = updatedEntry;
    } else {
      // If no paths left, remove this entry
      newHistory = removedKeysHistory.filter((_, i) => i !== entryIndex);
    }

    setRemovedKeysHistory(newHistory);

    // Recalculate key occurrences
    const occurrences = calculateKeyOccurrences(newData);
    setKeyOccurrences(occurrences);
  };

  // Clear all history
  const clearHistory = (): void => {
    setRemovedKeysHistory([]);
    setShowUndoPanel(false);
  };

  // Format JSON on component mount
  useEffect(() => {
    parseJson();
  }, []);

  const selectedByName = getSelectedKeysByName();
  const excludedByName = getExcludedPathsByName();

  return (
    <div className="w-full flex flex-col  min-h-screen dark:bg-primary bg-white">
      {/* Header - Simplified with essential controls */}
      <Header />

      {/* Ad Space */}
      {isAdsExist && <Ads />}

      {/* Main content area - Side by side layout for input/tree sections */}

      <div className="flex flex-col w-full p-3 gap-3 bg-white dark:bg-primary">
        {/* JSON Input and Tree View side by side */}
        <div
          ref={resizerRef}
          className="flex w-full gap-3 rounded-md border border-black dark:border-border p-1 relative"
        >
          {/* Left Panel - JSON Input */}
          <div className="w-1/2 bg-white rounded-lg shadow-sm  dark:bg-primary p-3 ">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-700 dark:text-white">
                Input JSON
              </label>
              <div className="text-xs text-gray-500">Paste your JSON here</div>
            </div>
            <textarea
              value={jsonInput}
              onChange={handleInputChange}
              onBlur={parseJson}
              className="w-full h-[400px] p-3 border text-black dark:border-border rounded-lg font-mono text-sm dark:text-white dark:bg-secondary-lighter shadow-inner overflow-auto resize-none"
              placeholder="Paste your JSON here..."
              spellCheck="false"
              style={{ height: height + "px" }}
            />
          </div>

          {/* Right Panel - JSON Tree View */}
          <div className="w-1/2 bg-white rounded-lg shadow-sm   dark:bg-primary p-3">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-sm font-medium text-black dark:text-white text-blackd ">JSON Tree</h2>
              {/* Action Button */}
              <div className="flex gap-2 ">
                <button
                  onClick={parseJson}
                  className="px-3 py-0.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-all flex items-center text-[10px]"
                >
                  <Icon icon="mdi:refresh" className="text-[10px] mr-1" />
                  Parse
                </button>

                <button
                  onClick={processChanges}
                  disabled={
                    selectedKeys.length === 0 && parentsToRemove.length === 0
                  }
                  className={`px-3 py-0.5 rounded-md transition-all flex items-center text-[10px] ${
                    selectedKeys.length > 0 || parentsToRemove.length > 0
                      ? "bg-red-500 text-white hover:bg-red-600"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  <Icon icon="mdi:check" className="text-[10px] mr-1" />
                  Apply Changes
                </button>

                <button
                  onClick={() => setShowUndoPanel(!showUndoPanel)}
                  disabled={removedKeysHistory.length === 0}
                  className={`px-3 py-0.5 rounded-md transition-all flex items-center text-[10px] ${
                    removedKeysHistory.length > 0
                      ? "bg-purple-500 text-white hover:bg-purple-600"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  <Icon icon="mdi:history" className="text-[10px] mr-1" />
                  History
                </button>
              </div>
            </div>

            {/* Tree view with fixed height */}
            {jsonData ? (
              <div
                style={{ height: height + "px" }}
                className="border dark:border-border rounded-lg dark:text-white dark:bg-secondary-lighter p-3  overflow-auto"
              >
                {Object.keys(jsonData).map((key, idx) => {
                  const path = key;
                  return (
                    <div
                      key={idx}
                      className={
                        idx > 0 ? "mt-2 pt-2 border-t dark:border-border" : ""
                      }
                    >
                      <JsonTreeNode
                        openRenameDialog={openRenameDialog}
                        data={jsonData[key]}
                        path={path}
                        keyName={key}
                        expandedKeys={expandedKeys}
                        selectedKeys={selectedKeys}
                        excludedPaths={excludedPaths}
                        keyOccurrences={keyOccurrences}
                        toggleExpand={toggleExpand}
                        toggleKeySelection={toggleKeySelection}
                        addKeyToRemove={addKeyToRemove}
                        excludeSpecificPath={excludeSpecificPath}
                        removeParentPromoteChild={removeParentPromoteChild}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="border dark:border-border rounded-lg bg-white h-[600px] flex items-center justify-center">
                <p className="text-gray-500 text-sm">
                  No valid JSON data to display
                </p>
              </div>
            )}
          </div>

          <div
            onMouseDown={onMouseDown}
            style={{
              height: "5px",
              cursor: "ns-resize",
              position: "absolute",
              userSelect: "none",
              bottom: 0,
              left: 0,
              right: 0,
            }}
          />
        </div>

        {/* Selection Panel */}
        <div className="w-full bg-white rounded-lg  border-gray-200">
          <SelectionsPanel
            error={error}
            setError={setError}
            selectedByName={selectedByName}
            excludedByName={excludedByName}
            parentsToRemove={parentsToRemove}
            keyOccurrences={keyOccurrences}
            removeAllOfKeyName={removeAllOfKeyName}
            removeFromSelected={removeFromSelected}
            excludeSpecificPath={excludeSpecificPath}
            removeFromParentsList={removeFromParentsList}
          />
        </div>

        {/* History Panel - Only visible when needed */}
        {showUndoPanel && (
          <div className="w-full bg-white rounded-lg shadow-sm ">
            <RemovedKeysHistoryPanel
              removedKeysHistory={removedKeysHistory}
              showUndoPanel={showUndoPanel}
              restoreRemovedKey={restoreRemovedKey}
              clearHistory={clearHistory}
            />
          </div>
        )}
      </div>

      {/* Bottom Ad Space */}
      {isAdsExist && <Ads />}
      {/* Rename Dialog */}
      <KeyRenameDialog
        isOpen={renameDialogOpen}
        keyPath={keyToRename}
        currentName={currentKeyName}
        onClose={closeRenameDialog}
        onRename={handleRenameKey}
      />
    </div>
  );
};

export default JsonTreeEditor;
