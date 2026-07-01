"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { FeedbackRating } from "@/lib/feedback/types";
import { FeedbackModal } from "./feedback-modal";

interface FeedbackContextValue {
  openFeedback: (options?: { rating?: FeedbackRating }) => void;
}

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [initialRating, setInitialRating] = useState<FeedbackRating | undefined>();

  const openFeedback = useCallback((options?: { rating?: FeedbackRating }) => {
    setInitialRating(options?.rating);
    setOpen(true);
  }, []);

  const value = useMemo(() => ({ openFeedback }), [openFeedback]);

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      <FeedbackModal
        open={open}
        onClose={() => setOpen(false)}
        source="modal"
        initialRating={initialRating}
      />
    </FeedbackContext.Provider>
  );
}

export function useFeedback(): FeedbackContextValue {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error("useFeedback must be used within FeedbackProvider");
  }
  return context;
}
