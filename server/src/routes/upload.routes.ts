import { Router } from "express"
import multer from "multer"
import { uploadAssetImage } from "../services/storage.service"
import { authenticate } from "../middlewares/auth.middleware"

const router = Router()

// Configure multer (memory storage)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    }
})

router.post(
    "/asset-images",
    authenticate,
    upload.array("images", 5), // Max 5 images
    async (req, res) => {
        try {
            const files = req.files as Express.Multer.File[]

            if (!files || files.length === 0) {
                return res.status(400).json({ error: "No files uploaded" })
            }

            const uploadResults = await Promise.all(
                files.map(file => uploadAssetImage(file, "assets"))
            )

            const urls = uploadResults.map(result => result.url)

            // Only check the first result for storage type as they should be consistent in this batch
            // But if mixed (due to fallback happening per file), we report what happened.
            // The prompt code simplified this to: storage: uploadResults[0]?.isCloud ? "cloud" : "local"

            res.json({
                urls,
                message: `${urls.length} image(s) uploaded successfully`,
                storage: uploadResults[0]?.isCloud ? "cloud" : "local"
            })
        } catch (error) {
            console.error("Upload error:", error)
            res.status(500).json({
                error: error instanceof Error ? error.message : "Upload failed"
            })
        }
    }
)

router.post(
    "/avatar",
    authenticate,
    upload.single("avatar"),
    async (req, res) => {
        try {
            const file = req.file

            if (!file) {
                return res.status(400).json({ error: "No file uploaded" })
            }

            const result = await uploadAssetImage(file, "avatars")

            res.json({
                url: result.url,
                storage: result.isCloud ? "cloud" : "local"
            })
        } catch (error) {
            console.error("Upload error:", error)
            res.status(500).json({
                error: error instanceof Error ? error.message : "Upload failed"
            })
        }
    }
)

export default router
