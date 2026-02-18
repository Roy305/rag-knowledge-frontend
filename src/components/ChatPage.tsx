'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import API_URL from '@/config/api';
import FileUpload from '@/components/FileUpload';

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
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'こんにちは！私はRAG Knowledgeアシスタントです。どのようなことでもお尋ねください。',
      sender: 'assistant',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const router = useRouter();

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
      <header className="bg-accent/50 backdrop-blur-sm border-b border-border px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">RAG Knowledge</h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowUpload(!showUpload)}
              className="px-4 py-2 text-sm bg-accent text-foreground rounded-lg hover:bg-accent/80 transition-colors"
            >
              📁 ファイル追加
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
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
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] px-4 py-3 rounded-2xl ${
                    message.sender === 'user'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                      : 'bg-accent/50 text-foreground border border-border'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  <p className={`text-xs mt-2 ${
                    message.sender === 'user' ? 'text-blue-100' : 'text-muted-foreground'
                  }`}>
                    {message.timestamp.toLocaleTimeString('ja-JP')}
                  </p>
                  {/* ソース情報表示 */}
                  {message.sender === 'assistant' && message.sources && (
                    <div className="mt-3 pt-2 border-t border-border/50">
                      <p className="text-xs text-muted-foreground mb-1">📄 参照資料:</p>
                      <div className="space-y-1">
                        {message.sources.map((source, index) => (
                          <p key={index} className="text-xs text-accent-foreground hover:underline cursor-pointer" title={source.content}>
                            • {source.title}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-accent/50 text-foreground border border-border px-4 py-3 rounded-2xl">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-foreground rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
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
