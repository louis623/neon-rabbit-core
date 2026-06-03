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
        Welcome to your new Sparkle Suite. I&apos;m Nic-Nac, your built-in setup
        assistant. I&apos;ll guide you one step at a time so we can get your
        workspace and customer-facing site ready. Let&apos;s start with your name.
        What should I call you?
      </div>
    )
  }

  return (
    <div className={styles.greeting}>
      Hey, I&apos;m Nic-Nac. How can I help?
    </div>
  )
}
