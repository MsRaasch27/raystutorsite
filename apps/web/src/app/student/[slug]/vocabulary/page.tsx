"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type VocabularyWord = {
  id: string;
  english: string;
  [key: string]: string | undefined; // For native language field (dynamic key)
  example: string;
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
  const [editingWord, setEditingWord] = useState<VocabularyWord | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newWord, setNewWord] = useState({ english: "", example: "" });

  useEffect(() => {
    fetchUserAndVocabulary();
  }, [userId]);

  const fetchUserAndVocabulary = async () => {
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
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleAddWord = async () => {
    if (!newWord.english.trim()) return;

    try {
      const response = await fetch(`/api/users/${encodeURIComponent(userId)}/vocabulary`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          english: newWord.english,
          example: newWord.example,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add vocabulary word");
      }

      const addedWord = await response.json();
      setVocabulary([...vocabulary, addedWord]);
      setNewWord({ english: "", example: "" });
      setShowAddForm(false);
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

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p className="font-bold">Error</p>
            <p>{error}</p>
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

        {/* Add New Word Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Add New Vocabulary</h2>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              {showAddForm ? "Cancel" : "+ Add Word"}
            </button>
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Example Sentence
                  </label>
                  <input
                    type="text"
                    value={newWord.example}
                    onChange={(e) => setNewWord({ ...newWord, example: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    placeholder="Enter example sentence"
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
                          <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">
                              Example
                            </label>
                            <p className="text-sm text-gray-600 italic">{word.example}</p>
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
    example: word.example,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Only send english and example - backend will handle translation
    onSave({
      english: formData.english,
      example: formData.example,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Example Sentence
          </label>
          <input
            type="text"
            value={formData.example}
            onChange={(e) => setFormData({ ...formData, example: e.target.value })}
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
