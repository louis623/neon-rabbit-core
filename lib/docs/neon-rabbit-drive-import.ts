import { mkdir, readdir, readFile, stat, writeFile, copyFile } from 'node:fs/promises'
import path from 'node:path'

export type DriveDocImportPlan = {
  sourcePath: string
  relativeDestination: string
}

type ImportManifest = {
  generatedAt: string
  sourceRoot: string
  destinationRoot: string
  importedCount: number
  imports: DriveDocImportPlan[]
}

export function classifyDriveDoc(fileName: string, isArchive: boolean): string {
  const archivePrefix = isArchive ? 'archive/' : ''

  if (fileName.startsWith('SS_DesignKit_')) {
    return `${archivePrefix}sparkle-suite/design/${fileName}`
  }

  if (
    fileName.includes('Sparkle Suite') ||
    fileName.includes('Live Reveal Co-Pilot') ||
    fileName.includes('Live Reveal Copilot')
  ) {
    return `${archivePrefix}sparkle-suite/operations/${fileName}`
  }

  if (
    fileName.startsWith('SS_') &&
    (fileName.includes('Schema') || fileName.includes('Spec'))
  ) {
    return `${archivePrefix}sparkle-suite/specs/${fileName}`
  }

  if (
    fileName.startsWith('SS_') &&
    (fileName.includes('Knowledge_Base') ||
      fileName.includes('KB_') ||
      fileName.includes('Troubleshooting'))
  ) {
    return `${archivePrefix}sparkle-suite/knowledge-base/${fileName}`
  }

  if (
    fileName.startsWith('SS_') &&
    (fileName.includes('Research') || fileName.includes('Thumper'))
  ) {
    return `${archivePrefix}sparkle-suite/research/${fileName}`
  }

  if (fileName.startsWith('SS_')) {
    return `${archivePrefix}sparkle-suite/plans/${fileName}`
  }

  if (fileName.startsWith('HQ_')) {
    return `${archivePrefix}neon-rabbit/hq/${fileName}`
  }

  if (fileName.startsWith('RH_Research_')) {
    return `${archivePrefix}rabbit-hole/research/${fileName}`
  }

  if (fileName.startsWith('RH_')) {
    return `${archivePrefix}rabbit-hole/plans/${fileName}`
  }

  if (
    fileName.startsWith('L1_NR_') ||
    fileName === 'NR_Document_System_SOP.md' ||
    fileName.includes('Standing_Rules')
  ) {
    return `${archivePrefix}neon-rabbit/operations/${fileName}`
  }

  if (fileName.startsWith('VAC_')) {
    return `${archivePrefix}vac/${fileName}`
  }

  if (fileName === 'SKILL.md' || fileName.includes('Skill')) {
    return `${archivePrefix}skills/${fileName}`
  }

  if (fileName.includes('Cheat_Sheet')) {
    return `${archivePrefix}tooling/${fileName}`
  }

  if (fileName.includes('Open_Brain') || fileName.includes('open-brain')) {
    return `${archivePrefix}neon-rabbit/open-brain/${fileName}`
  }

  if (fileName.includes('Memory') || fileName.includes('Google_Drive_Structure')) {
    return `${archivePrefix}neon-rabbit/memory/${fileName}`
  }

  if (fileName.startsWith('NR_')) {
    return `${archivePrefix}neon-rabbit/plans/${fileName}`
  }

  return `${archivePrefix}misc/${fileName}`
}

export function planDriveDocImports(
  sourcePaths: string[],
  sourceRoot: string,
  _repoRoot: string,
): DriveDocImportPlan[] {
  return sourcePaths.map((sourcePath) => {
    const relativeToSourceRoot = path.relative(sourceRoot, sourcePath)
    const segments = relativeToSourceRoot.split(path.sep).filter(Boolean)
    const isArchive = segments[0]?.toLowerCase() === 'archive'
    const fileName = path.basename(sourcePath)

    return {
      sourcePath,
      relativeDestination: path.posix.join(
        'docs/drive-import',
        classifyDriveDoc(fileName, isArchive),
      ),
    }
  })
}

export async function collectMarkdownFiles(sourceRoot: string): Promise<string[]> {
  const files: string[] = []

  async function walk(currentPath: string): Promise<void> {
    const entries = await readdir(currentPath, { withFileTypes: true })

    for (const entry of entries) {
      const entryPath = path.join(currentPath, entry.name)

      if (entry.isDirectory()) {
        await walk(entryPath)
        continue
      }

      if (entry.isFile() && path.extname(entry.name).toLowerCase() === '.md') {
        files.push(entryPath)
      }
    }
  }

  await walk(sourceRoot)

  return files.sort((left, right) => left.localeCompare(right))
}

export async function executeDriveDocImport(
  sourceRoot: string,
  repoRoot: string,
): Promise<ImportManifest> {
  const sourcePaths = await collectMarkdownFiles(sourceRoot)
  const plans = planDriveDocImports(sourcePaths, sourceRoot, repoRoot)

  for (const plan of plans) {
    const destinationPath = path.join(repoRoot, plan.relativeDestination)

    await mkdir(path.dirname(destinationPath), { recursive: true })
    await copyFile(plan.sourcePath, destinationPath)
  }

  const destinationRoot = path.join(repoRoot, 'docs', 'drive-import')
  const manifestPath = path.join(destinationRoot, 'manifest.json')
  const manifest: ImportManifest = {
    generatedAt: new Date().toISOString(),
    sourceRoot,
    destinationRoot,
    importedCount: plans.length,
    imports: plans,
  }

  await mkdir(destinationRoot, { recursive: true })
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')

  return manifest
}

export async function readImportManifest(repoRoot: string): Promise<ImportManifest | null> {
  const manifestPath = path.join(repoRoot, 'docs', 'drive-import', 'manifest.json')

  try {
    const manifestText = await readFile(manifestPath, 'utf8')
    const manifestJson = JSON.parse(manifestText) as ImportManifest

    await stat(manifestPath)

    return manifestJson
  } catch {
    return null
  }
}
