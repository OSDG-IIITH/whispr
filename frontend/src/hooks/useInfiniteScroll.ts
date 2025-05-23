"use client";

import { useRef, useEffect, useCallback } from "react";

interface UseInfiniteScrollProps {
  hasMore: boolean;
  onLoadMore: () => void;
  loading: boolean;
  threshold?: number;
}

export function useInfiniteScroll({
  hasMore,
  onLoadMore,
  loading,
  threshold = 100
}: UseInfiniteScrollProps) {
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const target = entries[0];
      if (target.isIntersecting && hasMore && !loading) {
        onLoadMore();
      }
    },
    [hasMore, loading, onLoadMore]
  );

  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleIntersection, {
      threshold: 0.1,
      rootMargin: `${threshold}px`
    });

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [handleIntersection, threshold]);

  return { loadMoreRef };
}