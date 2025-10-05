import React, { useEffect } from "react";

export interface ChatLightboxImage {
  name: string;
  dataUrl: string;
}

interface ChatImageLightBoxProps {
  images: ChatLightboxImage[];
  index: number | null;
  onClose: () => void;
  onChangeIndex: (nextIndex: number) => void;
}

export function ChatImageLightBox({ images, index, onClose, onChangeIndex }: ChatImageLightBoxProps) {
  const active = index != null && images[index] != null;

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (!active) return;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" && images.length > 0)
        onChangeIndex(((index as number) + 1) % images.length);
      if (e.key === "ArrowLeft" && images.length > 0)
        onChangeIndex(((index as number) - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, images.length, index, onClose, onChangeIndex]);

  if (!active) return null;

  const img = images[index as number];

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="relative max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <img
          src={img.dataUrl}
          alt={img.name}
          className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg shadow-2xl"
        />
        <div className="absolute top-2 right-2 flex gap-2">
          <button
            className="px-2 py-1 rounded bg-white/90 text-zinc-900 text-xs hover:bg-white"
            onClick={onClose}
          >
            Close
          </button>
          <a
            className="px-2 py-1 rounded bg-white/90 text-zinc-900 text-xs hover:bg-white"
            href={img.dataUrl}
            download={img.name}
          >
            Download
          </a>
        </div>
        {images.length > 1 && (
          <>
            <button
              className="absolute left-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded bg-white/80 text-zinc-900 hover:bg-white"
              onClick={() => onChangeIndex(((index as number) - 1 + images.length) % images.length)}
            >
              ‹
            </button>
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded bg-white/80 text-zinc-900 hover:bg-white"
              onClick={() => onChangeIndex(((index as number) + 1) % images.length)}
            >
              ›
            </button>
          </>
        )}
      </div>
    </div>
  );
}
