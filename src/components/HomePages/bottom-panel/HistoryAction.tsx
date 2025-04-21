import React from 'react';
import { Icon } from '@iconify/react';

type HistoryEntry = {
  keyName: string;
  timestamp: number;
  paths: string[];
};

interface RemovedKeysHistoryPanelProps {
  removedKeysHistory: HistoryEntry[];
  showUndoPanel: boolean;
  restoreRemovedKey: (keyPath: string) => void;
  clearHistory: () => void;
}

const RemovedKeysHistoryPanel: React.FC<RemovedKeysHistoryPanelProps> = ({
  removedKeysHistory,
  showUndoPanel,
  restoreRemovedKey,
  clearHistory
}) => {
  if (!showUndoPanel || removedKeysHistory.length === 0) {
    return null;
  }

  return (
    <div className=" dark:bg-secondary-lighter p-3 rounded-md">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium dark:text-white">Removed Keys History</h3>
        <button 
          onClick={clearHistory}
          className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
        >
          Clear History
        </button>
      </div>
      <div className="max-h-40 overflow-y-auto">
        {removedKeysHistory.map((entry, idx) => (
          <div key={idx} className="mb-2 pb-2 border-b border-gray-100 last:border-0">
            <div className="flex items-center">
              <span className="font-medium text-sm dark:text-red-500">{entry.keyName}</span>
              <span className="text-xs text-gray-500 ml-2">
                {new Date(entry.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {entry.paths.map((path, pathIdx) => (
                <div key={pathIdx} className="flex items-center text-xs">
                  <button
                    onClick={() => restoreRemovedKey(path)}
                    className="mr-1 text-green-500 hover:text-green-600"
                    title="Restore this key"
                  >
                    <Icon icon="mdi:restore" width="14" height="14" />
                  </button>
                  <span className="text-gray-600 truncate" title={path}>
                    {path}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RemovedKeysHistoryPanel;