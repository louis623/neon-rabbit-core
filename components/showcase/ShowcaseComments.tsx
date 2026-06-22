"use client";

import { useActionState } from "react";
import { Flag, LoaderCircle, MessageCircle, Pencil, Send, Trash2 } from "lucide-react";
import { canDeleteComment, canEditComment } from "@/lib/sparkle-finder/showcase-actions";
import type { CommentActionState, ReportActionState } from "@/app/showcase/actions";
import type { ShowcaseComment, ShowcaseCommentTargetType, ShowcaseReportTargetType } from "@/lib/sparkle-finder/showcase-types";

type ShowcaseCommentsProps = {
  comments: ShowcaseComment[];
  createAction?: (previousState: CommentActionState, formData: FormData) => Promise<CommentActionState>;
  deleteAction?: (formData: FormData) => Promise<void>;
  editAction?: (previousState: CommentActionState, formData: FormData) => Promise<CommentActionState>;
  handle: string;
  reportAction?: (previousState: ReportActionState, formData: FormData) => Promise<ReportActionState>;
  showcaseUserId: string;
  targetId: string;
  targetType: ShowcaseCommentTargetType;
  viewerUserId?: string | null;
};

const initialCommentState: CommentActionState = {
  ok: true,
  message: "Comments ready.",
};

const initialReportState: ReportActionState = {
  ok: true,
  message: "Reports ready.",
};
const commentReportTargetType: ShowcaseReportTargetType = "comment";

export function ShowcaseComments({
  comments,
  createAction = disabledCommentAction,
  deleteAction = disabledDeleteAction,
  editAction = disabledCommentAction,
  handle,
  reportAction = disabledReportAction,
  showcaseUserId,
  targetId,
  targetType,
  viewerUserId,
}: ShowcaseCommentsProps) {
  const [commentState, commentFormAction, isCommentPending] = useActionState(createAction, initialCommentState);
  const [reportState, reportFormAction, isReportPending] = useActionState(reportAction, initialReportState);

  return (
    <section className="grid gap-4 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-5 shadow-[var(--sparkle-shadow-sm)]">
      <div className="flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-[var(--sparkle-radius-sm)] bg-[var(--sparkle-blush-bg)] text-[var(--sparkle-rose)]">
          <MessageCircle aria-hidden="true" className="size-5" />
        </div>
        <div>
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[var(--sparkle-plum-deep)]">
            Showcase Conversation
          </h2>
          <p className="mt-1 text-sm leading-6 text-[var(--sparkle-ink-muted)]">
            Talk about favorite reveals, pieces people are looking for, and the stories behind the pieces.
          </p>
        </div>
      </div>

      {viewerUserId ? (
        <form action={commentFormAction} className="grid gap-3">
          <input name="handle" type="hidden" value={handle} />
          <input name="showcaseUserId" type="hidden" value={showcaseUserId} />
          <input name="targetId" type="hidden" value={targetId} />
          <input name="targetType" type="hidden" value={targetType} />
          <textarea
            className="min-h-24 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white p-3 text-sm leading-6 text-[var(--sparkle-plum-deep)] outline-none transition focus:border-[var(--sparkle-rose)]"
            maxLength={500}
            name="body"
            placeholder="Celebrate the reveal or ask a kind question."
          />
          <button
            aria-busy={isCommentPending}
            className="inline-flex min-h-10 w-fit items-center justify-center gap-2 rounded-[var(--sparkle-radius-sm)] bg-[var(--sparkle-plum)] px-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isCommentPending}
            type="submit"
          >
            {isCommentPending ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Send aria-hidden="true" className="size-4" />}
            Post comment
          </button>
          <p className="text-sm font-semibold text-[var(--sparkle-ink-muted)]" role="status">
            {commentState.message}
          </p>
        </form>
      ) : (
        <p className="rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-blush-bg)] p-3 text-sm font-semibold text-[var(--sparkle-ink-muted)]">
          Sign in to follow and comment on this Sparkle Showcase.
        </p>
      )}

      <div className="grid gap-3">
        {comments.length > 0 ? (
          comments.map((comment) => (
            <CommentCard
              comment={comment}
              deleteAction={deleteAction}
              editAction={editAction}
              handle={handle}
              key={comment.id}
              reportFormAction={reportFormAction}
              showcaseUserId={showcaseUserId}
              viewerUserId={viewerUserId}
            />
          ))
        ) : (
          <p className="text-sm leading-6 text-[var(--sparkle-ink-muted)]">No comments yet.</p>
        )}
      </div>

      <p className="text-sm font-semibold text-[var(--sparkle-ink-muted)]" role="status">
        {isReportPending ? "Sending report..." : reportState.message}
      </p>
    </section>
  );
}

