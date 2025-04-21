import React from "react";
import { Icon } from "@iconify/react";

interface JsonTreeNodeProps {
  data: any;
  path: string;
  keyName: string;
  expandedKeys: string[];
  selectedKeys: string[];
  excludedPaths: string[];
  keyOccurrences: Record<string, string[]>;
  toggleExpand: (path: string) => void;
  toggleKeySelection: (path: string) => void;
  addKeyToRemove: (keyName: string) => void;
  excludeSpecificPath: (path: string) => void;
  removeParentPromoteChild: (childPath: string) => void;
  openRenameDialog: (path: string, currentName: string) => void;
}

const JsonTreeNode: React.FC<JsonTreeNodeProps> = ({
  data,
  path,
  keyName,
  expandedKeys,
  selectedKeys,
  excludedPaths,
  keyOccurrences,
  toggleExpand,
  toggleKeySelection,
  addKeyToRemove,
  excludeSpecificPath,
  removeParentPromoteChild,
  openRenameDialog,
}) => {
  if (data === null || typeof data !== "object") {
    const valueDisplay =
      data === null
        ? "null"
        : typeof data === "string"
        ? `"${data}"`
        : String(data);

    const isSelected = selectedKeys.includes(path);
    const isExcluded = excludedPaths.includes(path);
    const isMultipleOccurrences =
      keyOccurrences[keyName] && keyOccurrences[keyName].length > 1;

    return (
      <div className="flex items-center my-1">
        <div
          className={`flex items-center px-3 py-1.5 rounded-lg shadow-sm mr-2 text-sm transition-all duration-200 ${
            isSelected
              ? "bg-red-50 border-l-4 border-red-400"
              : isExcluded && isMultipleOccurrences
              ? "bg-amber-50 border-l-4 border-amber-400"
              : "bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-400"
          }`}
        >
          <span className="font-medium mr-1 text-gray-800">{keyName}:</span>
          <span
            className={`${
              typeof data === "string"
                ? "text-emerald-600 font-mono"
                : "text-indigo-600 font-mono"
            }`}
          >
            {valueDisplay}
          </span>
          
          {/* Add rename button for primitive values */}
          <button
            onClick={() => openRenameDialog(path, keyName)}
            className="ml-3 w-6 h-6 flex items-center justify-center hover:bg-blue-100 text-blue-500 rounded"
            title="Rename key"
          >
            <Icon icon="mdi:pencil" className="h-4 w-4" />
          </button>

          <div className="flex ml-3">
            <button
              onClick={() => toggleKeySelection(path)}
              className={`${
                isSelected
                  ? "text-red-600 bg-red-100"
                  : "text-gray-500 hover:text-red-600 hover:bg-red-50"
              } focus:outline-none w-6 h-6 rounded-full flex items-center justify-center transition-colors duration-200 mr-1`}
              title={
                isSelected ? "Unselect this key" : "Select this key for removal"
              }
            >
              <Icon
                icon={isSelected ? "mdi:close" : "mdi:checkbox-blank-outline"}
                width="16"
                height="16"
              />
            </button>

            {isMultipleOccurrences && (
              <button
                onClick={() => addKeyToRemove(keyName)}
                className="text-gray-500 hover:text-red-600 hover:bg-red-50 focus:outline-none w-6 h-6 rounded-full flex items-center justify-center transition-colors duration-200 mr-1"
                title={`Remove all '${keyName}' keys`}
              >
                <Icon icon="mdi:select-all" width="16" height="16" />
              </button>
            )}

            {isMultipleOccurrences && (
              <button
                onClick={() => excludeSpecificPath(path)}
                className={`${
                  isExcluded
                    ? "text-amber-600 bg-amber-100"
                    : "text-gray-500 hover:text-amber-600 hover:bg-amber-50"
                } focus:outline-none w-6 h-6 rounded-full flex items-center justify-center transition-colors duration-200 mr-1`}
                title={
                  isExcluded
                    ? "This path is excluded from bulk removal"
                    : "Exclude this path from bulk removal"
                }
              >
                <Icon icon="mdi:shield" width="16" height="16" />
              </button>
            )}

            <button
              onClick={() => removeParentPromoteChild(path)}
              className="text-gray-500 hover:text-purple-600 hover:bg-purple-50 focus:outline-none w-6 h-6 rounded-full flex items-center justify-center transition-colors duration-200"
              title="Remove parent and promote this value"
            >
              <Icon icon="mdi:arrow-up" width="16" height="16" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isExpanded = expandedKeys.includes(path);
  const isSelected = selectedKeys.includes(path);
  const isExcluded = excludedPaths.includes(path);
  const isMultipleOccurrences =
    keyOccurrences[keyName] && keyOccurrences[keyName].length > 1;
  const isArray = Array.isArray(data);
  const childCount = isArray ? data.length : Object.keys(data).length;

  return (
    <div className="my-1">
      <div className="flex items-center">
        <button
          onClick={() => toggleExpand(path)}
          className="focus:outline-none mr-1 w-6 h-6 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors duration-200"
          title={isExpanded ? "Collapse" : "Expand"}
        >
          <Icon
            icon={isExpanded ? "mdi:chevron-down" : "mdi:chevron-right"}
            width="16"
            height="16"
            className="text-gray-500"
          />
        </button>

        <div
          className={`flex items-center px-3 py-1.5 rounded-lg shadow-sm mr-2 flex-grow text-sm transition-all duration-200 ${
            isSelected
              ? "bg-red-50 border-l-4 border-red-400"
              : isExcluded && isMultipleOccurrences
              ? "bg-amber-50 border-l-4 border-amber-400"
              : "bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-400"
          }`}
        >
          <span className="font-medium mr-1 text-gray-800">{keyName}</span>
          <span className="text-gray-500 text-xs mr-1">
            {isArray ? "Array" : "Object"}
          </span>
          <span className="bg-gray-200 text-gray-700 text-xs px-1.5 py-0.5 rounded-full">
            {childCount} {childCount === 1 ? "item" : "items"}
          </span>

          <button
            onClick={() => openRenameDialog(path, keyName)}
            className="ml-3 w-6 h-6 flex items-center justify-center hover:bg-blue-100 text-blue-500 rounded"
            title="Rename key"
          >
            <Icon icon="mdi:pencil" className="h-4 w-4" />
          </button>
          
          <div className="flex ml-auto">
            <button
              onClick={() => toggleKeySelection(path)}
              className={`${
                isSelected
                  ? "text-red-600 bg-red-100"
                  : "text-gray-500 hover:text-red-600 hover:bg-red-50"
              } focus:outline-none w-6 h-6 rounded-full flex items-center justify-center transition-colors duration-200 mr-1`}
              title={
                isSelected ? "Unselect this key" : "Select this key for removal"
              }
            >
              <Icon
                icon={isSelected ? "mdi:close" : "mdi:checkbox-blank-outline"}
                width="16"
                height="16"
              />
            </button>

            {isMultipleOccurrences && (
              <button
                onClick={() => addKeyToRemove(keyName)}
                className="text-gray-500 hover:text-red-600 hover:bg-red-50 focus:outline-none w-6 h-6 rounded-full flex items-center justify-center transition-colors duration-200 mr-1"
                title={`Remove all '${keyName}' keys`}
              >
                <Icon icon="mdi:select-all" width="16" height="16" />
              </button>
            )}

            {isMultipleOccurrences && (
              <button
                onClick={() => excludeSpecificPath(path)}
                className={`${
                  isExcluded
                    ? "text-amber-600 bg-amber-100"
                    : "text-gray-500 hover:text-amber-600 hover:bg-amber-50"
                } focus:outline-none w-6 h-6 rounded-full flex items-center justify-center transition-colors duration-200 mr-1`}
                title={
                  isExcluded
                    ? "This path is excluded from bulk removal"
                    : "Exclude this path from bulk removal"
                }
              >
                <Icon icon="mdi:shield" width="16" height="16" />
              </button>
            )}

            <button
              onClick={() => removeParentPromoteChild(path)}
              className="text-gray-500 hover:text-purple-600 hover:bg-purple-50 focus:outline-none w-6 h-6 rounded-full flex items-center justify-center transition-colors duration-200"
              title="Remove parent and promote this object/array"
            >
              <Icon icon="mdi:arrow-up" width="16" height="16" />
            </button>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="pl-6 border-l dark:border-border ml-3 mt-1">
          {isArray
            ? data.map((item, idx) => (
                <JsonTreeNode
                  key={idx}
                  data={item}
                  path={`${path}.${idx}`}
                  keyName={idx.toString()}
                  expandedKeys={expandedKeys}
                  selectedKeys={selectedKeys}
                  excludedPaths={excludedPaths}
                  keyOccurrences={keyOccurrences}
                  toggleExpand={toggleExpand}
                  toggleKeySelection={toggleKeySelection}
                  addKeyToRemove={addKeyToRemove}
                  excludeSpecificPath={excludeSpecificPath}
                  removeParentPromoteChild={removeParentPromoteChild}
                  openRenameDialog={openRenameDialog}
                />
              ))
            : Object.keys(data).map((key, idx) => (
                <JsonTreeNode
                  key={idx}
                  data={data[key]}
                  path={`${path}.${key}`}
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
                  openRenameDialog={openRenameDialog}
                />
              ))}
        </div>
      )}
    </div>
  );
};

export default JsonTreeNode;