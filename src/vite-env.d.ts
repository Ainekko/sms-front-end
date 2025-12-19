/// <reference types="vite/client" />

/**
 * Type definitions for environment variables.
 * 
 * This file extends Vite's ImportMetaEnv interface to include
 * our custom environment variables.
 * 
 * Environment variables must be prefixed with VITE_ to be
 * accessible in the browser.
 */

interface ImportMetaEnv {
    /**
     * Base URL for the REST API
     * Example: 'http://localhost:8000' or 'http://127.0.0.1:5000'
     */
    readonly VITE_API_BASE_URL?: string;

    /**
     * Base URL for WebSocket connections
     * Example: 'ws://localhost:8000/ws' or 'ws://127.0.0.1:5000/ws'
     */
    readonly VITE_WS_BASE_URL?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
