import { Router } from 'express';
import * as c from '../controllers/config.controller.js';

const router = Router();
router.get('/', c.get);
router.post('/', c.update);
export default router;
