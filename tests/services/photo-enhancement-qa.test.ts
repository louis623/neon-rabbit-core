import { describe, expect, it } from 'vitest'

import {
  decideCanonicalEnhancedPhoto,
  inspectEnhancedPhoto,
  inspectEnhancedPhotoOutput,
} from '@/lib/services/photo-enhancement-qa'

describe('photo enhancement QA inspector', () => {
  it('auto-approves when confidence lands exactly on the approve threshold with no flags', () => {
    const result = inspectEnhancedPhoto({
      assetId: 'asset-42',
      provider: 'photoroom',
      metrics: {
        backgroundRemovalQuality: 0.9,
        subjectPreservation: 0.9,
        edgeCleanliness: 0.9,
        lightingConsistency: 0.9,
        artifactFreeScore: 0.9,
        outputWidth: 1600,
        outputHeight: 1600,
      },
    })

    expect(result.confidenceScore).toBe(0.9)
    expect(result.decision).toBe('approve')
    expect(result.flaggedChecks).toEqual([])
  })

  it('routes exact review-threshold confidence to manual review instead of auto-approving', () => {
    const result = inspectEnhancedPhoto({
      assetId: 'asset-43',
      provider: 'photoroom',
      metrics: {
        backgroundRemovalQuality: 0.75,
        subjectPreservation: 0.75,
        edgeCleanliness: 0.75,
        lightingConsistency: 0.75,
        artifactFreeScore: 0.75,
        outputWidth: 1600,
        outputHeight: 1600,
      },
    })

    expect(result.confidenceScore).toBe(0.75)
    expect(result.decision).toBe('review')
    expect(result.flaggedChecks).toEqual([])
    expect(result.reasons.join(' ')).toContain('manual review')
  })

  it('keeps high-confidence output in review when one flagged metric blocks auto-approval', () => {
    const result = inspectEnhancedPhoto({
      assetId: 'asset-44',
      provider: 'photoroom',
      metrics: {
        backgroundRemovalQuality: 0.74,
        subjectPreservation: 0.92,
        edgeCleanliness: 0.92,
        lightingConsistency: 0.92,
        artifactFreeScore: 0.92,
        outputWidth: 1600,
        outputHeight: 1600,
      },
    })

    expect(result.confidenceScore).toBeGreaterThan(0.85)
    expect(result.decision).toBe('review')
    expect(result.flaggedChecks).toContain('background-removal')
  })

  it('holds low-integrity output when subject preservation dips below the safety floor', () => {
    const result = inspectEnhancedPhoto({
      assetId: 'asset-45',
      provider: 'photoroom',
      metrics: {
        backgroundRemovalQuality: 0.9,
        subjectPreservation: 0.54,
        edgeCleanliness: 0.9,
        lightingConsistency: 0.9,
        artifactFreeScore: 0.9,
        outputWidth: 1600,
        outputHeight: 1600,
      },
    })

    expect(result.decision).toBe('hold')
    expect(result.flaggedChecks).toContain('subject-preservation')
    expect(result.reasons.join(' ')).toContain('safety floor')
  })

  it('allows threshold overrides for stricter queues', () => {
    const result = inspectEnhancedPhoto(
      {
        assetId: 'asset-46',
        provider: 'photoroom',
        metrics: {
          backgroundRemovalQuality: 0.97,
          subjectPreservation: 0.95,
          edgeCleanliness: 0.94,
          lightingConsistency: 0.95,
          artifactFreeScore: 0.96,
          outputWidth: 1900,
          outputHeight: 1900,
        },
      },
      {
        approveThreshold: 0.99,
      },
    )

    expect(result.decision).toBe('review')
    expect(result.reasons.join(' ')).toContain('manual review')
  })
})

describe('photo enhancement output QA inspector', () => {
  it('holds output when the provider returns an unsupported content type', () => {
    const result = inspectEnhancedPhotoOutput({
      assetId: 'asset-47',
      provider: 'photoroom',
      outputWidth: 2000,
      outputHeight: 2000,
      contentType: 'image/gif',
    })

    expect(result.decision).toBe('hold')
    expect(result.flaggedChecks).toContain('content-type')
    expect(result.reasons.join(' ')).toContain('unsupported content type')
  })

  it('keeps the exact 1200px output floor in review with a resolution warning instead of holding it', () => {
    const result = inspectEnhancedPhotoOutput({
      assetId: 'asset-48',
      provider: 'photoroom',
      outputWidth: 1200,
      outputHeight: 1600,
      contentType: 'image/png',
    })

    expect(result.decision).toBe('review')
    expect(result.flaggedChecks).toContain('resolution')
    expect(result.reasons.join(' ')).toContain('smaller than ideal')
  })

  it('holds output when the shortest edge slips one pixel below the publish floor', () => {
    const result = inspectEnhancedPhotoOutput({
      assetId: 'asset-49',
      provider: 'photoroom',
      outputWidth: 1199,
      outputHeight: 1600,
      contentType: 'image/png',
    })

    expect(result.decision).toBe('hold')
    expect(result.flaggedChecks).toContain('resolution')
    expect(result.reasons.join(' ')).toContain('resolution is too low')
  })
})

