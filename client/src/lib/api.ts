import axios, { isAxiosError } from "axios";

export const api = axios.create({
    baseURL: "/api/v1",
});

import { useAuthStore } from "@/store/useAuthStore";

api.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    } else {
        console.warn("[API] No token found in store for request:", config.url);
    }
    return config;
});

export interface LoginParams {
    email: string;
    password: string;
}

export interface RegisterParams {
    email: string;
    password: string;
    confirmPassword?: string; // Optional here as we validate in frontend, but backend likely expects it or just ignores
}

export interface AuthResponse {
    token: string;
    user: {
        id: string;
        email: string;
        role: string;
    };
}

export const login = async (params: LoginParams) => {
    const { data } = await api.post<AuthResponse>("/auth/login", params);
    return data;
};

export const register = async (params: RegisterParams) => {
    // Ensuring we send what backend likely expects. 
    const { data } = await api.post<AuthResponse>("/auth/register", params);
    return data;
};

export const getFriendlyErrorMessage = (error: unknown) => {
    if (isAxiosError(error) && error.response) {
        // specific check for login failure to avoid generic "Please log in" message
        if (error.response.status === 401 && error.config?.url?.includes("/auth/login")) {
            return "Invalid email or password.";
        }
        if (error.response.status === 401) return "Please log in to perform this action.";
        if (error.response.status === 403) return "You do not have permission to do this.";
        if (error.response.status === 404) return "The requested resource was not found.";
        const data = error.response.data as { message?: string, error?: { message?: string } };
        return data?.message || data?.error?.message || "Something went wrong. Please try again.";
    }
    return "Network error. Please check your connection.";
};

export interface Auction {
    id: string;
    assetId: string;
    sellerId: string;
    startTime: string;
    endTime: string;
    status: "SCHEDULED" | "LIVE" | "ENDED" | "CANCELLED";
    createdAt: string;
    updatedAt: string;
    asset: {
        title: string;
        description: string;
        images: string[];
    };
    seller: {
        id: string;
        email: string;
        displayName?: string;
        avatarUrl?: string;
    };
    bids?: {
        amount: number;
        bidder: {
            email: string;
            displayName?: string;
            avatarUrl?: string;
        };
    }[];
    escrow?: {
        id: string;
        buyerId: string;
        status: "HOLDING" | "RELEASED" | "REFUNDED";
    };
}

export interface ListAuctionsParams {
    page?: number;
    limit?: number;
    sortBy?: "startTime" | "endTime";
    sortOrder?: "asc" | "desc";
    status?: "SCHEDULED" | "LIVE";
}

export interface PaginationMeta {
    total: number;
    page: number;
    limit: number;
    totalPages?: number;
}

export const fetchAuctions = async (params: ListAuctionsParams) => {
    const { data } = await api.get<{ data: Auction[]; meta: PaginationMeta }>("/auctions", {
        params,
    });
    return data;
};

export const fetchAuction = async (id: string) => {
    const { data } = await api.get<Auction>(`/auctions/${id}`);
    return data;
};

// Feature 26: Schedule Auction
export interface ScheduleAuctionRequest {
    assetId: string;
    startTime: string; // ISO 8601
    endTime: string;   // ISO 8601
}

export interface AuctionResponse {
    id: string;
    assetId: string;
    sellerId: string;
    startTime: string;
    endTime: string;
    status: "SCHEDULED" | "LIVE" | "ENDED" | "CANCELLED";
}

export async function scheduleAuction(data: ScheduleAuctionRequest): Promise<AuctionResponse> {
    const response = await api.post("/auctions", data);
    return response.data;
}

export interface Bid {
    id: string;
    amount: number;
    createdAt: string;
    bidder: {
        id: string;
        email: string;
        displayName?: string;
        avatarUrl?: string;
    };
}

export const placeBid = async (auctionId: string, amount: number) => {
    const { data } = await api.post<{ status: string; currentHighestBid: number }>("/bids", {
        auctionId,
        amount,
    });
    return data;
};

export const fetchBids = async (auctionId: string) => {
    const { data } = await api.get<Bid[]>(`/auctions/${auctionId}/bids`);
    return data;
};

export interface Message {
    id: string;
    content: string;
    sender: {
        id: string;
        email: string;
        displayName?: string;
        avatarUrl?: string;
    };
    createdAt: string;
}

export const fetchMessages = async (auctionId: string) => {
    const { data } = await api.get<Message[]>(`/auctions/${auctionId}/messages`);
    return data;
};

export const sendMessage = async (auctionId: string, content: string) => {
    const { data } = await api.post<Message>(`/auctions/${auctionId}/messages`, { content });
    return data;
};

// Disputes
export interface Dispute {
    id: string;
    escrowId: string;
    buyerId: string;
    reason: string;
    status: "OPEN" | "RESOLVED";
    createdAt: string;
    escrow: {
        id: string;
        amount: string;
        status: "HOLDING" | "REFUNDED" | "RELEASED";
        auction: { title: string; asset: { title: string } };
    };
    buyer: { email: string };
}

export const raiseDispute = async (escrowId: string, reason: string) => {
    const { data } = await api.post(`/escrows/${escrowId}/dispute`, { reason });
    return data;
};

export const fetchDisputes = async () => {
    const { data } = await api.get<Dispute[]>("/admin/disputes");
    return data;
};

