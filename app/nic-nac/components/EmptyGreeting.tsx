import styles from './EmptyGreeting.module.css'

export type NicNacChatMode = 'workspace' | 'required_setup'

export function EmptyGreeting({
  mode = 'workspace',
}: {
  mode?: NicNacChatMode
}) {
  if (mode === 'required_setup') {
    return (
      <div className={styles.greeting}>
        Welcome to Sparkle Suite. I&apos;ll guide setup one step at a time.
        We&apos;ll start with account basics: your display name, business name,
        contact details, and rep-facing profile.
      </div>
    )
  }

  return (
    <div className={styles.greeting}>
      Hey, I&apos;m Nic-Nac. How can I help?
    </div>
  )
}
