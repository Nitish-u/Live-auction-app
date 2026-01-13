import prisma from "../config/prisma";

export const getUserPublicProfile = async (id: string) => {
    return prisma.user.findUnique({
        where: { id },
        select: {
            id: true,
            displayName: true,
            avatarUrl: true,
            bio: true,
            createdAt: true,
        },
    });
};

export const getUserPrivateProfile = async (id: string) => {
    return prisma.user.findUnique({
        where: { id },
        select: {
            id: true,
            email: true,
            displayName: true,
            avatarUrl: true,
            bio: true,
        },
    });
};

export const updateUserProfile = async (id: string, data: { displayName?: string; avatarUrl?: string; bio?: string }) => {
    // Normalize empty strings to null if desired, or let frontend handle it.
    // Spec says: "Empty strings normalized to null".

    const cleanData: any = { ...data };
    if (cleanData.displayName === '') cleanData.displayName = null;
    if (cleanData.avatarUrl === '') cleanData.avatarUrl = null;
    if (cleanData.bio === '') cleanData.bio = null;

    return prisma.user.update({
        where: { id },
        data: cleanData,
        select: {
            id: true,
            email: true,
            displayName: true,
            avatarUrl: true,
            bio: true,
        },
    });
};
