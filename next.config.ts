import type { NextConfig } from 'next'
import path from 'path'
import fs from 'fs'

// When running from a worktree the resolved __dirname may not contain
// node_modules. Walk up until we find a directory that has next installed.
function findProjectRoot(dir: string): string {
  if (fs.existsSync(path.join(dir, 'node_modules', 'next', 'package.json'))) {
    return dir
  }
  const parent = path.dirname(dir)
  if (parent === dir) return dir // reached filesystem root — give up
  return findProjectRoot(parent)
}

const nextConfig: NextConfig = {
  turbopack: {
    root: findProjectRoot(path.resolve(__dirname)),
  },
}

export default nextConfig
