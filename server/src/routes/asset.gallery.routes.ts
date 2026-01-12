import { Router } from 'express';
import { getPublicAssets } from '../controllers/asset.gallery.controller';
import { validate } from '../middlewares/validate';
import { getPublicAssetsSchema } from '../validators/asset.gallery.schema';

const router = Router();

// GET /api/v1/assets
// Public access, no auth required
router.get(
    '/',
    validate(getPublicAssetsSchema),
    getPublicAssets
);

export default router;
