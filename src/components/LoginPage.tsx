'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import API_URL from '@/config/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // すでにログインしている場合はチャット画面にリダイレクト
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token) {
        router.push('/chat');
      }
    }
  }, [router]);

  const handleDemoLogin = () => {
    // デモ用：簡単なログイン
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', 'demo-token');
      router.push('/chat');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // デバッグ用：API URLを確認
    console.log("API URL:", process.env.NEXT_PUBLIC_API_URL);
    
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // JWTトークンをlocalStorageに保存
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_token', data.access_token);
        }
        router.push('/chat');
      } else {
        const errorData = await response.json();
        alert(`ログインエラー: ${errorData.detail || '認証に失敗しました'}`);
      }
    } catch (error) {
      alert(`接続エラー: ${error instanceof Error ? error.message : '不明なエラー'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* ヘッダー */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            RAG Knowledge
          </h1>
          <p className="text-muted-foreground">
            AI チャットで知識を探検
          </p>
        </div>

        {/* ログインフォーム */}
        <div className="bg-accent/50 backdrop-blur-sm rounded-2xl border border-border p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                メールアドレス
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-input border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent-foreground focus:border-transparent transition-all"
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                パスワード
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-input border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent-foreground focus:border-transparent transition-all"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-accent-foreground focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isLoading ? 'ログイン中...' : 'ログイン'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              アカウントをお持ちでない場合{' '}
              <button 
                onClick={() => router.push('/signup')}
                className="text-accent-foreground hover:underline font-medium"
              >
                サインアップ
              </button>
            </p>
          </div>
        </div>

        {/* デモ用の注意書き */}
        <div className="text-center space-y-2">
          <p className="text-xs text-muted-foreground">
            デモ用：簡単に試すには↓
          </p>
          <button
            onClick={handleDemoLogin}
            className="px-4 py-2 text-xs bg-muted border border-border rounded-lg hover:bg-accent/50 transition-colors"
          >
            🚀 デモログイン（スキップ）
          </button>
        </div>
      </div>
    </div>
  );
}
