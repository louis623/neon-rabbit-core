import styles from './nic-nac-mark.module.css'

export function NicNacMark({
  size = 22,
  className,
}: {
  size?: number
  className?: string
}) {
  return (
    <span
      aria-hidden="true"
      className={className ? `${styles.mark} ${className}` : styles.mark}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.6) }}
    >
      N
    </span>
  )
}
