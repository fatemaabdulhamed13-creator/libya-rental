"use client";

import { DayPicker } from "react-day-picker";
import type { DateRange } from "react-day-picker";
import { ar } from "date-fns/locale";
import "react-day-picker/dist/style.css";

interface DateFilterProps {
    checkIn: string;
    checkOut: string;
    onChangeRange: (checkIn: string, checkOut: string) => void;
}

function toDate(str: string): Date | undefined {
    return str ? new Date(str) : undefined;
}

function fmt(d: Date): string {
    return d.toISOString().slice(0, 10);
}

export default function DateFilter({ checkIn, checkOut, onChangeRange }: DateFilterProps) {
    const selected: DateRange | undefined = checkIn
        ? { from: toDate(checkIn), to: toDate(checkOut) }
        : undefined;

    function handleSelect(range: DateRange | undefined) {
        if (!range) {
            onChangeRange("", "");
            return;
        }
        onChangeRange(
            range.from ? fmt(range.from) : "",
            range.to   ? fmt(range.to)   : "",
        );
    }

    return (
        /* z-[70] ensures the calendar sits above the bottom sheet (z-[60]) */
        <div className="relative z-[70] pointer-events-auto">
            <DayPicker
                mode="range"
                selected={selected}
                onSelect={handleSelect}
                disabled={{ before: new Date() }}
                locale={ar}
                dir="rtl"
                numberOfMonths={1}
            />
        </div>
    );
}
