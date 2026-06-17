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

  return (
    <div
      className="grid size-full place-items-center bg-[linear-gradient(135deg,#fffefd,#fff3f0)] text-[var(--sparkle-plum)]"
      data-smoke="library-image-frame"
    >
      {imageUrl ? (
        <img
          alt={name}
          className="size-full object-contain"
          loading={variant === "card" ? "lazy" : "eager"}
          src={imageUrl}
          style={{ objectPosition: getDefaultObjectPosition(jewelryType) }}
        />
      ) : (
        <Gem aria-hidden="true" className={iconSize} strokeWidth={variant === "detail" ? 1.2 : 1.4} />
      )}
    </div>
  );
}

function getDefaultObjectPosition(jewelryType: JewelryType) {
  if (jewelryType === "necklace") {
    return "center 58%";
  }

  if (jewelryType === "earrings") {
    return "center 52%";
  }

  return "center center";
}
