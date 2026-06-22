"use client";

/* eslint-disable @next/next/no-img-element -- Catalog images can come from fixture, uploaded, or API URLs and need direct fallback/error handling here. */

import { useState } from "react";
import { Gem } from "lucide-react";
import type { JewelryType } from "@/lib/sparkle-finder/types";

type JewelryImageFrameProps = {
  fetchPriority?: "auto" | "high" | "low";
  imageUrl: string;
  loading?: "eager" | "lazy";
  name: string;
  jewelryType: JewelryType;
  sizes?: string;
  variant?: "card" | "detail";
};

export function JewelryImageFrame({
  fetchPriority,
  imageUrl,
  loading,
  name,
  jewelryType,
  sizes,
  variant = "card",
}: JewelryImageFrameProps) {
  const iconSize = variant === "detail" ? "size-20" : "size-12";
  const isFullPhoto = variant === "detail";
  const [imageFailed, setImageFailed] = useState(false);
  const hasKnownMissingFixtureImage = imageUrl.startsWith("/fixtures/jewelry/");
  const shouldRenderImage = Boolean(imageUrl && !imageFailed && !hasKnownMissingFixtureImage);

  return (
    <div
      className="relative grid size-full min-h-0 min-w-0 place-items-center overflow-hidden bg-[linear-gradient(135deg,#fffefd,#fff3f0)] text-[var(--sparkle-plum)]"
      data-photo-fit={isFullPhoto ? "full-photo" : "smart-crop"}
      data-smoke="library-image-frame"
    >
      {shouldRenderImage ? (
        <img
          alt={name}
          className={`absolute inset-0 h-full w-full ${isFullPhoto ? "object-contain" : "object-cover"}`}
          decoding="async"
          fetchPriority={fetchPriority}
          loading={loading ?? (variant === "card" ? "lazy" : "eager")}
          onError={() => setImageFailed(true)}
          sizes={sizes}
          src={imageUrl}
          style={{
            objectPosition: isFullPhoto
              ? getFullPhotoObjectPosition(jewelryType)
              : getSmartCropObjectPosition(jewelryType),
          }}
        />
      ) : (
        <Gem aria-hidden="true" className={iconSize} strokeWidth={variant === "detail" ? 1.2 : 1.4} />
      )}
    </div>
  );
}

function getFullPhotoObjectPosition(jewelryType: JewelryType) {
  if (jewelryType === "necklace") {
    return "center 58%";
  }

  if (jewelryType === "earrings") {
    return "center 52%";
  }

  return "center center";
}

function getSmartCropObjectPosition(jewelryType: JewelryType) {
  if (jewelryType === "necklace") {
    return "center 78%";
  }

  if (jewelryType === "earrings") {
    return "center 72%";
  }

  if (jewelryType === "bracelet" || jewelryType === "stack") {
    return "center 62%";
  }

  return "center 58%";
}
