"use client";

import { create } from "zustand";

type SearchStep = "location" | "dates" | "guests";

interface SearchModalStore {
    isOpen: boolean;
    initialStep: SearchStep;
    openModal: (step?: SearchStep) => void;
    closeModal: () => void;
}

export const useSearchModal = create<SearchModalStore>((set) => ({
    isOpen: false,
    initialStep: "location",
    openModal: (step = "location") => set({ isOpen: true, initialStep: step }),
    closeModal: () => set({ isOpen: false }),
}));
