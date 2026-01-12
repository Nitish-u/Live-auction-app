import { useState } from "react"
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogClose, DialogTitle, DialogDescription } from "@/components/ui/dialog"

interface ImageCarouselProps {
    images: string[]
    title: string
}

export function ImageCarousel({ images, title }: ImageCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isModalOpen, setIsModalOpen] = useState(false)

    const goToPrevious = () => {
        setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
    }

    const goToNext = () => {
        setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
    }

    if (!images || images.length === 0) {
        return (
            <div className="w-full aspect-square bg-gray-200 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">No images available</p>
            </div>
        )
    }

    return (
        <>
            {/* Main carousel - smaller */}
            <div className="space-y-4">
                {/* Main image */}
                <div className="relative w-full w-80 aspect-[1.58/1] bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden group">
                    <img
                        src={images[currentIndex]}
                        alt={`${title} - Image ${currentIndex + 1}`}
                        className="w-full h-full object-cover"
                    />

                    {/* Zoom button - top right */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 bg-white/80 dark:bg-black/80 opacity-100 hover:opacity-100"
                        onClick={() => setIsModalOpen(true)}
                        title="Expand image"
                    >
                        <ZoomIn className="w-5 h-5" />
                    </Button>

                    {/* Navigation arrows */}
                    {images.length > 1 && (
                        <>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={goToPrevious}
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={goToNext}
                            >
                                <ChevronRight className="w-6 h-6" />
                            </Button>
                        </>
                    )}

                    {/* Image counter */}
                    {images.length > 1 && (
                        <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                            {currentIndex + 1} / {images.length}
                        </div>
                    )}
                </div>

                {/* Thumbnail strip */}
                {images.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {images.map((image, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentIndex(idx)}
                                className={`flex-shrink-0 w-16 h-16 rounded border-2 overflow-hidden transition-all ${idx === currentIndex
                                    ? "border-blue-500 ring-2 ring-blue-400"
                                    : "border-gray-300 dark:border-gray-600 hover:border-gray-400"
                                    }`}
                            >
                                <img
                                    src={image}
                                    alt={`Thumbnail ${idx + 1}`}
                                    className="w-full h-full object-cover"
                                />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal - fullscreen/expanded view */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-6xl h-screen max-h-screen p-0 bg-black/95 border-0">
                    <DialogTitle className="sr-only">Image Zoom View</DialogTitle>
                    <DialogDescription className="sr-only">
                        Detailed view of image {currentIndex + 1} of {images.length}
                    </DialogDescription>
                    <div className="relative w-full h-full flex flex-col">

                        {/* Close button */}
                        <DialogClose asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-4 right-4 z-10 bg-white/10 hover:bg-white/20 text-white"
                            >
                                <X className="w-6 h-6" />
                            </Button>
                        </DialogClose>

                        {/* Main image - expanded */}
                        <div className="flex-1 flex items-center justify-center overflow-hidden">
                            <img
                                src={images[currentIndex]}
                                alt={`${title} - Image ${currentIndex + 1}`}
                                className="max-w-full max-h-full object-contain"
                            />
                        </div>

                        {/* Navigation */}
                        {images.length > 1 && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="bg-white/10 hover:bg-white/20 text-white h-12 w-12"
                                    onClick={goToPrevious}
                                >
                                    <ChevronLeft className="w-6 h-6" />
                                </Button>
                            </div>
                        )}

                        {images.length > 1 && (
                            <div className="absolute right-0 top-1/2 -translate-y-1/2">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="bg-white/10 hover:bg-white/20 text-white h-12 w-12"
                                    onClick={goToNext}
                                >
                                    <ChevronRight className="w-6 h-6" />
                                </Button>
                            </div>
                        )}

                        {/* Image counter - modal */}
                        {images.length > 1 && (
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm">
                                {currentIndex + 1} / {images.length}
                            </div>
                        )}

                        {/* Thumbnail strip - modal bottom */}
                        {images.length > 1 && (
                            <div className="absolute bottom-20 left-0 right-0 flex gap-2 justify-center px-4 overflow-x-auto pb-2">
                                {images.map((image, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentIndex(idx)}
                                        className={`flex-shrink-0 w-12 h-12 rounded overflow-hidden transition-all border-2 ${idx === currentIndex
                                            ? "border-blue-400 ring-2 ring-blue-400"
                                            : "border-gray-500 hover:border-gray-400 opacity-50 hover:opacity-100"
                                            }`}
                                    >
                                        <img
                                            src={image}
                                            alt={`Thumbnail ${idx + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
