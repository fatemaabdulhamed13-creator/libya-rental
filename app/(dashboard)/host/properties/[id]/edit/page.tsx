"use client";

import { useParams } from "next/navigation";
import PropertyForm from "@/components/host/property-form";

export default function EditPropertyPage() {
    const params = useParams();
    const propertyId = params.id as string;

    return (
        <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold mb-8 text-right">تعديل العقار</h1>
            <PropertyForm propertyId={propertyId} />
        </div>
    );
}
