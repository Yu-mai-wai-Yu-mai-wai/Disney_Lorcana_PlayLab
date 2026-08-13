import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Sparkles, Maximize2, X, Play, Pause } from 'lucide-react';
import { Modal } from './ui/Modal';

export interface ArtworkItem {
  id: string;
  title: string;
  subtitle: string;
  url: string;
}

// 9 Pure Character & Action Artworks (Excluding dedicated landing background files)
export const ARTWORKS: ArtworkItem[] = [
  { id: '1', title: 'Mickey Mouse Sorcerer', subtitle: 'Amethyst Ink Masterpiece', url: '/artworkdisey/art2.jpg' },
  { id: '2', title: 'Rise of the Floodborn', subtitle: 'Chapter 2 Epic Battle', url: '/artworkdisey/art3.jpg' },
  { id: '3', title: 'Elsa Spirit of Winter', subtitle: 'Legendary Enchanted Artwork', url: '/artworkdisey/art4.webp' },
  { id: '4', title: 'Stitch Rock Star', subtitle: 'Amber Ink Heroic Portrait', url: '/artworkdisey/art5.webp' },
  { id: '5', title: 'Tinker Bell Giant Fairy', subtitle: 'Steel Ink Sky Guardian', url: '/artworkdisey/art7.jpg' },
  { id: '6', title: 'A Whole New World', subtitle: 'Song Action Artwork', url: '/artworkdisey/art8.jpg' },
  { id: '7', title: 'Aladdin Heroic Outlaw', subtitle: 'Ruby Ink Crimson Legend', url: '/artworkdisey/ark9.webp' },
  { id: '8', title: 'Ursula Sea Witch', subtitle: 'Amethyst Ink Sorceress', url: '/artworkdisey/art10.webp' },
  { id: '9', title: 'Disney Lorcana Realm', subtitle: 'Official Lore Canvas', url: '/artworkdisey/art11.webp' },
];

