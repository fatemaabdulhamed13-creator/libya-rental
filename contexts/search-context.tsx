"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface SearchContextType {
    location: string;
    setLocation: (location: string) => void;
    checkIn: Date | null;
    setCheckIn: (date: Date | null) => void;
    checkOut: Date | null;
    setCheckOut: (date: Date | null) => void;
    guests: number;
    setGuests: (guests: number) => void;
    resetSearch: () => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: ReactNode }) {
    const [location, setLocation] = useState("");
    const [checkIn, setCheckIn] = useState<Date | null>(null);
    const [checkOut, setCheckOut] = useState<Date | null>(null);
    const [guests, setGuests] = useState(1);

    const resetSearch = () => {
        setLocation("");
        setCheckIn(null);
        setCheckOut(null);
        setGuests(1);
    };

    return (
        <SearchContext.Provider
            value={{
                location,
                setLocation,
                checkIn,
                setCheckIn,
                checkOut,
                setCheckOut,
                guests,
                setGuests,
                resetSearch,
            }}
        >
            {children}
        </SearchContext.Provider>
    );
}

export function useSearch() {
    const context = useContext(SearchContext);
    if (context === undefined) {
        throw new Error("useSearch must be used within a SearchProvider");
    }
    return context;
}
