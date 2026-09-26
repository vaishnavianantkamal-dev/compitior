import { Router } from 'express';
import { getPublic } from '../controllers/analysis.controller.js';

const router = Router();
router.get('/:id', getPublic);
export default router;
