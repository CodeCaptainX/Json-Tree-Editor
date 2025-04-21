import { useState } from "react";
import { Icon } from "@iconify/react";

interface ParentChildPair {
  parentPath: string;
  childPath: string;
}

// Use the correct interface definition for KeyOccurrences
interface KeyOccurrences {
  [key: string]: string[];
}

interface SelectionsPanelProps {
  error: string;
  selectedByName: Record<string, string[]>;
  excludedByName: Record<string, string[]>;
  parentsToRemove: ParentChildPair[];
  keyOccurrences: KeyOccurrences;
  setError: (error: string) => void;
  removeAllOfKeyName: (keyName: string, exceptions: string[]) => void;
  removeFromSelected: (keyName: string, path: string) => void;
  excludeSpecificPath: (keyName: string, path: string) => void;
  removeFromParentsList: (parentPath: string, childPath: string) => void;
}

// ErrorAlert Component
const ErrorAlert: React.FC<{ error: string; onClose: () => void }> = ({
  error,
  onClose,
}) => {
  if (!error) return null;

  return (
    <div className="dark:bg-secondary-lighter border-l-4 border-red-500 p-3 mb-3 flex justify-between">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <Icon icon="mdi:alert-circle" className="h-5 w-5 text-red-500" />
        </div>
        <div className="ml-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      </div>
      <div className="flex items-start cursor-pointer" onClick={onClose}>
        <div className="flex-shrink-0">
          <Icon
            icon="fluent-emoji-high-contrast:cross-mark"
            className="h-5 w-5 text-red-500"
          />
        </div>
      </div>
    </div>
  );
};

