import React, { useState, useEffect, useCallback } from 'react';
import { ref, set, onValue } from 'firebase/database';
import { database } from '../lib/firebase';
import ReactMarkdown from 'react-markdown';
import { jsPDF } from 'jspdf';
import { saveAs } from 'file-saver';
import { Download, Save } from 'lucide-react';
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
      <div className="border-b border-gray-200 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder="Note title"
            className="text-xl font-semibold bg-transparent border-none focus:outline-none"
          />
          <button
            onClick={() => setIsPreview(!isPreview)}
            className="px-3 py-1 rounded text-sm bg-gray-100 hover:bg-gray-200"
          >
            {isPreview ? 'Edit' : 'Preview'}
          </button>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={exportToPDF}
            className="flex items-center space-x-1 px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
          >
            <Download className="h-4 w-4" />
            <span>PDF</span>
          </button>
          <button
            onClick={exportToTXT}
            className="flex items-center space-x-1 px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
          >
            <Download className="h-4 w-4" />
            <span>TXT</span>
          </button>
        </div>
      </div>

      <div className="p-4 h-[calc(100vh-8rem)] overflow-auto">
        {isPreview ? (
          <div className="prose max-w-none">
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
    </div>
  );
}