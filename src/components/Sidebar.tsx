import React, { useState, useEffect } from 'react';
import { ref, onValue, push, remove, set, update } from 'firebase/database';
import { database } from '../lib/firebase';
import { Plus, Folder, File, Trash, ChevronRight, ChevronDown, MoveRight } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface SidebarProps {
  userId: string;
  onSelectNote: (noteId: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

interface Note {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
  folder?: string;
}

interface Folder {
  id: string;
  name: string;
}

export default function Sidebar({ userId, onSelectNote, isOpen, onClose }: SidebarProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [movingNoteId, setMovingNoteId] = useState<string | null>(null);

  useEffect(() => {
    const notesRef = ref(database, `users/${userId}/notes`);
    const foldersRef = ref(database, `users/${userId}/folders`);

    const notesUnsubscribe = onValue(notesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const notesList = Object.entries(data).map(([id, note]: [string, any]) => ({
          id,
          ...note,
        }));
        setNotes(notesList);
      } else {
        setNotes([]);
      }
    });

    const foldersUnsubscribe = onValue(foldersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const foldersList = Object.entries(data).map(([id, folder]: [string, any]) => ({
          id,
          ...folder,
        }));
        setFolders(foldersList);
      } else {
        setFolders([]);
      }
    });

    return () => {
      // Firebase will handle unsubscribe
    };
  }, [userId]);

  const moveNoteToFolder = async (noteId: string, targetFolderId: string | null) => {
    try {
      const noteRef = ref(database, `users/${userId}/notes/${noteId}`);
      await update(noteRef, {
        folder: targetFolderId,
        updatedAt: new Date().toISOString(),
      });
      setMovingNoteId(null);
      toast.success('Note moved successfully');
    } catch (error) {
      toast.error('Failed to move note');
    }
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const createNewNote = async () => {
    try {
      const notesRef = ref(database, `users/${userId}/notes`);
      const newNoteRef = await push(notesRef, {
        title: 'Untitled Note',
        content: '',
        updatedAt: new Date().toISOString(),
        folder: activeFolder,
      });
      onSelectNote(newNoteRef.key!);
      toast.success('New note created');
    } catch (error) {
      toast.error('Failed to create note');
    }
  };

  const createNewFolder = async () => {
    const folderName = prompt('Enter folder name:');
    if (folderName) {
      try {
        const foldersRef = ref(database, `users/${userId}/folders`);
        const newFolderRef = await push(foldersRef, {
          name: folderName,
        });
        setExpandedFolders((prev) => new Set([...prev, newFolderRef.key!]));
        toast.success('Folder created');
      } catch (error) {
        toast.error('Failed to create folder');
      }
    }
  };

  const renderNote = (note: Note) => (
    <div
      key={note.id}
      className={`group flex items-center justify-between px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer ${
        movingNoteId === note.id ? 'bg-blue-50 dark:bg-blue-900' : ''
      }`}
      onClick={() => {
        if (movingNoteId === note.id) {
          setMovingNoteId(null);
        } else if (movingNoteId) {
          moveNoteToFolder(movingNoteId, note.folder || null);
        } else {
          onSelectNote(note.id);
        }
      }}
    >
      <div className="flex items-center space-x-2 flex-1 min-w-0">
        <File className="h-4 w-4 text-gray-500 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium dark:text-gray-300 truncate">
            {note.title || 'Untitled Note'}
          </div>
          <div className="text-xs text-gray-500">
            {format(new Date(note.updatedAt), 'MMM d, yyyy')}
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMovingNoteId(note.id);
          }}
          className="hidden group-hover:block p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
          title="Move note"
        >
          <MoveRight className="h-4 w-4 text-gray-500" />
        </button>
        <button
          onClick={(e) => deleteNote(note.id, e)}
          className="hidden group-hover:block p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
          title="Delete note"
        >
          <Trash className="h-4 w-4 text-gray-500" />
        </button>
      </div>
    </div>
  );

  const deleteNote = async (noteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this note?')) {
      try {
        const noteRef = ref(database, `users/${userId}/notes/${noteId}`);
        await remove(noteRef);
        toast.success('Note deleted');
      } catch (error) {
        toast.error('Failed to delete note');
      }
    }
  };

  const deleteFolder = async (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this folder and all its notes?')) {
      try {
        const folderRef = ref(database, `users/${userId}/folders/${folderId}`);
        await remove(folderRef);
        
        // Move notes to root instead of deleting them
        notes.forEach(async (note) => {
          if (note.folder === folderId) {
            const noteRef = ref(database, `users/${userId}/notes/${note.id}`);
            await update(noteRef, {
              folder: null,
              updatedAt: new Date().toISOString(),
            });
          }
        });
        
        setActiveFolder(null);
        toast.success('Folder deleted');
      } catch (error) {
        toast.error('Failed to delete folder');
      }
    }
  };

  const sidebarClasses = `
    fixed inset-y-0 left-0 z-30 w-72 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 
    transform transition-transform duration-300 ease-in-out
    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    md:relative md:translate-x-0
  `;

  return (
    <>
      <div className={sidebarClasses}>
        <div className="h-full flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={createNewNote}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm"
            >
              <Plus className="h-4 w-4" />
              <span>New Note</span>
            </button>
          </div>

          <div className="flex-1 overflow-auto">
            <div className="p-2">
              <button
                onClick={createNewFolder}
                className="flex items-center space-x-2 px-3 py-2 w-full text-left text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
              >
                <Folder className="h-4 w-4" />
                <span>New Folder</span>
              </button>

              {folders.map((folder) => (
                <div key={folder.id} className="mt-1">
                  <div
                    className={`group px-3 py-2 rounded-md cursor-pointer ${
                      activeFolder === folder.id ? 'bg-gray-200 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                    onClick={() => {
                      if (movingNoteId) {
                        moveNoteToFolder(movingNoteId, folder.id);
                      } else {
                        setActiveFolder(folder.id);
                        toggleFolder(folder.id);
                      }
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {expandedFolders.has(folder.id) ? (
                          <ChevronDown className="h-4 w-4 text-gray-500" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-500" />
                        )}
                        <Folder className="h-4 w-4 text-gray-500" />
                        <span className="text-sm dark:text-gray-300">{folder.name}</span>
                      </div>
                      <button
                        onClick={(e) => deleteFolder(folder.id, e)}
                        className="hidden group-hover:block p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                      >
                        <Trash className="h-4 w-4 text-gray-500" />
                      </button>
                    </div>
                  </div>

                  {expandedFolders.has(folder.id) && (
                    <div className="ml-6">
                      {notes
                        .filter((note) => note.folder === folder.id)
                        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                        .map(renderNote)}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="p-2">
              <div className="text-xs uppercase text-gray-500 dark:text-gray-400 px-3 py-2">
                Uncategorized Notes
              </div>
              {notes
                .filter((note) => !note.folder)
                .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                .map(renderNote)}
            </div>
          </div>
        </div>
      </div>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={onClose}
        ></div>
      )}
    </>
  );
}