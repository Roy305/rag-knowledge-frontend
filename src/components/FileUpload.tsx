'use client';

import { useState, useRef } from 'react';
import API_URL from '@/config/api';

interface FileUploadProps {
  onUploadSuccess: (filename: string) => void;
  onUploadError: (error: string) => void;
}

export default function FileUpload({ onUploadSuccess, onUploadError }: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    // ファイルタイプチェック
    const validTypes = [
      'text/plain',
      'text/csv',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    const validExtensions = ['.txt', '.csv', '.pdf', '.doc', '.docx'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
      onUploadError('対応ファイル形式: .txt, .csv, .pdf, .doc, .docx');
      return;
    }

    // ファイルサイズチェック（1MB）
    if (file.size > 1_000_000) {
      onUploadError('ファイルサイズは1MB以下にしてください');
      return;
    }

    setIsUploading(true);

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        onUploadError('認証トークンがありません。再度ログインしてください。');
        return;
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_URL}/documents/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        onUploadSuccess(data.title || file.name);
      } else if (response.status === 401) {
        localStorage.removeItem('auth_token');
        onUploadError('認証が切れました。再度ログインしてください。');
      } else {
        const errorData = await response.json();
        onUploadError(errorData.detail || 'アップロードに失敗しました');
      }
    } catch (error) {
      onUploadError(`接続エラー: ${error instanceof Error ? error.message : '不明なエラー'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive
            ? 'border-accent-foreground bg-accent/20'
            : 'border-border hover:border-muted-foreground'
        } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.csv,.pdf,.doc,.docx"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading}
        />

        <div className="space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-accent/50 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>

          <div>
            <p className="text-foreground font-medium">
              {isUploading ? 'アップロード中...' : 'ファイルをドラッグ＆ドロップ'}
            </p>
            <p className="text-muted-foreground text-sm mt-1">
              または
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-accent-foreground hover:underline ml-1"
                disabled={isUploading}
              >
                ファイルを選択
              </button>
            </p>
          </div>

          <div className="text-xs text-muted-foreground">
            <p>対応形式: .txt, .csv, .pdf, .doc, .docx</p>
            <p>最大サイズ: 1MB</p>
          </div>
        </div>
      </div>
    </div>
  );
}
