'use client';

import { useState, useEffect } from 'react';
import API_URL from '@/config/api';

interface Document {
  id: number;
  title: string;
  created_at: string;
}

interface DocumentListProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DocumentList({ isOpen, onClose }: DocumentListProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchDocuments();
    }
  }, [isOpen]);

  const fetchDocuments = async () => {
    setLoading(true);
    setError('');

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      if (!token) {
        setError('認証トークンがありません');
        return;
      }

      const response = await fetch(`${API_URL}/documents`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      } else if (response.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
        }
        setError('認証が切れました');
      } else {
        setError('ドキュメントの取得に失敗しました');
      }
    } catch (error) {
      setError(`接続エラー: ${error instanceof Error ? error.message : '不明なエラー'}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteDocument = async (documentId: number) => {
    if (!confirm('このドキュメントを削除してもよろしいですか？')) {
      return;
    }

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      if (!token) {
        setError('認証トークンがありません');
        return;
      }

      const response = await fetch(`${API_URL}/documents/${documentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setDocuments(documents.filter(doc => doc.id !== documentId));
      } else {
        setError('ドキュメントの削除に失敗しました');
      }
    } catch (error) {
      setError(`接続エラー: ${error instanceof Error ? error.message : '不明なエラー'}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-background border rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">アップロード済みファイル</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>

        {loading && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}

        {error && (
          <div className="bg-destructive/10 border border-destructive text-destructive p-3 rounded-md mb-4">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="flex-1 overflow-y-auto">
            {documents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                アップロードされたファイルがありません
              </div>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 border rounded-md hover:bg-accent/50"
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{doc.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date(doc.created_at).toLocaleString('ja-JP')}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteDocument(doc.id)}
                      className="ml-2 text-destructive hover:text-destructive/80 px-2 py-1 text-sm"
                    >
                      削除
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
