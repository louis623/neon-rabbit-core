export type JewelryPhotoSemanticRole =
  | 'jewelry'
  | 'label_or_packaging'
  | 'uncertain'

export interface JewelryPhotoSemanticInput {
  width: number
  height: number
  blurRisk: number
  lightingRisk: number
  detailRisk: number
  backgroundDistractionRisk: number
  subjectCoverage: number
  subjectCentered: boolean
  detailConfidence: number
  backgroundUniformity: number
  backgroundCleanliness: number
}

export interface JewelryPhotoSemanticResult {
  role: JewelryPhotoSemanticRole
  confidence: number
  reasons: string[]
  canAttemptCrop: boolean
}

export function classifyJewelryPhotoSemantics(
  input: JewelryPhotoSemanticInput,
): JewelryPhotoSemanticResult {
  const reasons: string[] = []
  const tinySubject = input.subjectCoverage < 0.08
  const smallSubject =
    input.subjectCoverage >= 0.025 && input.subjectCoverage < 0.22
  const packagingDominates =
    input.backgroundDistractionRisk >= 0.65 ||
    input.backgroundUniformity <= 0.35 ||
    input.backgroundCleanliness <= 0.35

  if (tinySubject) reasons.push('jewelry subject is too small in the frame')
  if (packagingDominates) {
    reasons.push('background or packaging dominates the image')
  }

  if (tinySubject && packagingDominates) {
    return {
      role: 'label_or_packaging',
      confidence: 0.9,
      reasons,
      canAttemptCrop: false,
    }
  }

  const clearSmallCropCandidate =
    smallSubject &&
    input.subjectCentered &&
    input.detailConfidence >= 0.7 &&
    input.blurRisk <= 0.25 &&
    input.detailRisk <= 0.3 &&
    input.backgroundDistractionRisk <= 0.25 &&
    input.backgroundCleanliness >= 0.75

  if (clearSmallCropCandidate) {
    return {
      role: 'uncertain',
      confidence: 0.72,
      reasons: ['jewelry appears clear but small'],
      canAttemptCrop: true,
    }
  }

  const jewelryForward =
    input.subjectCoverage >= 0.24 &&
    input.subjectCentered &&
    input.blurRisk <= 0.45 &&
    input.detailRisk <= 0.45 &&
    input.backgroundDistractionRisk <= 0.35 &&
    input.backgroundCleanliness >= 0.55

  if (jewelryForward) {
    return {
      role: 'jewelry',
      confidence: 0.86,
      reasons: [],
      canAttemptCrop: false,
    }
  }

  return {
    role: 'uncertain',
    confidence: 0.5,
    reasons: reasons.length ? reasons : ['photo needs human confirmation'],
    canAttemptCrop: false,
  }
}
