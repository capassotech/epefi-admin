import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import crypto, { createHash } from 'node:crypto'
import type { BinaryLike, BinaryToTextEncoding } from 'node:crypto'

type HashFunction = (
  algorithm: string,
  data: BinaryLike,
  encoding?: BinaryToTextEncoding,
) => string | Buffer

const cryptoWithHash = crypto as unknown as { hash?: HashFunction }

if (typeof cryptoWithHash.hash !== 'function') {
  cryptoWithHash.hash = (algorithm, data, encoding) => {
    const hash = createHash(algorithm)
    hash.update(data)
    return encoding ? hash.digest(encoding) : hash.digest()
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
