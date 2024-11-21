import React, { useState, useEffect, useCallback } from 'react';
import { ref, set, onValue } from 'firebase/database';
import { database } from '../lib/firebase';
import ReactMarkdown from 'react-markdown';
import { jsPDF } from 'jspdf';
import { saveAs } from 'file-saver';
import { Download } from 'lucide-react';
import { debounce } from '../utils/debounce';
import toast from 'react-hot-toast';

interface EditorProps {
  userId: string;
  noteId: string | null;
}

export default function Editor({ userId, noteId }: EditorProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPreview, setIsPreview] = useState(false);
  const [showExportButtons, setShowExportButtons] = useState(true); // Add state to control export buttons visibility

  useEffect(() => {
    if (!noteId) return;

    const noteRef = ref(database, `users/${userId}/notes/${noteId}`);
    const unsubscribe = onValue(noteRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setTitle(data.title);
        setContent(data.content);
      }
    });

    return () => {
      // Firebase will handle unsubscribe
    };
  }, [userId, noteId]);

  const saveNote = useCallback(
    debounce(async (noteData: any) => {
      if (!noteId) return;

      try {
        const noteRef = ref(database, `users/${userId}/notes/${noteId}`);
        await set(noteRef, {
          ...noteData,
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
      <div className="flex-1 bg-white flex items-center justify-center text-gray-500">
        Select a note or create a new one
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 p-4 flex flex-col">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full">
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder="Note title"
            className="w-full sm:w-auto text-xl font-semibold bg-transparent border-b-2 border-gray-300 focus:border-blue-500 transition-all duration-200 ease-in-out focus:outline-none mb-2 sm:mb-0"
          />
          <div className="flex flex-col sm:flex-row sm:items-center w-full sm:w-auto mt-2 sm:mt-0 space-y-2 sm:space-y-0 sm:space-x-2">
            <button
              onClick={() => setIsPreview(!isPreview)}
              className="w-full sm:w-auto px-3 py-2 rounded text-sm bg-gray-100 hover:bg-gray-200"
            >
              {isPreview ? 'Edit' : 'Preview'}
            </button>
            <div className="flex justify-end space-x-2">
              <button
                onClick={exportToPDF}
                className="w-20 h-10 flex items-center justify-center space-x-1 rounded bg-gray-100 hover:bg-gray-200 text-xs"
              >
                <Download className="h-4 w-4" />
                <span>PDF</span>
              </button>
              <button
                onClick={exportToTXT}
                className="w-20 h-10 flex items-center justify-center space-x-1 rounded bg-gray-100 hover:bg-gray-200 text-xs"
              >
                <Download className="h-4 w-4" />
                <span>TXT</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4 h-[calc(100vh-12rem)] overflow-auto max-w-full">
        {isPreview ? (
          <div className="prose max-w-full w-full overflow-x-hidden">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        ) : (
          <textarea
            value={content}
            onChange={handleContentChange}
            placeholder="Start writing in markdown..."
            className="w-full h-full resize-none bg-transparent border-none focus:outline-none font-mono"
          />
        )}
      </div>

      {/* Footer */}
      <footer className="text-center p-4 text-sm text-gray-500 border-t border-gray-200">
        Copyright © 2024 - All rights reserved.<br />
        Built by Muh. Nurul Hakim.
      </footer>
    </div>
  );
}
