import React, { useState, useEffect } from 'react';
import { ref, onValue, push, remove, set } from 'firebase/database';
import { database } from '../lib/firebase';
import { Plus, Folder, File, Trash } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface SidebarProps {
  userId: string;
  onSelectNote: (noteId: string) => void;
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

export default function Sidebar({ userId, onSelectNote }: SidebarProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [activeFolder, setActiveFolder] = useState<string | null>(null);

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

  const deleteNote = async (noteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const noteRef = ref(database, `users/${userId}/notes/${noteId}`);
      await remove(noteRef);
      toast.success('Note deleted');
    } catch (error) {
      toast.error('Failed to delete note');
    }
  };

  const createNewFolder = async () => {
    const folderName = prompt('Enter folder name:');
    if (folderName) {
      try {
        const foldersRef = ref(database, `users/${userId}/folders`);
        await push(foldersRef, {
          name: folderName,
        });
        toast.success('Folder created');
      } catch (error) {
        toast.error('Failed to create folder');
      }
    }
  };

  const deleteFolder = async (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const folderRef = ref(database, `users/${userId}/folders/${folderId}`);
      await remove(folderRef);
      
      // Remove folder reference from notes in this folder
      notes.forEach(async (note) => {
        if (note.folder === folderId) {
          const noteRef = ref(database, `users/${userId}/notes/${note.id}`);
          await set(noteRef, {
            ...note,
            folder: null,
          });
        }
      });
      
      setActiveFolder(null);
      toast.success('Folder deleted');
    } catch (error) {
      toast.error('Failed to delete folder');
    }
  };

  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <button
          onClick={createNewNote}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>New Note</span>
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="p-2">
          <button
            onClick={createNewFolder}
            className="flex items-center space-x-2 px-3 py-2 w-full text-left text-sm text-gray-600 hover:bg-gray-100 rounded-md"
          >
            <Folder className="h-4 w-4" />
            <span>New Folder</span>
          </button>

          {folders.map((folder) => (
            <div
              key={folder.id}
              className={`group mt-1 px-3 py-2 rounded-md cursor-pointer ${
                activeFolder === folder.id ? 'bg-gray-200' : 'hover:bg-gray-100'
              }`}
              onClick={() => setActiveFolder(folder.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Folder className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{folder.name}</span>
                </div>
                <button
                  onClick={(e) => deleteFolder(folder.id, e)}
                  className="hidden group-hover:block p-1 hover:bg-gray-200 rounded"
                >
                  <Trash className="h-4 w-4 text-gray-500" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="p-2">
          {notes
            .filter((note) => (!activeFolder && !note.folder) || note.folder === activeFolder)
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
            .map((note) => (
              <div
                key={note.id}
                className="group flex items-center justify-between px-3 py-2 rounded-md hover:bg-gray-100 cursor-pointer"
                onClick={() => onSelectNote(note.id)}
              >
                <div className="flex items-center space-x-2">
                  <File className="h-4 w-4 text-gray-500" />
                  <div>
                    <div className="text-sm font-medium">{note.title || 'Untitled Note'}</div>
                    <div className="text-xs text-gray-500">
                      {format(new Date(note.updatedAt), 'MMM d, yyyy')}
                    </div>
                  </div>
                </div>
                <button
                  onClick={(e) => deleteNote(note.id, e)}
                  className="hidden group-hover:block p-1 hover:bg-gray-200 rounded"
                >
                  <Trash className="h-4 w-4 text-gray-500" />
                </button>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}