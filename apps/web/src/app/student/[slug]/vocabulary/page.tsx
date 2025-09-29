"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type VocabularyWord = {
  id: string;
  english: string;
  [key: string]: string | undefined; // For native language field (dynamic key)
  createdAt: string;
  updatedAt: string;
};

type User = {
  id: string;
  name?: string | null;
  email: string;
  natLang?: string | null;
};

export default function VocabularyPage() {
  const params = useParams();
  const router = useRouter();
  const userId = decodeURIComponent(params.slug as string);
  
  const [user, setUser] = useState<User | null>(null);
  const [vocabulary, setVocabulary] = useState<VocabularyWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [criticalError, setCriticalError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingWord, setEditingWord] = useState<VocabularyWord | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showImportForm, setShowImportForm] = useState(false);
  const [newWord, setNewWord] = useState({ english: "" });
  const [importUrl, setImportUrl] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  const fetchUserAndVocabulary = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch user data
      const userResponse = await fetch(`/api/users/${encodeURIComponent(userId)}`);
      if (!userResponse.ok) {
        throw new Error("Failed to fetch user data");
      }
      const userData = await userResponse.json();
      setUser(userData);

      // Fetch vocabulary
      const vocabResponse = await fetch(`/api/users/${encodeURIComponent(userId)}/vocabulary`);
      if (!vocabResponse.ok) {
        throw new Error("Failed to fetch vocabulary");
      }
      const vocabData = await vocabResponse.json();
      setVocabulary(vocabData.words || []);
    } catch (err) {
      console.error("Error fetching data:", err);
      setCriticalError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUserAndVocabulary();
  }, [fetchUserAndVocabulary]);

  // Auto-dismiss notifications after 5 seconds
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  const handleAddWord = async () => {
    if (!newWord.english.trim()) return;

    try {
      setError(null);
      setSuccess(null);
      
      const response = await fetch(`/api/users/${encodeURIComponent(userId)}/vocabulary`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          english: newWord.english,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 409 && errorData.error === "duplicate") {
          setError(errorData.message || "This word already exists in your vocabulary");
          return;
        }
        throw new Error(errorData.message || "Failed to add vocabulary word");
      }

      const addedWord = await response.json();
      setVocabulary([...vocabulary, addedWord]);
      setNewWord({ english: "" });
      setShowAddForm(false);
      setSuccess(`Successfully added "${newWord.english}" to your vocabulary!`);
    } catch (err) {
      console.error("Error adding word:", err);
      setError(err instanceof Error ? err.message : "Failed to add word");
    }
  };

  const handleUpdateWord = async (wordId: string, updatedData: Partial<VocabularyWord>) => {
    try {
      const response = await fetch(`/api/users/${encodeURIComponent(userId)}/vocabulary/${wordId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) {
        throw new Error("Failed to update vocabulary word");
      }

      setVocabulary(vocabulary.map(word => 
        word.id === wordId ? { ...word, ...updatedData } : word
      ));
      setEditingWord(null);
    } catch (err) {
      console.error("Error updating word:", err);
      setError(err instanceof Error ? err.message : "Failed to update word");
    }
  };

  const handleDeleteWord = async (wordId: string) => {
    if (!confirm("Are you sure you want to delete this vocabulary word?")) return;

    try {
      const response = await fetch(`/api/users/${encodeURIComponent(userId)}/vocabulary/${wordId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete vocabulary word");
      }

      setVocabulary(vocabulary.filter(word => word.id !== wordId));
    } catch (err) {
      console.error("Error deleting word:", err);
      setError(err instanceof Error ? err.message : "Failed to delete word");
    }
  };

  const handleImportFromSheet = async () => {
    if (!importUrl.trim()) return;

    try {
      setIsImporting(true);
      setError(null);
      setSuccess(null);

      // Extract sheet ID from URL
      const sheetId = extractSheetIdFromUrl(importUrl.trim());
      if (!sheetId) {
        setError("Invalid Google Sheets URL. Please provide a valid Google Sheets link.");
        return;
      }

      const response = await fetch(`/api/users/${encodeURIComponent(userId)}/vocabulary/import`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sheetId: sheetId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to import vocabulary from spreadsheet");
      }

      const result = await response.json();
      
      // Refresh vocabulary list
      await fetchUserAndVocabulary();
      
      setImportUrl("");
      setShowImportForm(false);
      
      if (result.imported > 0) {
        setSuccess(`Successfully imported ${result.imported} new vocabulary words!${result.skipped > 0 ? ` (${result.skipped} duplicates skipped)` : ""}`);
      } else {
        setSuccess("No new vocabulary words were imported. All words may already exist in your vocabulary.");
      }
    } catch (err) {
      console.error("Error importing vocabulary:", err);
      setError(err instanceof Error ? err.message : "Failed to import vocabulary");
    } finally {
      setIsImporting(false);
    }
  };

  const extractSheetIdFromUrl = (url: string): string | null => {
    // Handle various Google Sheets URL formats
    const patterns = [
      /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/,
      /\/d\/([a-zA-Z0-9-_]+)/,
      /^([a-zA-Z0-9-_]+)$/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  };

  const getNativeLanguageValue = (word: VocabularyWord) => {
    // Find the native language field (it's dynamic based on user's native language)
    const nativeLangKey = user?.natLang || "nativeLanguage";
    return word[nativeLangKey] || "";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading vocabulary...</p>
        </div>
      </div>
    );
  }

  if (criticalError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p className="font-bold">Error</p>
            <p>{criticalError}</p>
          </div>
          <button
            onClick={() => router.back()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                📚 My Vocabulary
              </h1>
              <p className="text-gray-600">
                Manage your personal vocabulary collection
              </p>
            </div>
            <Link
              href={`/student/${encodeURIComponent(userId)}`}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Success/Error Notifications */}
        {success && (
          <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>{success}</span>
              </div>
              <button
                onClick={() => setSuccess(null)}
                className="text-green-500 hover:text-green-700 ml-2"
              >
                ×
              </button>
            </div>
          </div>
        )}
        
        {error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-red-500">⚠</span>
                <span>{error}</span>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-500 hover:text-red-700 ml-2"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Add New Word Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Add New Vocabulary</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setShowImportForm(!showImportForm)}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
              >
                {showImportForm ? "Cancel" : "📊 Import from Sheet"}
              </button>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                {showAddForm ? "Cancel" : "+ Add Word"}
              </button>
            </div>
          </div>

          {showAddForm && (
            <div className="border-t pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    English Word/Phrase
                  </label>
                  <input
                    type="text"
                    value={newWord.english}
                    onChange={(e) => setNewWord({ ...newWord, english: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    placeholder="Enter English word or phrase"
                  />
                </div>
              </div>
              <button
                onClick={handleAddWord}
                disabled={!newWord.english.trim()}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Add Vocabulary Word
              </button>
            </div>
          )}

          {showImportForm && (
            <div className="border-t pt-4">
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-800 mb-2">Import from Google Spreadsheet</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Import vocabulary words from a Google Spreadsheet. Your spreadsheet must have these columns:
                </p>
                <div className="bg-gray-50 p-3 rounded-lg mb-4">
                  <div className="text-sm font-mono text-gray-700">
                    <div className="grid grid-cols-2 gap-4 font-semibold border-b pb-1 mb-2">
                      <span>English</span>
                      <span>{user?.natLang || "Native Language"}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      • English column is required<br/>
                      • Native Language column is optional (will be auto-translated if empty)<br/>
                      • First row should contain headers
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Google Sheets URL or Sheet ID
                </label>
                <input
                  type="text"
                  value={importUrl}
                  onChange={(e) => setImportUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                  placeholder="https://docs.google.com/spreadsheets/d/1ABC... or just the Sheet ID"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Paste the full Google Sheets URL or just the Sheet ID
                </p>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={handleImportFromSheet}
                  disabled={!importUrl.trim() || isImporting}
                  className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isImporting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Importing...
                    </>
                  ) : (
                    <>
                      📊 Import Vocabulary
                    </>
                  )}
                </button>
                
                {isImporting && (
                  <div className="text-sm text-gray-600">
                    <div className="animate-pulse">Processing spreadsheet...</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Vocabulary List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Your Vocabulary ({vocabulary.length} words)
          </h2>

          {vocabulary.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No vocabulary words yet.</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Your First Word
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {vocabulary.map((word) => (
                <div key={word.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  {editingWord?.id === word.id ? (
                    <EditWordForm
                      word={word}
                      nativeLanguage={user?.natLang || "nativeLanguage"}
                      onSave={(updatedData) => handleUpdateWord(word.id, updatedData)}
                      onCancel={() => setEditingWord(null)}
                    />
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">
                              English
                            </label>
                            <p className="text-lg font-semibold text-gray-800">{word.english}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">
                              {user?.natLang || "Native Language"}
                            </label>
                            <p className="text-lg text-gray-700">{getNativeLanguageValue(word)}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => setEditingWord(word)}
                          className="bg-blue-100 text-blue-600 px-3 py-1 rounded hover:bg-blue-200 transition-colors text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteWord(word.id)}
                          className="bg-red-100 text-red-600 px-3 py-1 rounded hover:bg-red-200 transition-colors text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

type EditWordFormProps = {
  word: VocabularyWord;
  nativeLanguage: string;
  onSave: (data: Partial<VocabularyWord>) => void;
  onCancel: () => void;
};

function EditWordForm({ word, nativeLanguage, onSave, onCancel }: EditWordFormProps) {
  const [formData, setFormData] = useState({
    english: word.english,
    [nativeLanguage]: word[nativeLanguage] || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Only send english - backend will handle translation
    onSave({
      english: formData.english,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            English Word/Phrase
          </label>
          <input
            type="text"
            value={formData.english}
            onChange={(e) => setFormData({ ...formData, english: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {nativeLanguage}
          </label>
          <input
            type="text"
            value={formData[nativeLanguage]}
            onChange={(e) => setFormData({ ...formData, [nativeLanguage]: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
