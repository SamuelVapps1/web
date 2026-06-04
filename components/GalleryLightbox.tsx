'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Photo from '@/components/Photo';
import RevealOnScroll from '@/components/RevealOnScroll';
import { GalleryItem } from '@/data/gallery';
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';

interface GalleryLightboxProps {
  items: GalleryItem[];
}

export default function GalleryLightbox({ items }: GalleryLightboxProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const touchStartX = useRef<number | null>(null);

  const isOpen = openIndex !== null;
  const current = isOpen ? items[openIndex] : null;

  const open = (index: number, el: HTMLButtonElement) => {
    triggerRef.current = el;
    setOpenIndex(index);
  };

  const close = useCallback(() => setOpenIndex(null), []);

  const next = useCallback(() => {
    setOpenIndex((prev) => (prev === null ? prev : (prev + 1) % items.length));
  }, [items.length]);

  const prev = useCallback(() => {
    setOpenIndex((prev) => (prev === null ? prev : (prev - 1 + items.length) % items.length));
  }, [items.length]);

  // Keyboard handling + body scroll lock, with proper cleanup.
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'Tab') {
        // Focus trap within the dialog.
        const focusables = dialogRef.current?.querySelectorAll<HTMLElement>('button');
        if (!focusables || focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // Move focus into the dialog.
    closeRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, close, next, prev]);

  // Return focus to the triggering thumbnail when closing.
  useEffect(() => {
    if (!isOpen && triggerRef.current) {
      triggerRef.current.focus();
      triggerRef.current = null;
    }
  }, [isOpen]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) {
      if (dx < 0) next();
      else prev();
    }
    touchStartX.current = null;
  };

  return (
    <>
      <div className="gallery">
        {items.map((item, index) => (
          <RevealOnScroll key={item.id}>
            <button
              type="button"
              className="g-item"
              onClick={(e) => open(index, e.currentTarget)}
              aria-label={`Zväčšiť: ${item.breed} — ${item.case}`}
            >
              <div className="g-item__pair">
                <div className="g-item__cell">
                  <Photo src={item.before} alt={`${item.breed} pred úpravou`} width={400} height={item.h} placeholder="" />
                </div>
                <div className="g-item__cell">
                  <Photo src={item.after} alt={`${item.breed} po úprave`} width={400} height={item.h} placeholder="" />
                </div>
                <div className="g-zoom" aria-hidden="true">
                  <ZoomIn />
                </div>
              </div>
              <div className="g-item__caption">
                <span className="g-item__breed">{item.breed}</span>
                <span className="g-item__case">{item.case}</span>
              </div>
            </button>
          </RevealOnScroll>
        ))}
      </div>

      <div className="gallery-end">
        <span>Viac fotiek pribudne čoskoro</span>
      </div>

      {isOpen && current && (
        <div className="lb is-open" onClick={close}>
          <div
            ref={dialogRef}
            className="lb__inner"
            role="dialog"
            aria-modal="true"
            aria-label={`${current.breed} — ${current.case}`}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <button ref={closeRef} className="lb__close" onClick={close} aria-label="Zavrieť">
              <X aria-hidden="true" />
            </button>
            <button className="lb__nav lb__nav--prev" onClick={prev} aria-label="Predchádzajúca fotka">
              <ChevronLeft aria-hidden="true" />
            </button>
            <button className="lb__nav lb__nav--next" onClick={next} aria-label="Ďalšia fotka">
              <ChevronRight aria-hidden="true" />
            </button>

            <div className="lb__pair">
              <div className="lb__cell">
                {current.before ? (
                  <Photo src={current.before} alt={`${current.breed} pred úpravou`} width={600} height={750} />
                ) : (
                  <div className="lb__empty">
                    <ZoomIn aria-hidden="true" />
                    <span>Fotka pribudne</span>
                  </div>
                )}
                <span className="lb__tag">Pred</span>
              </div>
              <div className="lb__cell">
                {current.after ? (
                  <Photo src={current.after} alt={`${current.breed} po úprave`} width={600} height={750} />
                ) : (
                  <div className="lb__empty">
                    <ZoomIn aria-hidden="true" />
                    <span>Fotka pribudne</span>
                  </div>
                )}
                <span className="lb__tag">Po</span>
              </div>
            </div>

            <div className="lb__caption">
              <span className="lb__breed">{current.breed}</span>
              <span className="lb__case">{current.case}</span>
            </div>
            <div className="lb__swipe-hint" aria-hidden="true"></div>
          </div>
        </div>
      )}
    </>
  );
}
