import { Gem } from "lucide-react";
import type { JewelryType } from "@/lib/sparkle-finder/types";

type JewelryImageFrameProps = {
  imageUrl: string;
  name: string;
  jewelryType: JewelryType;
  variant?: "card" | "detail";
};

export function JewelryImageFrame({
  imageUrl,
  name,
  jewelryType,
  variant = "card",
}: JewelryImageFrameProps) {
  const iconSize = variant === "detail" ? "size-20" : "size-12";
  const isFullPhoto = variant === "detail";

  return (
    <div
      className="relative grid size-full min-h-0 min-w-0 place-items-center overflow-hidden bg-[linear-gradient(135deg,#fffefd,#fff3f0)] text-[var(--sparkle-plum)]"
      data-photo-fit={isFullPhoto ? "full-photo" : "smart-crop"}
      data-smoke="library-image-frame"
    >
      {imageUrl ? (
        <img
          alt={name}
          className={`absolute inset-0 h-full w-full ${isFullPhoto ? "object-contain" : "object-cover"}`}
          loading={variant === "card" ? "lazy" : "eager"}
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