describe('canonical enhanced photo decision helper', () => {
  it('promotes canonical publication when the clean output lands exactly on the 1600px auto-promote floor', () => {
    const result = decideCanonicalEnhancedPhoto({
      assetId: 'asset-50',
      provider: 'photoroom',
      sourcePreflight: {
        passed: true,
        score: 100,
        issues: [],
        coachingMessages: [],
      },
      outputPreflight: {
        passed: true,
        score: 100,
        issues: [],
        coachingMessages: [],
      },
      sourceWidth: 1600,
      sourceHeight: 1600,
      outputWidth: 1600,
      outputHeight: 1600,
      contentType: 'image/png',
    })

    expect(result.decision).toBe('promote_canonical')
    expect(result.qaDecision).toBe('approve')
    expect(result.flaggedChecks).toEqual([])
    expect(result.reasons.join(' ')).toContain('clean preflight')
  })

  it('keeps otherwise-clean output in QA review when it misses the auto-promote floor by one pixel', () => {
    const result = decideCanonicalEnhancedPhoto({
      assetId: 'asset-51',
      provider: 'photoroom',
      sourcePreflight: {
        passed: true,
        score: 100,
        issues: [],
        coachingMessages: [],
      },
      outputPreflight: {
        passed: true,
        score: 100,
        issues: [],
        coachingMessages: [],
      },
      sourceWidth: 1500,
      sourceHeight: 1500,
      outputWidth: 1599,
      outputHeight: 1599,
      contentType: 'image/png',
    })

    expect(result.decision).toBe('qa_review')
    expect(result.qaDecision).toBe('review')
    expect(result.flaggedChecks).toContain('auto-promote-resolution')
    expect(result.reasons.join(' ')).toContain('not large enough')
  })

  it('keeps output in qa review when metadata is valid but the source photo only passed with warnings', () => {
    const result = decideCanonicalEnhancedPhoto({
      assetId: 'asset-52',
      provider: 'photoroom',
      sourcePreflight: {
        passed: true,
        score: 82,
        issues: [
          {
            code: 'subject_framing',
            severity: 'warning',
            message: 'The jewelry is a little small in the frame.',
          },
        ],
        coachingMessages: [
          'Move the camera a little closer so the jewelry takes up more of the frame.',
        ],
      },
      outputPreflight: {
        passed: true,
        score: 94,
        issues: [],
        coachingMessages: [],
      },
      sourceWidth: 1800,
      sourceHeight: 1800,
      outputWidth: 1800,
      outputHeight: 1800,
      contentType: 'image/png',
    })

    expect(result.decision).toBe('qa_review')
    expect(result.qaDecision).toBe('review')
    expect(result.flaggedChecks).toContain('source-preflight')
    expect(result.reasons.join(' ')).toContain('warnings')
  })

  it('holds output when it downscales too far relative to the staged source photo', () => {
    const result = decideCanonicalEnhancedPhoto({
      assetId: 'asset-53',
      provider: 'photoroom',
      sourcePreflight: {
        passed: true,
        score: 100,
        issues: [],
        coachingMessages: [],
      },
      outputPreflight: {
        passed: false,
        score: 58,
        issues: [
          {
            code: 'low_resolution',
            severity: 'critical',
            message: 'The photo is too small to preserve jewelry detail cleanly.',
          },
        ],
        coachingMessages: [
          'Try retaking it at a higher resolution or move closer so the jewelry fills more of the frame.',
        ],
      },
      sourceWidth: 2400,
      sourceHeight: 2400,
      outputWidth: 1200,
      outputHeight: 1200,
      contentType: 'image/png',
    })

    expect(result.decision).toBe('hold')
    expect(result.qaDecision).toBe('hold')
    expect(result.flaggedChecks).toContain('dimension-regression')
    expect(result.reasons.join(' ')).toContain('smaller than the staged source')
  })
})
