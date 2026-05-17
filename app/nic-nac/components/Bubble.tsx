import type { ReactNode } from 'react'
import { NicNacGlyph } from './NicNacGlyph'
import { Markdown } from './Markdown'
import { RelativeTime } from './RelativeTime'
import styles from './Bubble.module.css'

export interface BubbleImage {
  url: string
}

export function Bubble({
  variant,
  showGlyph,
  children,
  text,
  images,
  timestamp,
  renderMarkdown,
}: {
  variant: 'rep' | 'nicNac'
  showGlyph?: boolean
  children?: ReactNode
  // When provided, renders text via Markdown (assistant) or as-is (rep).
  text?: string
  images?: BubbleImage[]
  timestamp?: string | number
  renderMarkdown?: boolean
}) {
  const hasImages = !!images && images.length > 0
  const body = (
    <>
      {hasImages ? (
        <div className={styles.imageGrid}>
          {images!.map((img, i) => (
            <a
              key={i}
              href={img.url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.imageThumb}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt="" />
            </a>
          ))}
        </div>
      ) : null}
      {text !== undefined && text !== '' ? (
        renderMarkdown ? (
          <div className={styles.mdRoot}>
            <Markdown text={text} />
          </div>
        ) : (
          <span className={styles.plain}>{text}</span>
        )
      ) : null}
      {children}
    </>
  )

  if (variant === 'rep') {
    return (
      <div className={styles.repRow}>
        <div className={styles.repCol}>
          <div className={`${styles.bubble} ${styles.rep}`}>{body}</div>
          {timestamp !== undefined ? (
            <div className={`${styles.timestamp} ${styles.timestampRep}`}>
              <RelativeTime value={timestamp} />
            </div>
          ) : null}
        </div>
      </div>
    )
  }
  return (
    <div className={styles.nicNacRow}>
      <div className={styles.glyphSlot}>
        {showGlyph ? <NicNacGlyph size={22} /> : null}
      </div>
      <div className={styles.nicNacCol}>
        <div className={`${styles.bubble} ${styles.nicNac}`}>{body}</div>
        {timestamp !== undefined ? (
          <div className={`${styles.timestamp} ${styles.timestampNicNac}`}>
            <RelativeTime value={timestamp} />
          </div>
        ) : null}
      </div>
    </div>
  )
}
