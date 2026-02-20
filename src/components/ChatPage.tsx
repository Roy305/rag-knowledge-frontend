'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import API_URL from '@/config/api';
import FileUpload from './FileUpload';
import DocumentList from './DocumentList';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  sources?: Array<{
    document_id: number;
    title: string;
    content: string;
    distance: number;
  }>;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [showDocumentList, setShowDocumentList] = useState(false);
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 認証チェックとトークン取得
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/');
        return;
      }
    }
  }, [router]);

  // デモモード検出
  const isDemoMode = typeof window !== 'undefined' && localStorage.getItem('auth_token') === 'demo-token';

  // 通知表示
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleUploadSuccess = (filename: string) => {
    if (isDemoMode) {
      setNotification({
        type: 'error',
        message: '❌ デモモードではファイルアップロードできません'
      });
      return;
    }
    setNotification({
      type: 'success',
      message: `✅ ${filename} をアップロードしました`
    });
    setShowUpload(false);
  };

  const handleUploadError = (error: string) => {
    setNotification({
      type: 'error',
      message: `❌ ${error}`
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // デバッグ用：API URLを確認
    console.log("API URL:", process.env.NEXT_PUBLIC_API_URL);

    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) {
      router.push('/');
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // デモモードの場合はダミー応答
    if (isDemoMode) {
      setTimeout(() => {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: `「${input}」について理解しました。\n\nこれはデモモードです。実際にRAG検索を試すには、サインアップしてファイルをアップロードしてください。`,
          sender: 'assistant',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMessage]);
        setIsLoading(false);
      }, 1000);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          query: input,
          top_k: 3 
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: data.answer || '回答を取得できませんでした。',
          sender: 'assistant',
          timestamp: new Date(),
          sources: (data.sources && data.sources.length > 0) ? data.sources : undefined
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else if (response.status === 401) {
        // トークンが無効な場合はログイン画面にリダイレクト
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
        }
        router.push('/');
      } else {
        const errorData = await response.json();
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: `エラー: ${errorData.detail || 'API呼び出しに失敗しました'}`,
          sender: 'assistant',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `接続エラー: ${error instanceof Error ? error.message : '不明なエラー'}`,
        sender: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ヘッダー */}
      <header className="bg-accent/50 border-b border-border p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-foreground">RAGチャット</h1>
            <button
              onClick={() => setShowDocumentList(true)}
              className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              📄 ファイル確認
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowUpload(true)}
              className="px-3 py-1 text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
            >
              📁 アップロード
            </button>
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('auth_token');
                }
                router.push('/');
              }}
              className="px-3 py-1 text-sm bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90"
            >
              ログアウト
            </button>
          </div>
        </div>
      </header>

      {/* 通知 */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg border ${
          notification.type === 'success' 
            ? 'bg-green-900/80 border-green-700 text-green-100' 
            : 'bg-red-900/80 border-red-700 text-red-100'
        } backdrop-blur-sm`}>
          <p className="text-sm font-medium">{notification.message}</p>
        </div>
      )}

      {/* ファイル一覧モーダル */}
      {showDocumentList && (
        <DocumentList
          isOpen={showDocumentList}
          onClose={() => setShowDocumentList(false)}
        />
      )}

      {/* ファイルアップロードモーダル */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4">
          <div className="bg-accent/90 border border-border rounded-2xl p-6 max-w-lg w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground">ファイルアップロード</h2>
              <button
                onClick={() => setShowUpload(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>
            <FileUpload
              onUploadSuccess={handleUploadSuccess}
              onUploadError={handleUploadError}
            />
          </div>
        </div>
      )}

      {/* チャットエリア */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-6">
        <div className="h-full flex flex-col">
          {/* メッセージリスト */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} mb-6`}
              >
                <div className="flex flex-col max-w-[75%]">
                  <div
                    className={`relative px-5 py-4 rounded-2xl shadow-lg backdrop-blur-sm ${
                      message.sender === 'user'
                        ? 'bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white shadow-blue-500/25'
                        : 'bg-white/90 dark:bg-gray-800/90 text-foreground border border-gray-200/50 dark:border-gray-700/50 shadow-gray-500/10'
                    }`}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    {/* ソース情報表示 - 高級デザイン */}
                    {message.sender === 'assistant' && message.sources && (
                      <div className="mt-4 pt-3 border-t border-gray-200/50 dark:border-gray-700/50">
                        <div className="flex items-center mb-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium">
                            📄 参照資料
                          </span>
                        </div>
                        <div className="grid gap-2">
                          {message.sources.map((source, index) => (
                            <div
                              key={index}
                              className="flex items-start p-2 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200/50 dark:border-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                              title={source.content}
                            >
                              <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 mr-2 flex-shrink-0"></span>
                              <span className="text-xs text-gray-700 dark:text-gray-300 truncate">
                                {source.title}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {/* 時間表示 - 高級デザイン */}
                  <div className={`flex items-center mt-2 space-x-2 text-xs ${
                    message.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}>
                    <span className={`${
                      message.sender === 'user' 
                        ? 'text-blue-600 dark:text-blue-400' 
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {message.timestamp.toLocaleTimeString('ja-JP', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    <span className={`${
                      message.sender === 'user' 
                        ? 'text-blue-500 dark:text-blue-500/50' 
                        : 'text-gray-400 dark:text-gray-500'
                    }`}>
                      {message.timestamp.toLocaleDateString('ja-JP', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white/90 dark:bg-gray-800/90 text-foreground border border-gray-200/50 dark:border-gray-700/50 px-5 py-4 rounded-2xl shadow-lg backdrop-blur-sm">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">思考中...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 入力フォーム */}
          <form onSubmit={handleSubmit} className="flex space-x-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 px-4 py-3 bg-input border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent-foreground focus:border-transparent transition-all"
              placeholder="メッセージを入力..."
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-accent-foreground focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              送信
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
