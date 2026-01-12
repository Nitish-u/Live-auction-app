import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { getSellerAssets } from '../controllers/asset.gallery.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate';
import { getSellerAssetsSchema } from '../validators/asset.gallery.schema';

const router = Router();

// Public routes


// Protected routes
// Note: 'me' must come before ':id' if they were in the same pattern order, 
// but since 'me' is specific path, we should put it BEFORE /:id if /:id matches 'me'.
// However, since /:id is typically a UUID, 'me' might not match it if specific regex is used,
// but to be safe, specific routes first.

// Wait, the spec said:
// GET /api/v1/users/:id
// GET /api/v1/users/me
// If I define /:id before /me, then /me will be treated as an ID "me".
// So I MUST define /me first.

router.get('/me', authenticate, userController.getMyProfile);
router.put('/me', authenticate, userController.updateMyProfile);

// Public profile last to avoid collision
router.get('/:id', userController.getPublicProfile);

// Seller Assets
router.get(
    '/:id/assets',
    validate(getSellerAssetsSchema),
    getSellerAssets
);

export default router;
