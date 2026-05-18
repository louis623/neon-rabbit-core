import styles from './NicNacGlyph.module.css'

export function NicNacGlyph({ size = 22 }: { size?: number }) {
  return (
    <span
      className={styles.glyph}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.6) }}
      aria-hidden="true"
    >
      N
    </span>
  )
}
