'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import API_URL from '@/config/api';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // パスワード確認
    if (password !== confirmPassword) {
      alert('パスワードが一致しません');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      alert('パスワードは6文字以上にしてください');
      setIsLoading(false);
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
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
        alert(`登録エラー: ${errorData.detail || '登録に失敗しました'}`);
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
            アカウントを作成して知識を探検
          </p>
        </div>

        {/* サインアップフォーム */}
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
                placeholder="•••••••••"
                required
                minLength={6}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-2">
                パスワード確認
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 bg-input border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent-foreground focus:border-transparent transition-all"
                placeholder="•••••••••"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-accent-foreground focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isLoading ? '登録中...' : 'アカウント作成'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              すでにアカウントをお持ちの場合{' '}
              <button 
                onClick={() => router.push('/')}
                className="text-accent-foreground hover:underline font-medium"
              >
                ログイン
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
