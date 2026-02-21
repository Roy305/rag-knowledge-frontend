// API URL設定
const API_URL = process.env.NEXT_PUBLIC_API_URL || 
  (typeof window !== 'undefined' && window.location.hostname === 'localhost' 
    ? 'http://127.0.0.1:8000' 
    : 'https://rag-knowledge-api.onrender.com');

export default API_URL;