export const ArtworkCarousel: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [fullscreenImage, setFullscreenImage] = useState<ArtworkItem | null>(null);

  // Auto-play timer
  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ARTWORKS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % ARTWORKS.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + ARTWORKS.length) % ARTWORKS.length);
  };

  const getCardPosition = (index: number) => {
    const total = ARTWORKS.length;
    const diff = (index - currentIndex + total) % total;

    if (diff === 0) return 'center';
    if (diff === 1 || diff === -(total - 1)) return 'right';
    if (diff === total - 1 || diff === -1) return 'left';
    return 'hidden';
  };

  return (
    <div className="w-full py-12 flex flex-col items-center select-none relative z-10 overflow-hidden bg-[#0B0F19]">
      {/* Section Header */}
      <div className="text-center space-y-2 mb-8 px-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#141a26] border border-[#30363d] text-[#F59E0B] text-xs font-mono font-bold uppercase">
          <Sparkles className="w-3.5 h-3.5 text-[#F59E0B]" /> Full-Frame Disney Masterpiece Gallery
        </div>
        <h2 className="font-cinzel text-3xl sm:text-4xl md:text-5xl font-bold text-[#F1F5F9] tracking-wide">
          Official Disney Lorcana Artworks
        </h2>
        <p className="text-[#94A3B8] text-xs md:text-sm max-w-xl mx-auto font-outfit">
          Explore high-resolution original card illustrations &amp; key visuals.
        </p>
      </div>

      {/* FULL-WIDTH UNBOUNDED 3D HERO CAROUSEL */}
      <div
        className="relative w-full h-[380px] sm:h-[450px] md:h-[500px] flex items-center justify-center overflow-visible my-2"
        onMouseEnter={() => setIsAutoPlaying(false)}
        onMouseLeave={() => setIsAutoPlaying(true)}
      >
        {ARTWORKS.map((artwork, idx) => {
          const position = getCardPosition(idx);
          if (position === 'hidden') return null;

          const isCenter = position === 'center';
          const isLeft = position === 'left';
          const isRight = position === 'right';

          return (
            <motion.div
              key={artwork.id}
              initial={false}
              animate={{
                x: isCenter ? '0%' : isLeft ? '-55%' : '55%',
                scale: isCenter ? 1 : 0.82,
                rotateY: isCenter ? 0 : isLeft ? 22 : -22,
                opacity: isCenter ? 1 : 0.35,
                zIndex: isCenter ? 30 : 10,
              }}
              transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
              role="button"
              tabIndex={0}
              onClick={() => {
                if (isLeft) handlePrev();
                else if (isRight) handleNext();
                else setFullscreenImage(artwork);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  if (isLeft) handlePrev();
                  else if (isRight) handleNext();
                  else setFullscreenImage(artwork);
                }
              }}
              className="absolute w-[85vw] max-w-[820px] h-[340px] sm:h-[410px] md:h-[460px] rounded-xl overflow-hidden cursor-pointer preserve-3d border border-[#30363d] bg-[#141a26] group"
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* Full-Frame Art Image */}
              <div className="relative w-full h-full">
                <div className="absolute inset-0 bg-[#141a26] flex flex-col items-center justify-center p-4 text-center pointer-events-none">
                  <span className="font-cinzel text-lg font-bold text-[#F59E0B]">{artwork.title}</span>
                  <span className="text-xs text-[#94A3B8] font-mono mt-1">Image unavailable</span>
                </div>
                <img
                  src={artwork.url}
                  alt={artwork.title}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                  }}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out relative z-10"
                />
              </div>

              {/* Dark Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F19] via-[#0B0F19]/30 to-transparent opacity-85 group-hover:opacity-70 transition-opacity z-20" />

              {/* Cinematic Center Label Banner */}
              {isCenter && (
                <div className="absolute bottom-0 inset-x-0 p-6 md:p-8 flex items-end justify-between text-left z-30">
                  <div className="space-y-1 max-w-xl">
                    <span className="bg-[#0B0F19] text-[#F59E0B] border border-[#30363d] px-3 py-1 rounded text-[11px] font-mono font-bold uppercase tracking-wider">
                      Featured Artwork
                    </span>
                    <h3 className="font-cinzel text-2xl sm:text-3xl md:text-4xl font-bold text-[#F1F5F9] leading-tight">
                      {artwork.title}
                    </h3>
                    <p className="text-xs sm:text-sm font-mono text-[#94A3B8] font-semibold">
                      {artwork.subtitle}
                    </p>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFullscreenImage(artwork);
                    }}
                    aria-label="Maximize artwork preview"
                    className="p-3 bg-[#0B0F19] hover:bg-[#F59E0B] text-[#F59E0B] hover:text-black rounded-lg border border-[#30363d] transition-colors cursor-pointer shrink-0"
                  >
                    <Maximize2 className="w-5 h-5" />
                  </button>
                </div>
              )}
            </motion.div>
          );
        })}

        {/* Carousel Navigation Buttons */}
        <button
          onClick={handlePrev}
          aria-label="Previous artwork"
          className="absolute left-3 sm:left-8 md:left-14 z-40 p-3 rounded-full bg-[#141a26] hover:bg-[#F59E0B] text-[#F59E0B] hover:text-black border border-[#30363d] transition-colors cursor-pointer shadow-lg"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button
          onClick={handleNext}
          aria-label="Next artwork"
          className="absolute right-3 sm:right-8 md:right-14 z-40 p-3 rounded-full bg-[#141a26] hover:bg-[#F59E0B] text-[#F59E0B] hover:text-black border border-[#30363d] transition-colors cursor-pointer shadow-lg"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center gap-4 mt-6">
        <button
          onClick={() => setIsAutoPlaying(!isAutoPlaying)}
          aria-label="Toggle autoplay"
          className="p-2 rounded-full bg-[#141a26] border border-[#30363d] text-[#F59E0B] hover:text-white transition-colors"
          title={isAutoPlaying ? 'Pause Slideshow' : 'Play Slideshow'}
        >
          {isAutoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>

        <div className="flex items-center gap-2">
          {ARTWORKS.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                currentIndex === idx
                  ? 'w-8 bg-[#F59E0B]'
                  : 'w-2 bg-[#30363d] hover:bg-[#94A3B8]'
              }`}
            />
          ))}
        </div>
      </div>

      {/* FULLSCREEN ARTWORK PREVIEW MODAL */}
      <Modal
        isOpen={!!fullscreenImage}
        onClose={() => setFullscreenImage(null)}
        ariaLabel="Artwork Preview"
        overlayClassName="bg-[#0B0F19]/90"
      >
        {fullscreenImage && (
          <div className="relative z-10 max-w-5xl w-full flex flex-col items-center pointer-events-auto">
            <button
              onClick={() => setFullscreenImage(null)}
              aria-label="Close"
              className="absolute -top-12 right-0 p-2 bg-[#141a26] text-[#94A3B8] hover:text-white rounded-lg border border-[#30363d] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="rounded-xl overflow-hidden border border-[#30363d] max-h-[82vh] bg-[#141a26] relative w-full flex items-center justify-center">
              <div className="absolute inset-0 bg-[#141a26] flex flex-col items-center justify-center p-4 text-center pointer-events-none">
                <span className="font-cinzel text-xl font-bold text-[#F59E0B]">{fullscreenImage.title}</span>
                <span className="text-xs text-[#94A3B8] font-mono mt-1">Image unavailable</span>
              </div>
              <img
                src={fullscreenImage.url}
                alt={fullscreenImage.title}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }}
                className="w-full h-full object-contain max-h-[78vh] relative z-10"
              />
            </div>

            <div className="mt-4 text-center space-y-1">
              <div className="font-cinzel text-2xl font-bold text-[#F59E0B]">{fullscreenImage.title}</div>
              <div className="text-xs font-mono text-[#94A3B8]">{fullscreenImage.subtitle}</div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
