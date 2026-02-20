"use client";

import { Switch } from "@headlessui/react";

interface ToggleProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    id?: string;
}

export default function Toggle({ checked, onChange, id }: ToggleProps) {
    return (
        <Switch
            checked={checked}
            onChange={onChange}
            id={id}
            className={`
                relative inline-flex h-6 w-11 items-center rounded-full
                transition-colors duration-200 ease-in-out
                focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                ${checked ? 'bg-primary' : 'bg-neutral-200'}
            `}
        >
            <span className="sr-only">Toggle setting</span>
            <span
                className={`
                    inline-block h-5 w-5 transform rounded-full bg-white shadow-sm
                    transition-transform duration-200 ease-in-out
                    ${checked ? 'translate-x-6' : 'translate-x-1'}
                `}
            />
        </Switch>
    );
}
