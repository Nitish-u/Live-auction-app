import fs from "fs"
import path from "path"
import AWS from "aws-sdk"
import { storageConfig, isCloudEnabled, isLocalEnabled } from "../config/storage"

export interface UploadResult {
    url: string
    isCloud: boolean
    error?: string
}

// Configure S3 if enabled
let s3Client: AWS.S3 | null = null
if (isCloudEnabled() && storageConfig.cloud.provider === "s3" && storageConfig.cloud.s3) {
    s3Client = new AWS.S3({
        accessKeyId: storageConfig.cloud.s3.accessKeyId,
        secretAccessKey: storageConfig.cloud.s3.secretAccessKey,
        region: storageConfig.cloud.s3.region
    })
}

export async function uploadAssetImage(
    file: Express.Multer.File,
    directory: string = "assets"
): Promise<UploadResult> {
    if (!file) {
        throw new Error("No file provided")
    }

    // Validate file type
    const allowedMimes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if (!allowedMimes.includes(file.mimetype)) {
        throw new Error("Invalid file type. Only JPEG, PNG, WebP, GIF allowed.")
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
        throw new Error("File size exceeds 5MB limit")
    }

    // Try cloud upload first
    if (isCloudEnabled()) {
        try {
            const cloudUrl = await uploadToCloud(file, directory)
            return {
                url: cloudUrl,
                isCloud: true
            }
        } catch (error) {
            console.warn("Cloud upload failed, falling back to local storage:", error)
        }
    }

    // Fallback to local storage
    if (isLocalEnabled()) {
        const localUrl = uploadToLocal(file, directory)
        return {
            url: localUrl,
            isCloud: false
        }
    }

    throw new Error("No storage backend available")
}

async function uploadToCloud(
    file: Express.Multer.File,
    directory: string
): Promise<string> {
    if (!s3Client || !storageConfig.cloud.s3) {
        throw new Error("S3 not configured")
    }

    const filename = `${Date.now()}-${file.originalname}`
    const key = `${directory}/${filename}`

    const params: AWS.S3.PutObjectRequest = {
        Bucket: storageConfig.cloud.s3.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: "public-read"
    }

    const result = await s3Client.upload(params).promise()
    return result.Location
}

function uploadToLocal(file: Express.Multer.File, directory: string): string {
    const uploadDir = path.join(storageConfig.local.path, directory)

    // Create directory if doesn't exist
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true })
    }

    const filename = `${Date.now()}-${file.originalname}`
    const filepath = path.join(uploadDir, filename)

    // Write file
    fs.writeFileSync(filepath, file.buffer)

    // Return URL (relative to server root)
    // Ensure we use the server URL from env or localhost, AND include /uploads path to match static serve
    return `${process.env.SERVER_URL || "http://localhost:4000"}/uploads/${directory}/${filename}`
}

export async function deleteAssetImage(url: string): Promise<void> {
    if (url.includes("s3") || url.includes("googleapis")) {
        // Cloud deletion (optional, skip for MVP)
        return
    }

    // Local deletion
    const filename = url.split("/").pop()
    if (filename) {
        const filepath = path.join(storageConfig.local.path, filename)
        if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath)
        }
    }
}
