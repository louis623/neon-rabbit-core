'use client'

import { Ban, Check, Flag, X } from 'lucide-react'
import { useState } from 'react'
import type { RepReportInput, RepReportReason } from './types'
import styles from './MessageCenter.module.css'

const REPORT_REASONS: Array<{ value: RepReportReason; label: string }> = [
  { value: 'spam', label: 'Spam or unwanted messages' },
  { value: 'harassment', label: 'Harassment or bullying' },
  { value: 'recruiting', label: 'Unwanted recruiting' },
  { value: 'unsafe', label: 'Safety concern' },
  { value: 'other', label: 'Something else' },
]

function ReportFields({
  reason,
  details,
  pending,
  onReasonChange,
  onDetailsChange,
  onSubmit,
}: {
  reason: RepReportReason | ''
  details: string
  pending: boolean
  onReasonChange: (reason: RepReportReason) => void
  onDetailsChange: (details: string) => void
  onSubmit: () => void
}) {
  return (
    <div className={styles.reportRequestForm}>
      <label>
        <span>What best describes the concern?</span>
        <select
          value={reason}
          onChange={(event) => onReasonChange(event.target.value as RepReportReason)}
        >
          <option value="">Choose a reason</option>
          {REPORT_REASONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>What should Sparkle Suite Support review?</span>
        <textarea
          className="ph-no-capture"
          value={details}
          rows={3}
          maxLength={1000}
          placeholder="Add any details that will help Support understand the concern."
          onChange={(event) => onDetailsChange(event.target.value)}
        />
      </label>
      <button
        type="button"
        className={styles.secondaryButton}
        disabled={pending || !reason}
        onClick={onSubmit}
      >
        Send report
      </button>
    </div>
  )
}

export function RepMessageRequestCard({
  senderName,
  pending,
  onDecision,
  onReport,
}: {
  senderName: string
  pending: boolean
  onDecision: (decision: 'accept' | 'decline' | 'decline_and_block') => Promise<void>
  onReport: (input: RepReportInput) => Promise<void>
}) {
  const [status, setStatus] = useState('')
  const [showReport, setShowReport] = useState(false)
  const [reportReason, setReportReason] = useState<RepReportReason | ''>('')
  const [reportDetails, setReportDetails] = useState('')

  async function decide(
    decision: 'accept' | 'decline' | 'decline_and_block',
  ) {
    if (
      decision === 'decline_and_block' &&
      !window.confirm(
        `Decline this request and block ${senderName}?`,
      )
    ) {
      return
    }
    setStatus('Saving your choice…')
    try {
      await onDecision(decision)
      setStatus(
        decision === 'accept'
          ? 'Request accepted. You can now reply.'
          : 'Your choice was saved.',
      )
    } catch {
      setStatus('Your choice could not be saved. Try again.')
    }
  }

  async function report() {
    if (!reportReason) return
    if (!window.confirm('Send this report to Sparkle Suite Support?')) return
    setStatus('Sending your report…')
    try {
      await onReport({ reason: reportReason, details: reportDetails.trim() })
      setShowReport(false)
      setReportReason('')
      setReportDetails('')
      setStatus('Report sent to Sparkle Suite Support.')
    } catch {
      setStatus('Your report could not be sent. Your notes are still here.')
    }
  }

  return (
    <section className={styles.requestCard} aria-labelledby="message-request-title">
      <div>
        <h3 id="message-request-title">Message request</h3>
        <p>
          {senderName} would like to message you through the Sparkle Suite Rep
          Network. They cannot continue the conversation unless you accept.
        </p>
      </div>
      <div className={styles.requestActions}>
        <button
          type="button"
          className={styles.primaryButton}
          disabled={pending}
          onClick={() => void decide('accept')}
        >
          <Check aria-hidden="true" /> Accept
        </button>
        <button
          type="button"
          className={styles.secondaryButton}
          disabled={pending}
          onClick={() => void decide('decline')}
        >
          <X aria-hidden="true" /> Decline
        </button>
        <button
          type="button"
          className={styles.secondaryButton}
          disabled={pending}
          onClick={() => void decide('decline_and_block')}
        >
          <Ban aria-hidden="true" /> Decline and block
        </button>
        <button
          type="button"
          className={styles.textButton}
          disabled={pending}
          onClick={() => setShowReport((current) => !current)}
        >
          <Flag aria-hidden="true" /> Report
        </button>
      </div>
      {showReport ? (
        <ReportFields
          reason={reportReason}
          details={reportDetails}
          pending={pending}
          onReasonChange={setReportReason}
          onDetailsChange={setReportDetails}
          onSubmit={() => void report()}
        />
      ) : null}
      <p className={styles.srStatus} role="status" aria-live="polite">
        {status}
      </p>
    </section>
  )
}

export function RepConversationSafetyActions({
  repName,
  pending,
  onBlock,
  onReport,
}: {
  repName: string
  pending: boolean
  onBlock: () => Promise<void>
  onReport: (input: RepReportInput) => Promise<void>
}) {
  const [showReport, setShowReport] = useState(false)
  const [reason, setReason] = useState<RepReportReason | ''>('')
  const [details, setDetails] = useState('')
  const [status, setStatus] = useState('')

  async function block() {
    if (!window.confirm(`Block ${repName}? They will not be able to message you.`)) {
      return
    }
    setStatus('Blocking this rep…')
    try {
      await onBlock()
      setStatus(`${repName} is blocked.`)
    } catch {
      setStatus('This rep could not be blocked. Try again.')
    }
  }

  async function report() {
    if (!reason) return
    if (!window.confirm('Send this report to Sparkle Suite Support?')) return
    setStatus('Sending your report…')
    try {
      await onReport({ reason, details: details.trim() })
      setReason('')
      setDetails('')
      setShowReport(false)
      setStatus('Report sent to Sparkle Suite Support.')
    } catch {
      setStatus('Your report could not be sent. Your notes are still here.')
    }
  }

  return (
    <div className={styles.safetyActions}>
      <button
        type="button"
        className={styles.textButton}
        disabled={pending}
        onClick={() => setShowReport((current) => !current)}
      >
        <Flag aria-hidden="true" /> Report a concern
      </button>
      <button
        type="button"
        className={styles.textButton}
        disabled={pending}
        onClick={() => void block()}
      >
        <Ban aria-hidden="true" /> Block rep
      </button>
      {showReport ? (
        <ReportFields
          reason={reason}
          details={details}
          pending={pending}
          onReasonChange={setReason}
          onDetailsChange={setDetails}
          onSubmit={() => void report()}
        />
      ) : null}
      <p className={styles.srStatus} role="status" aria-live="polite">
        {status}
      </p>
    </div>
  )
}