export const resolveDispute = async (disputeId: string, resolution: "REFUND" | "RELEASE") => {
    const { data } = await api.post(`/admin/disputes/${disputeId}/resolve`, { resolution });
    return data;
};
// User Profiles
export interface UserPublicProfile {
    id: string;
    displayName: string | null;
    avatarUrl: string | null;
    bio: string | null;
    createdAt: string;
}

export interface UserPrivateProfile extends UserPublicProfile {
    email: string;
}

export const fetchPublicProfile = async (id: string) => {
    const { data } = await api.get<UserPublicProfile>(`/users/${id}`);
    return data;
};

export const fetchMyProfile = async () => {
    const { data } = await api.get<UserPrivateProfile>("/users/me");
    return data;
};

export const updateMyProfile = async (data: { displayName?: string; avatarUrl?: string; bio?: string }) => {
    const { data: updated } = await api.put<UserPrivateProfile>("/users/me", data);
    return updated;
};

export const changePassword = async (data: { currentPassword: string; newPassword: string }) => {
    const { data: response } = await api.post<{ message: string }>("/auth/change-password", data);
    return response;
};

export const forgotPassword = async (email: string) => {
    const { data } = await api.post<{ message: string }>("/auth/forgot-password", { email });
    return data;
};

export const resetPassword = async (token: string, newPassword: string) => {
    const { data } = await api.post<{ message: string }>("/auth/reset-password", { token, newPassword });
    return data;
};

export interface Notification {
    id: string;
    userId: string;
    title: string;
    message: string;
    isRead: boolean;
    type: string;
    metadata?: Record<string, unknown>;
    createdAt: string;
}

export const notifications = {
    async list(params?: { unread?: boolean; limit?: number }) {
        const { data } = await api.get<{ items: Notification[], unreadCount: number }>("/notifications", { params });
        return data;
    },
    async markRead(id: string) {
        const { data } = await api.post(`/notifications/${id}/read`);
        return data;
    }
};

// Assets
export interface Asset {
    id: string;
    title: string;
    description: string;
    images: string[];
    owner: {
        id: string;
        email: string;
        displayName: string | null;
        avatarUrl: string | null;
    };
    auction: {
        id: string;
        status: "SCHEDULED" | "LIVE" | "ENDED" | "CANCELLED";
    } | null;
    metadata?: {
        year?: number;
        condition?: string;
        material?: string;
        category?: string;
        [key: string]: string | number | undefined;
    };
    status: "DRAFT" | "PENDING_REVIEW" | "APPROVED" | "REJECTED";
    rejectionReason?: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface CreateAssetRequest {
    title: string
    description: string
    images: string[]
    metadata?: {
        year?: number
        condition?: "Excellent" | "Good" | "Fair" | "Poor"
        material?: string
        category?: string
    }
}

export async function createAsset(data: CreateAssetRequest) {
    return api.post("/assets", data)
}

export interface FetchAssetsParams {
    page?: number;
    limit?: number;
    sellerId?: string;
    hasAuction?: boolean;
}

export const fetchAssets = async (params: FetchAssetsParams) => {
    const { data } = await api.get<{ items: Asset[]; totalPages: number; page: number; totalItems: number }>("/assets", {
        params,
    });
    return data;
};

export const fetchSellerAssets = async (userId: string, page: number = 1, limit: number = 12) => {
    const { data } = await api.get<{ items: Asset[]; totalPages: number; page: number; totalItems: number }>(`/users/${userId}/assets`, {
        params: { page, limit }
    });
    return data;
};

export const fetchMyAssets = async () => {
    const { data } = await api.get<{ assets: Asset[] }>("/assets/my");
    return data.assets;
};

// Dashboards
export interface SellerDashboardStats {
    assets: {
        total: number;
        approved: number;
        pending: number;
    };
    auctions: {
        scheduled: number;
        live: number;
        ended: number;
    };
    earnings: {
        totalReleased: string;
        inEscrow: string;
    };
}

export interface BidderDashboardStats {
    bids: {
        active: number;
        won: number;
        lost: number;
    };
    wallet: {
        balance: string;
        locked: string;
    };
}

export interface AdminDashboardStats {
    assets: {
        pendingReview: number;
        total?: number; // Optional if not used
    };
    auctions: {
        live: number;
    };
    escrows: {
        holding: number;
    };
    disputes: {
        open: number;
    };
}

export const getSellerDashboard = async () => {
    const { data } = await api.get<SellerDashboardStats>("/dashboard/seller");
    return data;
};

export const getBidderDashboard = async () => {
    const { data } = await api.get<BidderDashboardStats>("/dashboard/bidder");
    return data;
};

export const getAdminDashboard = async () => {
    const { data } = await api.get<AdminDashboardStats>("/dashboard/admin");
    return data;
};

// Proposals (Feature 22)
export interface BidProposal {
    id: string;
    assetId: string;
    assetTitle: string;
    buyerId: string;
    buyerName: string;
    buyerAvatar: string;
    proposedAmount: string;
    status: "PENDING" | "ACCEPTED" | "REJECTED";
    createdAt: string;
}

export const fetchIncomingProposals = async () => {
    const { data } = await api.get<{ proposals: BidProposal[] }>("/proposals/my-incoming");
    return data;
};

// Add to your asset upload function
export async function uploadAssetImages(files: File[]): Promise<string[]> {
    const formData = new FormData()
    files.forEach(f => formData.append("images", f))

    const { data } = await api.post<{ urls: string[], storage: string }>("/upload/asset-images", formData, {
        headers: {
            "Content-Type": "multipart/form-data"
        }
    })

    return data.urls
}
