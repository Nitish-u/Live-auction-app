import { useState } from "react"
import { Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { api } from "@/lib/api"

interface AssetUploadInputProps {
    onUpload: (urls: string[]) => void
    maxFiles?: number
}

export function AssetUploadInput({ onUpload, maxFiles = 5 }: AssetUploadInputProps) {
    const [files, setFiles] = useState<File[]>([])
    const [uploading, setUploading] = useState(false)
    const [progress, setProgress] = useState(0)

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()

        const droppedFiles = Array.from(e.dataTransfer.files)
        addFiles(droppedFiles)
    }

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || [])
        addFiles(selectedFiles)
    }

    const addFiles = (newFiles: File[]) => {
        // Validate file types
        const imageFiles = newFiles.filter(file =>
            file.type.startsWith("image/")
        )

        if (imageFiles.length !== newFiles.length) {
            toast.error("Only image files are allowed")
        }

        // Check total count
        if (files.length + imageFiles.length > maxFiles) {
            toast.error(`Maximum ${maxFiles} files allowed`)
            return
        }

        setFiles(prev => [...prev, ...imageFiles])
    }

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index))
    }

    const handleUpload = async () => {
        if (files.length === 0) {
            toast.error("No files selected")
            return
        }

        setUploading(true)
        setProgress(0)

        try {
            const formData = new FormData()
            files.forEach(file => formData.append("images", file))

            const { data } = await api.post<{ urls: string[] }>("/upload/asset-images", formData, {
                headers: {
                    "Content-Type": "multipart/form-data"
                },
                onUploadProgress: (event: any) => {
                    if (event.total) {
                        const progressPercent = Math.round((event.loaded / event.total) * 100)
                        setProgress(progressPercent)
                    }
                }
            })
            const { urls } = data

            toast.success(`${urls.length} image(s) uploaded successfully!`)
            onUpload(urls)
            setFiles([])
            setProgress(0)
        } catch (error) {
            const message = error instanceof Error ? error.message : "Upload failed"
            toast.error(message)
            console.error("Upload error:", error)
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="w-full max-w-2xl mx-auto">
            {/* Drop zone */}
            <div
                onDrop={handleDrop}
                onDragOver={e => e.preventDefault()}
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center 
                   hover:border-gray-400 dark:hover:border-gray-500 transition-colors cursor-pointer
                   bg-gray-50 dark:bg-gray-900"
            >
                <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Drag and drop images here, or click to select
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Max {maxFiles} images, 5MB each
                </p>

                <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileInput}
                    className="hidden"
                    id="file-input"
                />
                <label htmlFor="file-input" className="cursor-pointer">
                    <Button variant="outline" className="mt-4" asChild>
                        <span>Select Files</span>
                    </Button>
                </label>
            </div>

            {/* Selected files preview */}
            {files.length > 0 && (
                <div className="mt-6">
                    <h3 className="text-sm font-medium mb-3">
                        Selected Files ({files.length}/{maxFiles})
                    </h3>

                    <div className="space-y-2">
                        {files.map((file, idx) => (
                            <div
                                key={idx}
                                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded border"
                            >
                                <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                                    {file.name}
                                </span>
                                <button
                                    onClick={() => removeFile(idx)}
                                    disabled={uploading}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Upload progress */}
                    {uploading && (
                        <div className="mt-4">
                            <Progress value={progress} className="h-2" />
                            <p className="text-xs text-gray-500 mt-1">{progress}% uploaded</p>
                        </div>
                    )}

                    {/* Upload button */}
                    <Button
                        onClick={handleUpload}
                        disabled={uploading}
                        className="mt-4 w-full"
                    >
                        {uploading ? `Uploading... (${progress}%)` : "Upload Images"}
                    </Button>
                </div>
            )}
        </div>
    )
}