// SelectedKeysSection Component
const SelectedKeysSection: React.FC<{
  selectedByName: Record<string, string[]>;
  excludedByName: Record<string, string[]>;
  keyOccurrences: KeyOccurrences;
  removeAllOfKeyName: (keyName: string, exceptions: string[]) => void;
  removeFromSelected: (keyName: string, path: string) => void;
  excludeSpecificPath: (keyName: string, path: string) => void;
}> = ({
  selectedByName,
  excludedByName,
  keyOccurrences,
  removeAllOfKeyName,
  removeFromSelected,
  excludeSpecificPath,
}) => {
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});

  const toggleExpand = (keyName: string) => {
    setExpandedKeys((prev) => ({
      ...prev,
      [keyName]: !prev[keyName],
    }));
  };

  const handleToggleExcludePath = (keyName: string, path: string) => {
    excludeSpecificPath(keyName, path);
  };

  const handleRemoveKey = (keyName: string) => {
    // Use the existing excluded paths for this key when removing all
    removeAllOfKeyName(keyName, excludedByName[keyName] || []);
  };

  const handleRemovePath = (keyName: string, path: string) => {
    removeFromSelected(keyName, path);
  };

  if (Object.keys(selectedByName).length === 0) return null;

  return (
    <div>
      <h3 className="text-sm font-medium text-gray-700 mb-2 sticky top-0 dark:bg-primary  dark:text-white p-2 rounded-md">
        Selected Keys to Remove
      </h3>
      <div className="mb-4  max-h-40  overflow-y-auto">
        <div className="space-y-2 ">
          {Object.entries(selectedByName).map(([keyName, paths]) => {
            // Get all occurrences for this key (or default to what's selected if not available)
            const allOccurrences = keyOccurrences[keyName] || [];
            const totalOccurrences = allOccurrences.length || paths.length;

            const hasExclusions =
              excludedByName[keyName] && excludedByName[keyName].length > 0;
            const effectiveCount = paths.length;

            return (
              <div key={keyName} className="dark:bg-secondary-lighter rounded-md p-2 ">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-red-600 font-medium">{keyName}</span>
                    <span className="ml-2 text-xs bg-red-200 text-red-800 px-2 py-0.5 rounded-full">
                      {effectiveCount} of {totalOccurrences} occurrence
                      {totalOccurrences !== 1 ? "s" : ""}
                      {hasExclusions &&
                        ` (${excludedByName[keyName].length} excluded)`}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {totalOccurrences > 1 && (
                      <button
                        onClick={() => toggleExpand(keyName)}
                        className="text-gray-500 hover:text-gray-700 focus:outline-none"
                      >
                        <Icon
                          icon={
                            expandedKeys[keyName]
                              ? "mdi:chevron-up"
                              : "mdi:chevron-down"
                          }
                          className="h-5 w-5"
                        />
                      </button>
                    )}

                    <button
                      onClick={() => handleRemoveKey(keyName)}
                      className="text-red-600 hover:text-red-800 focus:outline-none flex items-center text-sm"
                    >
                      <Icon icon="mdi:close" className="h-4 w-4 mr-1" />
                      Remove All
                    </button>
                  </div>
                </div>

                {expandedKeys[keyName] && totalOccurrences > 1 && (
                  <div className="mt-2 pl-4 space-y-1 border-l-2 border-red-200">
                    {/* Show all paths - whether selected, excluded, or from all occurrences */}
                    {Array.from(
                      new Set([
                        ...paths,
                        ...(excludedByName[keyName] || []),
                        ...(keyOccurrences[keyName] || []),
                      ])
                    ).map((path) => {
                      const isExcluded = (
                        excludedByName[keyName] || []
                      ).includes(path);
                      const isSelected = paths.includes(path);

                      return (
                        <div
                          key={path}
                          className={`flex items-center justify-between text-xs p-1 rounded ${
                            isExcluded
                              ? "bg-white text-gray-500"
                              : isSelected
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          <span className="truncate max-w-xs" title={path}>
                            {path}
                          </span>
                          <div className="flex items-center">
                            <button
                              onClick={() =>
                                handleToggleExcludePath(keyName, path)
                              }
                              className={`ml-2 ${
                                isExcluded
                                  ? "text-green-600 hover:text-green-800"
                                  : "text-gray-600 hover:text-gray-800"
                              }`}
                              title={
                                isExcluded
                                  ? "Include this path"
                                  : "Exclude this path"
                              }
                            >
                              <Icon
                                icon={
                                  isExcluded
                                    ? "mdi:plus-circle"
                                    : "mdi:minus-circle"
                                }
                                className="h-4 w-4"
                              />
                            </button>
                            {isSelected && (
                              <button
                                onClick={() => handleRemovePath(keyName, path)}
                                className="ml-2 text-red-600 hover:text-red-800"
                                title="Remove this path"
                              >
                                <Icon icon="mdi:close" className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ParentPromotionsSection Component
const ParentPromotionsSection: React.FC<{
  parentsToRemove: ParentChildPair[];
  removeFromParentsList: (parentPath: string, childPath: string) => void;
}> = ({ parentsToRemove, removeFromParentsList }) => {
  if (parentsToRemove.length === 0) return null;

  return (
    <div>
      <h3 className="text-sm font-medium text-gray-700 mb-2 sticky top-0 p-2 dark:bg-primary  dark:text-white rounded-md">
        Parent Keys to Replace with Children
      </h3>
      <div className="space-y-2 max-h-40 overflow-y-auto">
        {parentsToRemove.map((item, index) => (
          <div
            key={index}
            className="dark:bg-secondary-lighter rounded-md p-2 flex items-center justify-between"
          >
            <div>
              <div className="flex items-center">
                <span className="text-purple-600 font-medium">
                  Replace: <span className="font-mono">{item.parentPath}</span>
                </span>
              </div>
              <div className="text-xs text-gray-600 mt-1">
                With child:{" "}
                <span className="font-mono">
                  {item.childPath.split(".").pop()}
                </span>
              </div>
            </div>

            <button
              onClick={() =>
                removeFromParentsList(item.parentPath, item.childPath)
              }
              className="text-purple-600 hover:text-purple-800 focus:outline-none flex items-center text-sm"
            >
              <Icon icon="mdi:close" className="h-4 w-4 mr-1" />
              Cancel
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// Main SelectionsPanel Component
const SelectionsPanel: React.FC<SelectionsPanelProps> = ({
  error,
  setError,
  selectedByName,
  excludedByName,
  parentsToRemove,
  keyOccurrences,
  removeAllOfKeyName,
  removeFromSelected,
  excludeSpecificPath,
  removeFromParentsList,
}) => {
  const hasSelections =
    Object.keys(selectedByName).length > 0 || parentsToRemove.length > 0;

  if (!hasSelections && !error) return null;

  return (
    <div className=" dark:bg-[#24394b] p-3 rounded-md">
      <ErrorAlert error={error} onClose={() => setError("")} />

      {hasSelections && (
        <div className="space-y-4">
          <SelectedKeysSection
            selectedByName={selectedByName}
            excludedByName={excludedByName}
            keyOccurrences={keyOccurrences}
            removeAllOfKeyName={removeAllOfKeyName}
            removeFromSelected={removeFromSelected}
            excludeSpecificPath={excludeSpecificPath}
          />

          <ParentPromotionsSection
            parentsToRemove={parentsToRemove}
            removeFromParentsList={removeFromParentsList}
          />
        </div>
      )}
    </div>
  );
};

export default SelectionsPanel;
