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

  // ... previous hooks remain the same ...

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
      <div className="border-b border-gray-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between">
        <div className="flex-1 sm:flex sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder="Note title"
            className="w-full sm:w-auto text-xl font-semibold bg-transparent border-b-2 border-gray-300 focus:border-blue-500 transition-all duration-200 ease-in-out focus:outline-none"
          />
          <button
            onClick={() => setIsPreview(!isPreview)}
            className="w-full sm:w-auto px-3 py-2 rounded text-sm bg-gray-100 hover:bg-gray-200"
          >
            {isPreview ? 'Edit' : 'Preview'}
          </button>
        </div>

        <div className="flex mt-4 sm:mt-0 sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <button
            onClick={exportToPDF}
            className="w-full sm:w-auto flex items-center justify-center space-x-1 px-2 py-1 sm:px-3 sm:py-2 rounded bg-gray-100 hover:bg-gray-200 text-xs sm:text-sm"
          >
            <Download className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>PDF</span>
          </button>
          <button
            onClick={exportToTXT}
            className="w-full sm:w-auto flex items-center justify-center space-x-1 px-2 py-1 sm:px-3 sm:py-2 rounded bg-gray-100 hover:bg-gray-200 text-xs sm:text-sm"
          >
            <Download className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>TXT</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 h-[calc(100vh-12rem)] overflow-auto">
        {isPreview ? (
          <div className="prose max-w-full break-words whitespace-pre-wrap">
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
