import { Request, Response } from 'express';
import * as userService from '../services/user.service';
import { updateProfileSchema } from '../validators/user.schema';

export const getPublicProfile = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: 'User ID required' });
        }
        const user = await userService.getUserPublicProfile(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getMyProfile = async (req: Request, res: Response) => {
    try {
        // Assuming req.user is populated by auth middleware
        const userId = (req as any).user?.userId || (req as any).user?.id || (req as any).user?.sub;

        if (!userId || typeof userId !== 'string') {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const user = await userService.getUserPrivateProfile(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const updateMyProfile = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId || (req as any).user?.id || (req as any).user?.sub;

        if (!userId || typeof userId !== 'string') {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const result = updateProfileSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({ errors: result.error.flatten() });
        }

        const updateData: any = {};
        if (result.data.displayName !== undefined) updateData.displayName = result.data.displayName;
        if (result.data.avatarUrl !== undefined) updateData.avatarUrl = result.data.avatarUrl;
        if (result.data.bio !== undefined) updateData.bio = result.data.bio;

        const updatedUser = await userService.updateUserProfile(userId, updateData);
        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};

