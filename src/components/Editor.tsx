import React, { useState, useEffect, useCallback } from 'react';
import { ref, set, onValue, get } from 'firebase/database';
import { database } from '../lib/firebase';
import ReactMarkdown from 'react-markdown';
import { jsPDF } from 'jspdf';
import { saveAs } from 'file-saver';
import { Download, Save, FileText } from 'lucide-react';
import { debounce } from '../utils/debounce';
import toast from 'react-hot-toast';
import { encryptData, decryptData } from '../utils/encryption';

interface EditorProps {
  userId: string;
  noteId: string | null;
}

export default function Editor({ userId, noteId }: EditorProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPreview, setIsPreview] = useState(false);

  useEffect(() => {
    if (!noteId) return;

    const fetchNote = async () => {
      try {
        const noteRef = ref(database, `users/${userId}/notes/${noteId}`);
        const snapshot = await get(noteRef);
        const data = snapshot.val();
        if (data) {
          setTitle(data.title || '');
          setContent(data.content ? decryptData(data.content) : '');
        }
      } catch (error) {
        toast.error('Failed to load note');
      }
    };

    fetchNote();

    const noteRef = ref(database, `users/${userId}/notes/${noteId}`);
    const unsubscribe = onValue(noteRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setTitle(data.title || '');
        setContent(data.content ? decryptData(data.content) : '');
      }
    });

    return () => unsubscribe();
  }, [userId, noteId]);

  const saveNote = useCallback(
    debounce(async (noteData: any) => {
      if (!noteId) return;
      
      try {
        const noteRef = ref(database, `users/${userId}/notes/${noteId}`);
        await set(noteRef, {
          ...noteData,
          content: encryptData(noteData.content),
          updatedAt: new Date().toISOString(),
        });
        toast.success('Note saved');
      } catch (error) {
        toast.error('Failed to save note');
      }
    }, 1000),
    [userId, noteId]
  );

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    saveNote({ title, content: newContent });
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    saveNote({ title: newTitle, content });
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text(title, 10, 10);
    doc.text(content, 10, 30);
    doc.save(`${title || 'note'}.pdf`);
    toast.success('Exported to PDF');
  };

  const exportToTXT = () => {
    const blob = new Blob([`${title}\n\n${content}`], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, `${title || 'note'}.txt`);
    toast.success('Exported to TXT');
  };

  if (!noteId) {
    return (
      <div className="flex-1 bg-white dark:bg-gray-800 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
        <FileText className="h-16 w-16 mb-4 text-gray-300 dark:text-gray-600" />
        <p>Select a note or create a new one</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white dark:bg-gray-800 flex flex-col">
      <div className="border-b border-gray-200 dark:border-gray-700 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder="Note title"
            className="text-lg sm:text-xl font-semibold bg-transparent border-none focus:outline-none w-full sm:w-auto dark:text-white"
          />
          <button
            onClick={() => setIsPreview(!isPreview)}
            className="px-3 py-1 rounded text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            {isPreview ? 'Edit' : 'Preview'}
          </button>
        </div>
        
        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          <button
            onClick={exportToPDF}
            className="flex items-center space-x-1 px-3 py-1 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
            title="Save as PDF"
          >
            <FilePdf className="h-4 w-4" />
            <span className="hidden sm:inline">PDF</span>
          </button>
          <button
            onClick={exportToTXT}
            className="flex items-center space-x-1 px-3 py-1 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
            title="Save as TXT"
          >
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">TXT</span>
          </button>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-auto">
        {isPreview ? (
          <div className="prose dark:prose-invert max-w-none">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        ) : (
          <textarea
            value={content}
            onChange={handleContentChange}
            placeholder="Start writing in markdown..."
            className="w-full h-full resize-none bg-transparent border-none focus:outline-none font-mono text-base sm:text-sm dark:text-white"
          />
        )}
      </div>

      <footer className="text-center p-4 text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
        Copyright © 2024 - All rights reserved.<br />
        Built by Muh. Nurul Hakim.
      </footer>
    </div>
  );
}
