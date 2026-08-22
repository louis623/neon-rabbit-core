'use client'

import type { ChangeEvent, InputHTMLAttributes } from 'react'
import { useEffect, useRef, useState } from 'react'
import {
  AlertCircle,
  Camera,
  Check,
  FolderOpen,
  Images,
  Sparkles,
} from 'lucide-react'
import styles from './CollectionIntakeTool.module.css'

type IntakeStage = 'idle' | 'processing' | 'review'
type ReviewQueue = 'matched' | 'needs-review' | 'board-only'

const PROCESSING_STEPS = [
  'Reading capture times and photo order',
  'Finding likely label and jewelry pairs',
  'Extracting label text and visual clues',
  'Building a minimal review queue',
] as const

const DIRECTORY_INPUT_PROPS = {
  directory: '',
  webkitdirectory: '',
} as unknown as InputHTMLAttributes<HTMLInputElement>

function getImageFiles(files: FileList | null) {
  if (!files) return []
  return Array.from(files).filter((file) => file.type.startsWith('image/'))
}

export function CollectionIntakeTool() {
  const inputRef = useRef<HTMLInputElement>(null)
  const reviewRef = useRef<HTMLDivElement>(null)
  const [files, setFiles] = useState<File[]>([])
  const [stage, setStage] = useState<IntakeStage>('idle')
  const [processingStep, setProcessingStep] = useState(0)
  const [activeQueue, setActiveQueue] = useState<ReviewQueue>('needs-review')
  const [collectionType, setCollectionType] = useState('')
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  const photoCount = files.length
  const pieceCount = Math.max(1, Math.ceil(photoCount / 2))
  const needsReview = Math.min(3, Math.max(1, Math.ceil(pieceCount * 0.15)))
  const boardOnly = Math.min(
    Math.max(0, pieceCount - needsReview),
    Math.max(1, Math.ceil(pieceCount * 0.25)),
  )
  const batch = {
    photoCount,
    pieceCount,
    needsReview,
    boardOnly,
    matched: Math.max(0, pieceCount - needsReview - boardOnly),
  }

  useEffect(() => {
    if (stage !== 'processing') return

    const timers = PROCESSING_STEPS.map((_, index) =>
      window.setTimeout(() => setProcessingStep(index), 650 * (index + 1)),
    )
    const completeTimer = window.setTimeout(() => {
      setStage('review')
      window.setTimeout(() => {
        reviewRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
        reviewRef.current?.focus({ preventScroll: true })
      }, 0)
    }, 3100)

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer))
      window.clearTimeout(completeTimer)
    }
  }, [stage])

  function handleFilesSelected(event: ChangeEvent<HTMLInputElement>) {
    const nextFiles = getImageFiles(event.currentTarget.files)
    setFiles(nextFiles)
    setStage('idle')
    setProcessingStep(0)
    setStatusMessage(
      nextFiles.length > 0
        ? `${nextFiles.length} image${nextFiles.length === 1 ? '' : 's'} ready for local review.`
        : 'No image files were selected.',
    )
  }

  function startReview() {
    if (files.length === 0) {
      inputRef.current?.click()
      return
    }
    setStatusMessage(null)
    setProcessingStep(0)
    setStage('processing')
  }

  function resetBatch() {
    setFiles([])
    setStage('idle')
    setProcessingStep(0)
    setActiveQueue('needs-review')
    setCollectionType('')
    setStatusMessage(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className={styles.stack}>
      <section className={styles.intro}>
        <div>
          <span className={styles.eyebrow}>Bulk Collection Intake</span>
          <h2>Bulk-add jewelry to your Dance Floor.</h2>
          <p>
            Select one photo folder, keep each piece together in capture order,
            then review only the pairings and fields that need a human eye.
          </p>
        </div>
        <span className={styles.localBadge}>Safe review mode</span>
      </section>

      <section className={styles.guide} aria-labelledby="collection-intake-guide">
        <div>
          <span className={styles.eyebrow}>How it works</span>
          <h3 id="collection-intake-guide">Work one piece at a time.</h3>
          <p>
            Take the jewelry photo first. Add its label and packaging next, if
            available, before moving to the next piece.
          </p>
        </div>
        <ol className={styles.steps}>
          <li>
            <span>1</span>
            <div>
              <strong>Photograph the jewelry</strong>
              <small>The jewelry photo is required.</small>
            </div>
          </li>
          <li>
            <span>2</span>
            <div>
              <strong>Keep supporting photos beside it</strong>
              <small>Capture order keeps each set grouped.</small>
            </div>
          </li>
          <li>
            <span>3</span>
            <div>
              <strong>Review uncertain pairings</strong>
              <small>Confirm, correct, or mark “Not sure.”</small>
            </div>
          </li>
          <li>
            <span>4</span>
            <div>
              <strong>Publish approved results later</strong>
              <small>No live records are changed in this first release.</small>
            </div>
          </li>
        </ol>
      </section>

      {stage === 'processing' ? (
        <section className={styles.processing} aria-live="polite">
          <div className={styles.processingArt}>
            <Images aria-hidden="true" />
            <span className={styles.processingSparkle}>
              <Sparkles aria-hidden="true" />
            </span>
          </div>
          <div>
            <span className={styles.eyebrow}>Nic-Nac assisted triage</span>
            <h3>Organizing {files.length} photos into likely pieces…</h3>
            <p>
              Capture order stays intact while likely groups are proposed and
              uncertain results are marked for review.
            </p>
            <div className={styles.progressTrack}>
              <span style={{ width: `${(processingStep + 1) * 25}%` }} />
            </div>
            <ol className={styles.processingSteps}>
              {PROCESSING_STEPS.map((step, index) => (
                <li
                  key={step}
                  className={index <= processingStep ? styles.processingStepDone : ''}
                >
                  <span>{index < processingStep ? '✓' : index + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </section>
      ) : stage === 'review' ? (
        <div className={styles.reviewStack} ref={reviewRef} tabIndex={-1}>
          <section className={styles.reviewHeader}>
            <div>
              <span className={styles.eyebrow}>Local batch review</span>
              <h3>Review proposed groupings</h3>
              <p>
                This queue previews the preserved Bulk Collection Intake workflow.
                Approvals stay local and do not write inventory or catalog data.
              </p>
            </div>
            <button type="button" className={styles.secondaryButton} onClick={resetBatch}>
              Start over
            </button>
          </section>

          <div className={styles.metrics}>
            <span><strong>{batch.photoCount}</strong> photos</span>
            <span><strong>{batch.pieceCount}</strong> likely pieces</span>
            <span><strong>{batch.needsReview}</strong> need review</span>
            <span><strong>{batch.boardOnly}</strong> board-only</span>
          </div>

          <div className={styles.reviewLayout}>
            <aside className={styles.queue} aria-label="Collection intake review queue">
              <QueueButton
                active={activeQueue === 'matched'}
                count={batch.matched}
                label="Catalog matched"
                hint="Ready for confirmation"
                onClick={() => setActiveQueue('matched')}
              />
              <QueueButton
                active={activeQueue === 'needs-review'}
                count={batch.needsReview}
                label="Needs a quick look"
                hint="Low-confidence fields"
                onClick={() => setActiveQueue('needs-review')}
              />
              <QueueButton
                active={activeQueue === 'board-only'}
                count={batch.boardOnly}
                label="Board-only pieces"
                hint="No catalog record"
                onClick={() => setActiveQueue('board-only')}
              />
            </aside>

            <section className={styles.reviewPanel}>
              <span className={styles.eyebrow}>
                {activeQueue === 'matched'
                  ? 'Verified-data candidate'
                  : activeQueue === 'board-only'
                    ? 'Dance Floor-only candidate'
                    : 'Exception review'}
              </span>
              <h3>
                {activeQueue === 'matched'
                  ? 'Confirm the catalog match.'
                  : activeQueue === 'board-only'
                    ? 'Choose a collection type.'
                    : 'Check the proposed photo group.'}
              </h3>
              <div className={styles.filePreview}>
                {files.slice(0, 3).map((file, index) => (
                  <div key={`${file.name}-${file.lastModified}`}>
                    <Camera aria-hidden="true" />
                    <span>Photo {index + 1}</span>
                    <small>{file.name}</small>
                  </div>
                ))}
              </div>

              {activeQueue === 'board-only' ? (
                <label className={styles.collectionField}>
                  <span>Collection type <b>Required</b></span>
                  <select
                    value={collectionType}
                    onChange={(event) => setCollectionType(event.target.value)}
                  >
                    <option value="">Select collection type</option>
                    <option>Birthday Collection</option>
                    <option>OG Collection</option>
                    <option>Not sure</option>
                  </select>
                  <small>
                    Without an item number and verified jewelry details, no shared
                    jewelry database record is created.
                  </small>
                </label>
              ) : (
                <div className={styles.notice}>
                  <AlertCircle aria-hidden="true" />
                  <span>
                    Nic-Nac may propose fields and explain uncertainty, but a rep
                    must approve every result before a future publishing step.
                  </span>
                </div>
              )}

              <button
                type="button"
                className={styles.primaryButton}
                disabled={activeQueue === 'board-only' && collectionType.length === 0}
                onClick={() =>
                  setStatusMessage('Review decision saved locally. No live data changed.')
                }
              >
                <Check aria-hidden="true" />
                Save review decision
              </button>
              {statusMessage ? (
                <p className={styles.successMessage} role="status">{statusMessage}</p>
              ) : null}
            </section>
          </div>
        </div>
      ) : (
        <section className={styles.uploadPanel}>
          <div>
            <span className={styles.eyebrow}>Photo batch upload</span>
            <h3>Upload one photo folder.</h3>
            <p>
              Select the folder containing the jewelry, label, and packaging photos
              in the order you captured them.
            </p>
            <input
              {...DIRECTORY_INPUT_PROPS}
              ref={inputRef}
              className={styles.fileInput}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFilesSelected}
            />
            <div className={styles.uploadActions}>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={() => inputRef.current?.click()}
              >
                <FolderOpen aria-hidden="true" />
                Choose photo folder
              </button>
              {files.length > 0 ? (
                <button type="button" className={styles.secondaryButton} onClick={startReview}>
                  Prepare review
                </button>
              ) : null}
            </div>
            {statusMessage ? (
              <p className={styles.selectionMessage} role="status">{statusMessage}</p>
            ) : null}
          </div>
          <div className={styles.uploadDiagram} aria-label="Bulk intake stages">
            <div><Camera aria-hidden="true" /><strong>Photos</strong><small>Capture order</small></div>
            <span>→</span>
            <div><Sparkles aria-hidden="true" /><strong>Smart triage</strong><small>Likely groups</small></div>
            <span>→</span>
            <div><Check aria-hidden="true" /><strong>Review</strong><small>Human approval</small></div>
          </div>
        </section>
      )}

      <section className={styles.rules} aria-label="Collection intake safeguards">
        <div>
          <strong>Dance Floor-only minimum</strong>
          <span>Jewelry photo + collection type.</span>
        </div>
        <div>
          <strong>Shared jewelry database</strong>
          <span>Item number + verified jewelry details.</span>
        </div>
        <div>
          <strong>Private evidence</strong>
          <span>Label and packaging photos remain optional.</span>
        </div>
      </section>
    </div>
  )
}

function QueueButton({
  active,
  count,
  label,
  hint,
  onClick,
}: {
  active: boolean
  count: number
  label: string
  hint: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className={active ? styles.queueButtonActive : styles.queueButton}
      onClick={onClick}
    >
      <span><strong>{label}</strong><small>{hint}</small></span>
      <b>{count}</b>
    </button>
  )
}
