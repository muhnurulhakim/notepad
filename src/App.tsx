import React, { useEffect, useState } from 'react';
import { auth, googleProvider } from './lib/firebase';
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword 
} from 'firebase/auth';
import { LogIn, LogOut, FileText, Menu } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import Editor from './components/Editor';
import Sidebar from './components/Sidebar';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
        toast.success('Account created successfully!');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success('Signed in successfully!');
      }
      setShowAuthModal(false);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success('Welcome to Notepad Kreator!');
    } catch (error) {
      toast.error('Failed to sign in');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success('Signed out successfully');
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <Toaster position="top-right" />
        
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="p-2 hover:bg-gray-100 rounded-md md:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>
              <FileText className="h-6 w-6 text-blue-500" />
              <h1 className="text-xl font-semibold hidden sm:block">Notepad Kreator</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-4">
                  <img
                    src={user.photoURL || `https://ui-avatars.com/api/?name=${user.email}`}
                    alt={user.email || 'User'}
                    className="h-8 w-8 rounded-full"
                  />
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="hidden sm:inline">Sign Out</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors text-sm"
                  >
                    Email Sign In
                  </button>
                  <button
                    onClick={handleGoogleLogin}
                    className="flex items-center space-x-2 px-4 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 transition-colors text-sm"
                  >
                    <LogIn className="h-4 w-4" />
                    <span className="hidden sm:inline">Sign in with Google</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {showAuthModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">
                {isSignUp ? 'Create Account' : 'Sign In'}
              </h2>
              <form onSubmit={handleEmailAuth} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  {isSignUp ? 'Sign Up' : 'Sign In'}
                </button>
              </form>
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="w-full text-sm text-blue-500 mt-4"
              >
                {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
              </button>
              <button
                onClick={() => setShowAuthModal(false)}
                className="absolute top-2 right-2 p-2 text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {user ? (
          <div className="flex h-[calc(100vh-4rem)]">
            <Sidebar 
              userId={user.uid} 
              onSelectNote={setActiveNoteId} 
              isOpen={showSidebar}
              onClose={() => setShowSidebar(false)}
            />
            <Editor userId={user.uid} noteId={activeNoteId} />
          </div>
        ) : (
          <div className="max-w-2xl mx-auto mt-20 text-center px-4">
            <h2 className="text-3xl font-bold mb-4">
              Welcome to Notepad Kreator
            </h2>
            <p className="text-gray-600 mb-8">
              A modern, minimalist notepad for creators. Sign in to start creating and organizing your notes.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
