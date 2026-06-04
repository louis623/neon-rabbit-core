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
        Welcome to your new Sparkle Suite. We&apos;re happy to have you. I&apos;m
        Nic-Nac, your built-in live show assistant. I&apos;ll help guide you one
        step at a time so we can get your Sparkle Suite Workspace and
        customer-facing website ready! Let&apos;s start with your name. What should
        I call you?
      </div>
    )
  }

  return (
    <div className={styles.greeting}>
      Hey, I&apos;m Nic-Nac. How can I help?
    </div>
  )
}
