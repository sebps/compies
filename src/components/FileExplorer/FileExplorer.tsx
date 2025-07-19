import React, { useEffect, useRef, useState } from 'react';
import './FileExplorer.css';

export interface FileExplorerProps {
  files: string[];
  onFileDelete: (filePath: string) => void;
  onFileRename: (oldPath: string, newPath: string) => void;
  onFileSelect: (filePath: string) => void;
  color?: string;
  backgroundColor?: string;
}

interface TreeNode {
  name: string;
  path: string;
  isFile: boolean;
  children?: TreeNode[];
}

const buildFileTree = (files: string[]): TreeNode[] => {
  const root: TreeNode[] = [];
  for (const file of files) {
    const parts = file.split('/');
    let current = root;
    parts.forEach((part, index) => {
      let existing = current.find((node) => node.name === part);
      if (!existing) {
        const isFile = index === parts.length - 1;
        existing = {
          name: part,
          path: parts.slice(0, index + 1).join('/'),
          isFile,
          ...(isFile ? {} : { children: [] }),
        };
        current.push(existing);
      }
      current = existing.children ?? [];
    });
  }
  return root;
};

export const FileExplorer: React.FC<FileExplorerProps> = ({
  files,
  onFileDelete,
  onFileRename,
  onFileSelect,
  color = '#000',
  backgroundColor = '#fff',
}) => {
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; path: string } | null>(null);
  const [renamePath, setRenamePath] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState<string>('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  const tree = buildFileTree(files);

  const toggleFolder = (path: string) => {
    setOpenFolders((prev) => {
      const updated = new Set(prev);
      updated.has(path) ? updated.delete(path) : updated.add(path);
      return updated;
    });
  };

  const handleContextMenu = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, path });
  };

  const handleDelete = (path: string) => {
    onFileDelete(path);
    setContextMenu(null);
  };

  const handleStartRename = (path: string) => {
    const parts = path.split('/');
    const foldersToOpen = new Set<string>();
    for (let i = 1; i < parts.length; i++) {
      foldersToOpen.add(parts.slice(0, i).join('/'));
    }

    setOpenFolders((prev) => {
      const updated = new Set(prev);
      foldersToOpen.forEach((p) => updated.add(p));
      return updated;
    });

    setRenamePath(path);
    setRenameValue(parts[parts.length - 1]);
    setContextMenu(null);
  };

  const confirmRename = () => {
    if (!renamePath) return;
    const oldParts = renamePath.split('/');
    const oldName = oldParts[oldParts.length - 1];
    if (renameValue.trim() && renameValue !== oldName) {
      oldParts[oldParts.length - 1] = renameValue.trim();
      const newPath = oldParts.join('/');
      onFileRename(renamePath, newPath);
    }
    setRenamePath(null);
  };

  useEffect(() => {
    if (renamePath && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [renamePath]);

  const renderTree = (nodes: TreeNode[], level = 0): React.ReactNode[] => {
    return nodes.flatMap((node) => {
      const isOpen = openFolders.has(node.path);
      const isRenaming = renamePath === node.path;
      const paddingLeft = level * 16;

      const item = (
        <div
          key={node.path}
          className="file-explorer-item"
          style={{ paddingLeft }}
          onContextMenu={(e) => handleContextMenu(e, node.path)}
        >
          {node.isFile ? (
            <span className="file-icon">📄</span>
          ) : (
            <span className="folder-icon" onClick={() => toggleFolder(node.path)} style={{ cursor: 'pointer' }}>
              {isOpen ? '📂' : '📁'}
            </span>
          )}

          {isRenaming ? (
            <input
              ref={inputRef}
              className="file-rename-input"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && confirmRename()}
              onBlur={() => setTimeout(confirmRename, 100)}
            />
          ) : (
            <span
              className="file-name"
              style={{ color }}
              onClick={() => node.isFile && onFileSelect(node.path)}
            >
              {node.name}
            </span>
          )}
        </div>
      );

      if (!node.isFile && isOpen && node.children) {
        return [item, ...renderTree(node.children, level + 1)];
      }

      return [item];
    });
  };

  return (
    <div
      className="file-explorer"
      style={{ backgroundColor }}
      onClick={() => contextMenu && setContextMenu(null)}
    >
      {renderTree(tree)}

      {contextMenu && (
        <div
          className="context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <div className="context-menu-item" onClick={() => handleStartRename(contextMenu.path)}>
            Rename
          </div>
          <div className="context-menu-item delete" onClick={() => handleDelete(contextMenu.path)}>
            Delete
          </div>
        </div>
      )}
    </div>
  );
};

export default FileExplorer;
