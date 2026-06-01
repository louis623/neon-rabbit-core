'use client'

import {
  FormEvent,
  KeyboardEvent,
  MouseEvent,
  useEffect,
  useRef,
  useState,
} from 'react'

import { NicNacMark } from '@/app/_components/nic-nac-mark'
import { sparkleSuitePublicLandingContent } from '@/lib/sparkle-suite/public-landing-content'
import type { PublicNicNacResponse } from '@/lib/sparkle-suite/public-nic-nac-contract'

type NicNacMessage = {
  role: 'visitor' | 'assistant'
  text: string
}

type AskNicNacOptions = {
  echoQuestion?: boolean
  replaceThread?: boolean
}

export function SparkleSuitePublicNicNac() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState<NicNacMessage[]>([])
  const [showHandoff, setShowHandoff] = useState(false)
  const [handoffQuestion, setHandoffQuestion] = useState('')
  const [handoffSaved, setHandoffSaved] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const threadEndRef = useRef<HTMLDivElement | null>(null)
  const openerRef = useRef<HTMLButtonElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const hasOpenedRef = useRef(false)
  const { publicNicNacAssistant } = sparkleSuitePublicLandingContent

  useEffect(() => {
    if (
      !isOpen ||
      isMinimized ||
      (messages.length === 0 && !isLoading && !showHandoff)
    ) {
      return
    }

    threadEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [isOpen, isMinimized, messages.length, isLoading, showHandoff])

  useEffect(() => {
    if (!isOpen || isMinimized) {
      return
    }

    hasOpenedRef.current = true
    inputRef.current?.focus()
  }, [isOpen, isMinimized])

  useEffect(() => {
    if (isOpen || !hasOpenedRef.current) {
      return
    }

    openerRef.current?.focus()
  }, [isOpen])

  function closeNicNac() {
    setIsOpen(false)
    setIsMinimized(false)
  }

  function handleOpenToggle() {
    setIsOpen((currentValue) => {
      const nextValue = !currentValue
      if (nextValue) {
        setIsMinimized(false)
      }
      return nextValue
    })
  }

  function handlePanelKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.preventDefault()
      setIsMinimized(true)
    }
  }

  function handlePopoverClick(event: MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) {
      closeNicNac()
    }
  }

  async function askNicNac(
    nextQuestion: string,
    { echoQuestion = true, replaceThread = false }: AskNicNacOptions = {},
  ) {
    const trimmedQuestion = nextQuestion.trim()

    if (!trimmedQuestion || isLoading) {
      return
    }

    const visitorMessage: NicNacMessage[] = echoQuestion
      ? [{ role: 'visitor', text: trimmedQuestion }]
      : []

    setMessages((currentMessages) => [
      ...(replaceThread ? [] : currentMessages),
      ...visitorMessage,
    ])
    setQuestion('')
    setHandoffSaved(false)
    setShowHandoff(false)
    setIsLoading(true)

    try {
      const response = await fetch('/api/public/nic-nac', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ question: trimmedQuestion }),
      })
      const answer = (await response.json()) as PublicNicNacResponse
      const shouldCollectContact =
        (answer.kind === 'handoff' && answer.collectContact) || answer.kind === 'error'

      setMessages((currentMessages) => [
        ...currentMessages,
        { role: 'assistant', text: answer.message },
      ])
      setShowHandoff(shouldCollectContact)
      setHandoffQuestion(shouldCollectContact ? trimmedQuestion : '')
    } catch {
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          role: 'assistant',
          text:
            "I'm having trouble answering right now. You can try again in a moment, or leave your question here for Louis to review.",
        },
      ])
      setShowHandoff(true)
      setHandoffQuestion(trimmedQuestion)
    } finally {
      setIsLoading(false)
    }
  }

  function handleQuestionSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void askNicNac(question)
  }

  function handleHandoffSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setHandoffSaved(true)
  }

  return (
    <aside className="sl2-nic-nac" aria-label="Public Nic-Nac assistant">
      <div className="sl2-nic-nac__teaser">
        <div>
          <strong>{publicNicNacAssistant.teaser}</strong>
          <p>{publicNicNacAssistant.body}</p>
        </div>
        <button
          ref={openerRef}
          aria-controls="sparkle-public-nic-nac-panel"
          aria-expanded={isOpen && !isMinimized}
          className="sl2-nic-nac__button"
          onClick={handleOpenToggle}
          type="button"
        >
          {publicNicNacAssistant.buttonLabel}
        </button>
      </div>

      {isOpen && isMinimized ? (
        <button
          aria-controls="sparkle-public-nic-nac-panel"
          aria-label="Open Nic-Nac"
          className="sl2-nic-nac-reopen"
          onClick={() => setIsMinimized(false)}
          type="button"
        >
          <NicNacMark size={28} />
        </button>
      ) : null}

      {isOpen && !isMinimized ? (
        <div className="sl2-nic-nac-popover" onClick={handlePopoverClick}>
          <div
            aria-label="Ask Nic-Nac"
            className="sl2-nic-nac-panel"
            id="sparkle-public-nic-nac-panel"
            onKeyDown={handlePanelKeyDown}
            role="dialog"
          >
            <div className="sl2-nic-nac-panel__head">
              <div className="sl2-nic-nac-panel__brand">
                <NicNacMark size={28} />
                <div>
                  <h3>{publicNicNacAssistant.panelTitle}</h3>
                  <p>{publicNicNacAssistant.panelIntro}</p>
                </div>
              </div>
              <div className="sl2-nic-nac-panel__actions">
                <button
                  aria-label="Minimize Nic-Nac"
                  className="sl2-nic-nac-panel__icon-button"
                  onClick={() => setIsMinimized(true)}
                  type="button"
                >
                  <span aria-hidden="true">-</span>
                </button>
                <button
                  aria-label="Close Nic-Nac"
                  className="sl2-nic-nac-panel__icon-button"
                  onClick={closeNicNac}
                  type="button"
                >
                  <span aria-hidden="true">x</span>
                </button>
              </div>
            </div>

            <div className="sl2-nic-nac-starters" aria-label="Starter questions">
              {publicNicNacAssistant.starterQuestions.map((starterQuestion) => (
                <button
                  disabled={isLoading}
                  key={starterQuestion}
                  onClick={() =>
                    void askNicNac(starterQuestion, {
                      echoQuestion: false,
                      replaceThread: true,
                    })
                  }
                  type="button"
                >
                  {starterQuestion}
                </button>
              ))}
            </div>

            <div className="sl2-nic-nac-thread" aria-live="polite">
              {messages.length === 0 && !isLoading ? (
                <p className="sl2-nic-nac-empty">
                  Choose a starter question or ask your own.
                </p>
              ) : null}
              {messages.length > 0
                ? messages.map((message, index) => (
                    <div
                      className={`sl2-nic-nac-message-row sl2-nic-nac-message-row--${message.role}`}
                      key={`${message.role}-${index}-${message.text}`}
                    >
                      {message.role === 'assistant' ? <NicNacMark size={22} /> : null}
                      <p
                        className={`sl2-nic-nac-message sl2-nic-nac-message--${message.role}`}
                      >
                        {message.text}
                      </p>
                    </div>
                  ))
                : null}
              {isLoading ? (
                <div className="sl2-nic-nac-message-row sl2-nic-nac-message-row--assistant">
                  <NicNacMark size={22} />
                  <p className="sl2-nic-nac-message sl2-nic-nac-message--assistant">
                    <span>Nic-Nac is thinking</span>
                    <span className="sl2-nic-nac-thinking-dots" aria-hidden="true">
                      <span />
                      <span />
                      <span />
                    </span>
                  </p>
                </div>
              ) : null}
              {showHandoff ? (
                <form className="sl2-nic-nac-handoff" onSubmit={handleHandoffSubmit}>
                  <div className="sl2-nic-nac-handoff__head">
                    <strong>Leave this for Louis</strong>
                    <p>
                      Nic-Nac will keep this scoped to your question; nothing sends from
                      this page yet.
                    </p>
                  </div>
                  <label>
                    {publicNicNacAssistant.handoffLabels.name}
                    <input autoComplete="name" name="name" type="text" />
                  </label>
                  <label>
                    {publicNicNacAssistant.handoffLabels.email}
                    <input autoComplete="email" name="email" type="email" />
                  </label>
                  <label>
                    {publicNicNacAssistant.handoffLabels.question}
                    <textarea
                      name="question"
                      onChange={(event) => setHandoffQuestion(event.target.value)}
                      rows={3}
                      value={handoffQuestion}
                    />
                  </label>
                  <button type="submit">{publicNicNacAssistant.handoffLabels.submit}</button>
                  {handoffSaved ? (
                    <p role="status">{publicNicNacAssistant.handoffLabels.saved}</p>
                  ) : null}
                </form>
              ) : null}
              <div ref={threadEndRef} aria-hidden="true" />
            </div>

            <form className="sl2-nic-nac-form" onSubmit={handleQuestionSubmit}>
              <label htmlFor="sparkle-public-nic-nac-question">
                {publicNicNacAssistant.inputLabel}
              </label>
              <div>
                <input
                  ref={inputRef}
                  disabled={isLoading}
                  id="sparkle-public-nic-nac-question"
                  onChange={(event) => setQuestion(event.target.value)}
                  placeholder={publicNicNacAssistant.inputPlaceholder}
                  type="text"
                  value={question}
                />
                <button disabled={isLoading} type="submit">
                  {publicNicNacAssistant.submitLabel}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </aside>
  )
}
