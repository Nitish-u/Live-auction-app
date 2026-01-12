import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { AssetUploadInput } from "@/components/assets/AssetUploadInput"
import { api } from "@/lib/api"

// Validation schema
const createAssetSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    year: z.string().optional(),
    condition: z.enum(["Excellent", "Good", "Fair", "Poor"]).optional(),
    material: z.string().optional(),
    category: z.string().optional()
})

type CreateAssetFormValues = z.infer<typeof createAssetSchema>

interface CreateAssetFormProps {
    onSuccess?: () => void
}

export function CreateAssetForm({ onSuccess }: CreateAssetFormProps) {
    const navigate = useNavigate()
    const [uploadedImages, setUploadedImages] = useState<string[]>([])
    const [submitting, setSubmitting] = useState(false)

    const form = useForm<CreateAssetFormValues>({
        resolver: zodResolver(createAssetSchema),
        mode: "onBlur",
        defaultValues: {
            title: "",
            description: "",
            year: undefined,
            condition: undefined,
            material: "",
            category: ""
        }
    })

    const onSubmit = async (data: CreateAssetFormValues) => {
        if (uploadedImages.length === 0) {
            toast.error("Please upload at least one image")
            return
        }

        setSubmitting(true)

        try {
            await api.post("/assets", {
                title: data.title,
                description: data.description,
                images: uploadedImages,
                metadata: {
                    year: data.year ? parseInt(data.year) : undefined,
                    condition: data.condition,
                    material: data.material,
                    category: data.category
                }
            })

            toast.success("Asset created successfully! Pending admin review.")

            if (onSuccess) {
                onSuccess()
            } else {
                navigate("/profile")
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to create asset"
            toast.error(message)
        } finally {
            setSubmitting(false)
        }
    }

    const handleImagesUpload = (urls: string[]) => {
        setUploadedImages(urls)
        toast.success(`${urls.length} image(s) added to asset`)
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold">Create New Asset</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                    Upload your item and provide details for admin review
                </p>
            </div>

            {/* Image upload section */}
            <div className="mb-8 p-6 bg-gray-50 dark:bg-gray-900 rounded-lg border">
                <h2 className="text-lg font-semibold mb-4">Upload Images</h2>
                <AssetUploadInput onUpload={handleImagesUpload} />

                {uploadedImages.length > 0 && (
                    <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
                        <p className="text-sm text-green-800 dark:text-green-200">
                            ✓ {uploadedImages.length} image(s) uploaded
                        </p>
                    </div>
                )}
            </div>

            {/* Form section */}
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                    {/* Title */}
                    <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Title *</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="e.g., Vintage Oak Chair"
                                        {...field}
                                    />
                                </FormControl>
                                <FormDescription>
                                    What is the name of your item?
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Description */}
                    <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Description *</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="Describe your item in detail. Include condition, features, history, etc."
                                        className="resize-none h-32"
                                        {...field}
                                    />
                                </FormControl>
                                <FormDescription>
                                    Minimum 10 characters. Be detailed to attract buyers.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Two column for optional fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                        {/* Year */}
                        <FormField
                            control={form.control}
                            name="year"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Year (Optional)</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            placeholder="e.g., 1950"
                                            {...field}
                                            value={field.value || ""}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Condition */}
                        <FormField
                            control={form.control}
                            name="condition"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Condition (Optional)</FormLabel>
                                    <Select value={field.value || ""} onValueChange={field.onChange}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select condition" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="Excellent">Excellent</SelectItem>
                                            <SelectItem value="Good">Good</SelectItem>
                                            <SelectItem value="Fair">Fair</SelectItem>
                                            <SelectItem value="Poor">Poor</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                    </div>

                    {/* Material */}
                    <FormField
                        control={form.control}
                        name="material"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Material (Optional)</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="e.g., Oak, Gold, Ceramic"
                                        {...field}
                                    />
                                </FormControl>
                                <FormDescription>
                                    What is it made of?
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Category */}
                    <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Category (Optional)</FormLabel>
                                <Select value={field.value || ""} onValueChange={field.onChange}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="Vintage">Vintage</SelectItem>
                                        <SelectItem value="Antique">Antique</SelectItem>
                                        <SelectItem value="Art">Art</SelectItem>
                                        <SelectItem value="Collectible">Collectible</SelectItem>
                                        <SelectItem value="Jewelry">Jewelry</SelectItem>
                                        <SelectItem value="Furniture">Furniture</SelectItem>
                                        <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Submit button */}
                    <div className="flex gap-4">
                        <Button
                            type="submit"
                            disabled={submitting || uploadedImages.length === 0}
                            className="flex-1"
                        >
                            {submitting ? "Creating Asset..." : "Create Asset"}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate(-1)}
                        >
                            Cancel
                        </Button>
                    </div>

                    {uploadedImages.length === 0 && (
                        <p className="text-sm text-orange-600 dark:text-orange-400">
                            ⚠️ Please upload at least one image before submitting
                        </p>
                    )}
                </form>
            </Form>
        </div>
    )
}
