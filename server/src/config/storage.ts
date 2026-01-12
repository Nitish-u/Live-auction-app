import dotenv from "dotenv"

dotenv.config()

export interface StorageConfig {
    local: {
        enabled: boolean
        path: string
    }
    cloud: {
        enabled: boolean
        provider: "s3" | "gcs" | null
        s3?: {
            accessKeyId: string
            secretAccessKey: string
            region: string
            bucket: string
        } | undefined
        gcs?: {
            projectId: string
            keyFile: string
            bucket: string
        } | undefined
    }
}

export const storageConfig: StorageConfig = {
    local: {
        enabled: true,
        path: process.env.UPLOAD_DIR || "./uploads/assets"
    },
    cloud: {
        enabled: !!(process.env.CLOUD_PROVIDER &&
            (process.env.AWS_ACCESS_KEY_ID || process.env.GCS_PROJECT_ID)),
        provider: (process.env.CLOUD_PROVIDER as "s3" | "gcs") || null,
        s3: process.env.AWS_ACCESS_KEY_ID ? {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
            region: process.env.AWS_REGION || "us-east-1",
            bucket: process.env.AWS_S3_BUCKET || ""
        } : undefined,
        gcs: process.env.GCS_PROJECT_ID ? {
            projectId: process.env.GCS_PROJECT_ID,
            keyFile: process.env.GCS_KEY_FILE || "",
            bucket: process.env.GCS_BUCKET || ""
        } : undefined
    }
}

export function isCloudEnabled(): boolean {
    return storageConfig.cloud.enabled && storageConfig.cloud.provider !== null
}

export function isLocalEnabled(): boolean {
    return storageConfig.local.enabled
}
