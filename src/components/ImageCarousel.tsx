import { useState, useEffect, useRef, useCallback } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface MediaItem {
  type: "image" | "video" | "youtube";
  src: string;
  thumbnail?: string;
}

interface ImageCarouselProps {
  images: string[];
  videoUrls?: string[];
  autoScrollInterval?: number;
}

function parseMedia(images: string[], videoUrls: string[] = []): MediaItem[] {
  const items: MediaItem[] = images.map((src) => ({ type: "image", src }));
  videoUrls.forEach((url) => {
    const ytMatch = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/.exec(url);
    if (ytMatch) {
      items.push({ type: "youtube", src: url, thumbnail: `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg` });
    } else {
      items.push({ type: "video", src: url });
    }
  });
  return items;
}

export default function ImageCarousel({ images, videoUrls = [], autoScrollInterval = 3000 }: ImageCarouselProps) {
  const media = parseMedia(images, videoUrls);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const closingRef = useRef(false);

  const startAutoSlide = useCallback(() => {
    if (media.length <= 1) return;
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % media.length);
    }, autoScrollInterval);
  }, [media.length, autoScrollInterval]);

  useEffect(() => {
    startAutoSlide();
    return () => clearInterval(intervalRef.current);
  }, [startAutoSlide]);

  const goTo = (index: number) => {
    setCurrentIndex(index);
    startAutoSlide();
  };

  const openFullscreen = (i: number) => {
    if (closingRef.current) return;
    setFullscreen(true);
    setCurrentIndex(i);
    clearInterval(intervalRef.current);
  };

  const closeFullscreen = () => {
    closingRef.current = true;
    setFullscreen(false);
    startAutoSlide();
    setTimeout(() => { closingRef.current = false; }, 300);
  };

  if (media.length === 0) return null;

  const renderMediaItem = (item: MediaItem, i: number, isFullscreen: boolean) => {
    if (item.type === "youtube") {
      if (isFullscreen) {
        return (
          <iframe
            src={`https://www.youtube.com/embed/${/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/.exec(item.src)?.[1]}?autoplay=1`}
            className="w-full h-full"
            allow="autoplay; encrypted-media"
            allowFullScreen
            onClick={(e) => e.stopPropagation()}
          />
        );
      }
      return (
        <div className="relative w-full cursor-pointer" onClick={() => openFullscreen(i)}>
          <img src={item.thumbnail} alt="YouTube" className="w-full max-h-[320px] min-h-[180px] object-cover block" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-black/60 flex items-center justify-center">
              <span className="text-white text-2xl ml-1">▶</span>
            </div>
          </div>
        </div>
      );
    }
    if (item.type === "video") {
      return (
        <video
          src={item.src}
          controls={isFullscreen}
          preload="metadata"
          className={isFullscreen ? "max-w-full max-h-full object-contain" : "w-full max-h-[320px] min-h-[180px] object-cover block cursor-pointer"}
          onClick={(e) => {
            if (!isFullscreen) { e.preventDefault(); openFullscreen(i); }
            else e.stopPropagation();
          }}
        />
      );
    }
    return (
      <img
        src={item.src}
        alt=""
        className={isFullscreen ? "max-w-full max-h-full object-contain" : "w-full max-h-[320px] min-h-[180px] object-cover block cursor-pointer"}
        onClick={(e) => {
          e.stopPropagation();
          if (!isFullscreen) openFullscreen(i);
        }}
      />
    );
  };

  return (
    <>
      {/* Inline Slider */}
      <div className="relative bg-black overflow-hidden">
        <div className="relative overflow-hidden">
          {media.map((item, i) => (
            <div
              key={i}
              className="w-full transition-transform duration-500 ease-out"
              style={{
                transform: `translateX(${(i - currentIndex) * 100}%)`,
                position: i === 0 ? "relative" : "absolute",
                top: 0,
                left: 0,
              }}
            >
              {renderMediaItem(item, i, false)}
            </div>
          ))}
        </div>

        {media.length > 1 && (
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-[5px] pointer-events-none">
            {media.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentIndex ? "bg-white w-4" : "bg-white/50 w-1.5"
                }`}
              />
            ))}
          </div>
        )}

        {media.length > 1 && (
          <span className="absolute top-2 right-2.5 bg-black/55 text-white text-[11px] font-semibold px-2 py-0.5 rounded-full pointer-events-none">
            {currentIndex + 1}/{media.length}
          </span>
        )}
      </div>

      {/* Fullscreen Viewer */}
      {fullscreen && (
        <div
          className="fixed inset-0 z-[9999] bg-black flex items-center justify-center"
          onClick={closeFullscreen}
        >
          <button
            className="absolute top-4 left-4 text-white z-10 bg-white/20 rounded-full p-2"
            onClick={(e) => { e.stopPropagation(); closeFullscreen(); }}
          >
            <X size={20} />
          </button>

          {media.length > 1 && (
            <>
              <button
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 text-white bg-white/20 rounded-full p-2"
                onClick={(e) => { e.stopPropagation(); goTo((currentIndex - 1 + media.length) % media.length); }}
              >
                <ChevronLeft size={24} />
              </button>
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 text-white bg-white/20 rounded-full p-2"
                onClick={(e) => { e.stopPropagation(); goTo((currentIndex + 1) % media.length); }}
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}

          <div className="max-w-full max-h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            {renderMediaItem(media[currentIndex], currentIndex, true)}
          </div>

          {media.length > 1 && (
            <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-1.5">
              {media.map((_, i) => (
                <span
                  key={i}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === currentIndex ? "bg-white" : "bg-white/40"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
