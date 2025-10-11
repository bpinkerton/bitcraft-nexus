/**
 * Utilities for interacting with GitHub API
 */

import * as fs from 'fs';
import * as path from 'path';
import type { GitHubFileInfo } from '../types';

const GITHUB_API_BASE = 'https://api.github.com';
const FETCH_TIMEOUT = 10000; // 10 seconds

export interface DownloadProgress {
    totalFiles: number;
    downloadedFiles: number;
    currentFile: string;
}

/**
 * Fetch with timeout
 */
async function fetchWithTimeout(url: string, timeout = FETCH_TIMEOUT): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === 'AbortError') {
            throw new Error(`Request timed out after ${timeout}ms`);
        }
        throw error;
    }
}

/**
 * Fetch the latest commit SHA for a specific path in a repo/branch
 */
export async function fetchLatestCommitSHA(
    repo: string,
    branch: string,
    filePath: string
): Promise<string> {
    const url = `${GITHUB_API_BASE}/repos/${repo}/commits/${branch}?path=${encodeURIComponent(filePath)}`;

    const response = await fetchWithTimeout(url);

    if (!response.ok) {
        throw new Error(`Failed to fetch commit SHA: ${response.statusText}`);
    }

    const data = await response.json();
    return data.sha;
}

/**
 * Fetch contents of a directory from GitHub
 */
export async function fetchDirectoryContents(
    repo: string,
    branch: string,
    dirPath: string
): Promise<GitHubFileInfo[]> {
    const url = `${GITHUB_API_BASE}/repos/${repo}/contents/${encodeURIComponent(dirPath)}?ref=${branch}`;

    const response = await fetchWithTimeout(url);

    if (!response.ok) {
        throw new Error(`Failed to fetch directory contents: ${response.statusText}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [data];
}

/**
 * Download a file from GitHub
 */
async function downloadFile(url: string, destPath: string): Promise<void> {
    const response = await fetchWithTimeout(url, 30000); // Longer timeout for downloads

    if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`);
    }

    const content = await response.text();

    // Ensure directory exists
    const dir = path.dirname(destPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(destPath, content, 'utf-8');
}

/**
 * Count total files in a GitHub directory recursively
 */
async function countFiles(
    repo: string,
    branch: string,
    sourcePath: string
): Promise<number> {
    const items = await fetchDirectoryContents(repo, branch, sourcePath);
    let count = 0;

    for (const item of items) {
        if (item.type === 'file') {
            count++;
        } else if (item.type === 'dir') {
            count += await countFiles(repo, branch, item.path);
        }
    }

    return count;
}

/**
 * Recursively download a folder from GitHub with progress tracking
 */
async function downloadGitHubFolderRecursive(
    repo: string,
    branch: string,
    sourcePath: string,
    destPath: string,
    progress: { current: number; total: number; onProgress?: (downloaded: number, total: number, file: string) => void }
): Promise<void> {
    const items = await fetchDirectoryContents(repo, branch, sourcePath);

    for (const item of items) {
        const itemDestPath = path.join(destPath, item.name);

        if (item.type === 'file' && item.download_url) {
            await downloadFile(item.download_url, itemDestPath);
            progress.current++;
            if (progress.onProgress) {
                progress.onProgress(progress.current, progress.total, item.name);
            }
        } else if (item.type === 'dir') {
            fs.mkdirSync(itemDestPath, { recursive: true });
            await downloadGitHubFolderRecursive(
                repo,
                branch,
                item.path,
                itemDestPath,
                progress
            );
        }
    }
}

/**
 * Recursively download a folder from GitHub
 */
export async function downloadGitHubFolder(
    repo: string,
    branch: string,
    sourcePath: string,
    destPath: string,
    onProgress?: (downloaded: number, total: number, file: string) => void
): Promise<void> {
    // Clean up existing directory
    if (fs.existsSync(destPath)) {
        fs.rmSync(destPath, { recursive: true, force: true });
    }

    fs.mkdirSync(destPath, { recursive: true });

    // First, count total files
    const totalFiles = await countFiles(repo, branch, sourcePath);

    // Then download with progress tracking
    const progress = { current: 0, total: totalFiles, onProgress };
    await downloadGitHubFolderRecursive(repo, branch, sourcePath, destPath, progress);

    return Promise.resolve();
}

/**
 * Fetch file content from GitHub
 */
export async function fetchFileContent(
    repo: string,
    branch: string,
    filePath: string
): Promise<string> {
    const url = `${GITHUB_API_BASE}/repos/${repo}/contents/${encodeURIComponent(filePath)}?ref=${branch}`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.type !== 'file' || !data.download_url) {
        throw new Error('Not a file or download URL unavailable');
    }

    const fileResponse = await fetch(data.download_url);
    return fileResponse.text();
}
