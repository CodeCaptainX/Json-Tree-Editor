import React, { useState, useEffect, useRef } from "react";
import { Icon } from "@iconify/react";

interface KeyRenameDialogProps {
  isOpen: boolean;
  keyPath: string;
  currentName: string;
  onClose: () => void;
  onRename: (keyPath: string, newName: string, renameAllMatching: boolean) => void;
  onTrackEvent?: (event: string, properties?: Record<string, any>) => void;
}

const KeyRenameDialog: React.FC<KeyRenameDialogProps> = ({
  isOpen,
  keyPath,
  currentName,
  onClose,
  onRename,
  onTrackEvent
}) => {
  const [newName, setNewName] = useState<string>(currentName);
  const [error, setError] = useState<string>("");
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [renameAllMatching, setRenameAllMatching] = useState<boolean>(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Parse the key path to extract parent path and key
  const pathParts = keyPath.split('.');
  const keyName = pathParts[pathParts.length - 1];
  const parentPath = pathParts.slice(0, -1).join('.');

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setNewName(currentName);
      setError("");
      setRenameAllMatching(false);
      setIsAnimating(true);
      
      // Track dialog open event
      if (onTrackEvent) {
        onTrackEvent("rename_dialog_opened", { keyPath });
      }

      // Focus the input field after animation completes
      const timer = setTimeout(() => {
        const input = document.getElementById("newKeyName");
        if (input) input.focus();
      }, 300);
      
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
    }
  }, [isOpen, currentName, keyPath, onTrackEvent]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (isOpen && e.key === "Escape") {
        if (onTrackEvent) {
          onTrackEvent("rename_dialog_closed", { method: "escape_key" });
        }
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose, onTrackEvent]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(e.target as Node) && isOpen) {
        if (onTrackEvent) {
          onTrackEvent("rename_dialog_closed", { method: "outside_click" });
        }
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose, onTrackEvent]);

  if (!isOpen && !isAnimating) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate the new key name
    if (!newName.trim()) {
      setError("Key name cannot be empty");
      if (onTrackEvent) {
        onTrackEvent("rename_validation_error", { error: "empty_name" });
      }
      return;
    }
    
    // Check for invalid characters in object keys
    if (!/^[a-zA-Z0-9_$]+$/.test(newName)) {
      setError("Key name can only contain letters, numbers, underscore, and $");
      if (onTrackEvent) {
        onTrackEvent("rename_validation_error", { error: "invalid_characters" });
      }
      return;
    }
    
    // Allow submitting even if name is the same (it might be renaming all instances)
    
    // Track successful rename
    if (onTrackEvent) {
      onTrackEvent("key_renamed", { 
        keyPath,
        oldName: currentName,
        newName,
        renameAllMatching
      });
    }
    
    // Proceed with renaming
    onRename(keyPath, newName, renameAllMatching);
    onClose();
  };

  const handleCancel = () => {
    if (onTrackEvent) {
      onTrackEvent("rename_dialog_cancelled", { keyPath });
    }
    onClose();
  };

  return (
    <div 
      className={`fixed inset-0 bg-black/10 flex items-center justify-center z-50 transition-opacity duration-300 ${
        isAnimating && isOpen ? "opacity-100" : "opacity-0"
      }`}
      style={{ backdropFilter: "blur(2px)" }}
    >
      <div 
        ref={dialogRef}
        className={`bg-white rounded-lg shadow-lg w-96 max-w-full transition-all duration-300 ${
          isAnimating && isOpen ? "scale-100 translate-y-0" : "scale-95 -translate-y-4"
        }`}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-800">Rename Key</h3>
          <button 
            onClick={handleCancel}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Close dialog"
          >
            <Icon icon="mdi:close" width="20" height="20" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 text-gray-500">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Key Details
            </label>
            <div className="p-2 bg-gray-50 border border-gray-200 rounded text-sm font-mono overflow-x-auto">
              <div><span className="text-gray-500">Path:</span> {parentPath || '(root)'}</div>
              <div><span className="text-gray-500">Key:</span> {keyName}</div>
            </div>
          </div>
          
          <div className="mb-4">
            <label htmlFor="newKeyName" className="block text-sm font-medium text-gray-700 mb-1">
              New Key Name
            </label>
            <input
              id="newKeyName"
              type="text"
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value);
                setError("");
              }}
              className="w-full text-gray-500 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 transition-shadow"
            />
            {error && (
              <p className="mt-1 text-sm text-red-600 animate-fadeIn">{error}</p>
            )}
          </div>
          
          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={renameAllMatching}
                onChange={(e) => setRenameAllMatching(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">
                Rename all matching keys in document
              </span>
            </label>
            <p className="text-xs text-gray-500 mt-1 ml-6">
              This will rename all keys named "{currentName}" at any level of the document
            </p>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm text-white bg-blue-500 hover:bg-blue-600 rounded-md transition-colors shadow-sm hover:shadow"
            >
              Rename
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default KeyRenameDialog;