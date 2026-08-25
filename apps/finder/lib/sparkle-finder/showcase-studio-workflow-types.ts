export type ShowcaseStudioVariantCandidate = {
  designId: string;
  itemNumber: string;
  designName: string;
  material: string | null;
  mainStone: string | null;
  jewelryType: string;
  collectionName: string | null;
  collectionYear: number | null;
  canonicalPhotoUrl: string | null;
  description: string | null;
};

export type ShowcaseStudioPanelStatus =
  | "idle"
  | "saved_pending_sync"
  | "needs_confirmation"
  | "needs_jewelry_photo"
  | "photo_rejected"
  | "invalid_details"
  | "invalid_selection"
  | "accepted"
  | "publish_queued"
  | "published"
  | "rejected"
  | "error";

export type ShowcaseStudioPanelActionState = {
  status: ShowcaseStudioPanelStatus;
  message: string;
  submissionId: string | null;
  retryable: boolean;
  candidates: ShowcaseStudioVariantCandidate[];
  selectedDesign: ShowcaseStudioVariantCandidate | null;
};

export type ShowcaseStudioPanelAction = (
  previousState: ShowcaseStudioPanelActionState,
  formData: FormData,
) => Promise<ShowcaseStudioPanelActionState>;

export const initialShowcaseStudioPanelActionState: ShowcaseStudioPanelActionState = {
  status: "idle",
  message: "Add both photos and any details you can read from the original label.",
  submissionId: null,
  retryable: false,
  candidates: [],
  selectedDesign: null,
};
