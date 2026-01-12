import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface MetadataDisplayProps {
    metadata?: {
        year?: number
        condition?: string
        material?: string
        category?: string
        [key: string]: any
    }
}

export function MetadataDisplay({ metadata }: MetadataDisplayProps) {
    if (!metadata || Object.keys(metadata).length === 0) {
        return null
    }

    const displayFields = [
        { key: "year", label: "Year" },
        { key: "condition", label: "Condition" },
        { key: "material", label: "Material" },
        { key: "category", label: "Category" }
    ]

    const items = displayFields
        .filter(field => metadata[field.key])
        .map(field => ({
            label: field.label,
            value: metadata[field.key]
        }))

    if (items.length === 0) {
        return null
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Details</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {items.map((item, idx) => (
                        <div key={idx} className="flex justify-between py-2 border-b last:border-0">
                            <span className="text-gray-600 dark:text-gray-400">
                                {item.label}
                            </span>
                            <span className="font-semibold">{item.value}</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