function CommentCard({
  comment,
  deleteAction,
  editAction,
  handle,
  reportFormAction,
  showcaseUserId,
  viewerUserId,
}: {
  comment: ShowcaseComment;
  deleteAction: (formData: FormData) => Promise<void>;
  editAction: (previousState: CommentActionState, formData: FormData) => Promise<CommentActionState>;
  handle: string;
  reportFormAction: (formData: FormData) => void;
  showcaseUserId: string;
  viewerUserId?: string | null;
}) {
  const [editState, editFormAction, isEditPending] = useActionState(editAction, initialCommentState);
  const canEdit = canEditComment(viewerUserId, comment.authorCustomerId);
  const canDelete = canDeleteComment(viewerUserId, comment.authorCustomerId, showcaseUserId);

  return (
    <article className="grid gap-3 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper-soft)] p-4">
      <div>
        <p className="font-bold text-[var(--sparkle-plum-deep)]">{comment.authorDisplayName}</p>
        <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-[var(--sparkle-coral)]">
          {formatDate(comment.createdAt)}
        </p>
      </div>
      <p className="text-sm leading-6 text-[var(--sparkle-ink-muted)]">{comment.body}</p>

      {canEdit ? (
        <form action={editFormAction} className="grid gap-2">
          <input name="commentAuthorId" type="hidden" value={comment.authorCustomerId} />
          <input name="commentId" type="hidden" value={comment.id} />
          <input name="handle" type="hidden" value={handle} />
          <textarea
            className="min-h-20 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white p-3 text-sm leading-6 text-[var(--sparkle-plum-deep)]"
            defaultValue={comment.body}
            maxLength={500}
            name="body"
          />
          <button
            aria-busy={isEditPending}
            className="inline-flex min-h-9 w-fit items-center gap-2 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white px-3 text-xs font-bold text-[var(--sparkle-plum)] disabled:opacity-60"
            disabled={isEditPending}
            type="submit"
          >
            <Pencil aria-hidden="true" className="size-3.5" />
            Update comment
          </button>
          <p className="text-xs font-semibold text-[var(--sparkle-ink-muted)]" role="status">
            {editState.message}
          </p>
        </form>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {canDelete ? (
          <form action={deleteAction}>
            <input name="commentAuthorId" type="hidden" value={comment.authorCustomerId} />
            <input name="commentId" type="hidden" value={comment.id} />
            <input name="handle" type="hidden" value={handle} />
            <input name="showcaseUserId" type="hidden" value={showcaseUserId} />
            <button className="inline-flex min-h-9 items-center gap-2 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white px-3 text-xs font-bold text-[var(--sparkle-ink-muted)]" type="submit">
              <Trash2 aria-hidden="true" className="size-3.5" />
              Delete
            </button>
          </form>
        ) : null}

        {viewerUserId ? (
          <form action={reportFormAction}>
            <input name="details" type="hidden" value={`Reported comment ${comment.id}`} />
            <input name="handle" type="hidden" value={handle} />
            <input name="reason" type="hidden" value="spam" />
            <input name="showcaseUserId" type="hidden" value={showcaseUserId} />
            <input name="targetId" type="hidden" value={comment.id} />
            <input name="targetType" type="hidden" value={commentReportTargetType} />
            <button className="inline-flex min-h-9 items-center gap-2 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white px-3 text-xs font-bold text-[var(--sparkle-ink-muted)]" type="submit">
              <Flag aria-hidden="true" className="size-3.5" />
              Report spam or bad behavior
            </button>
          </form>
        ) : null}
      </div>
    </article>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeZone: "America/New_York",
  }).format(new Date(value));
}

async function disabledCommentAction(): Promise<CommentActionState> {
  return {
    ok: false,
    reason: "auth_required",
    message: "Sign in to comment on this Sparkle Showcase.",
  };
}

async function disabledDeleteAction(): Promise<void> {}

async function disabledReportAction(): Promise<ReportActionState> {
  return {
    ok: false,
    reason: "auth_required",
    message: "Sign in to report a concern.",
  };
}
