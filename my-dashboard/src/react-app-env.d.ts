/// <reference types="react-scripts" />

// Vite style env typings (for BACKEND URL override in Dashboard)
interface ImportMetaEnv {
	readonly VITE_BACKEND_URL?: string;
}
interface ImportMeta {
	readonly env: ImportMetaEnv;
}
