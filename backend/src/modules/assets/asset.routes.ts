import { Router } from 'express';
import { AssetController } from './asset.controller';
import { authMiddleware } from '../../common/middlewares/auth.middleware';

const router = Router();
const assetController = new AssetController();

// Public routes (or protected? Prompt implementation plan implies API access)
// Let's protect them for now as it's a user app
router.get('/', assetController.getAllAssets);
router.get('/search', assetController.searchAssets);
router.post('/', assetController.createAsset);

export default router;
