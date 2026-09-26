import { Router } from 'express';
import * as c from '../controllers/insights.controller.js';

const router = Router();
router.get('/competitors', c.competitors);
router.get('/summary', c.summary);
export default router;
