import path from 'node:path'

import { executeDriveDocImport } from '../lib/docs/neon-rabbit-drive-import'

async function main() {
  const sourceRoot = process.argv[2]
  const repoRoot = process.cwd()

  if (!sourceRoot) {
    throw new Error('Usage: npx tsx scripts/import-neon-rabbit-drive-docs.ts "H:\\My Drive\\Neon Rabbit"')
  }

  const manifest = await executeDriveDocImport(sourceRoot, repoRoot)
  const manifestPath = path.join(repoRoot, 'docs', 'drive-import', 'manifest.json')

  console.log(
    `Imported ${manifest.importedCount} Markdown files from ${sourceRoot} into ${path.dirname(manifestPath)}.`,
  )
  console.log(`Manifest: ${manifestPath}`)
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(message)
  process.exitCode = 1
})
