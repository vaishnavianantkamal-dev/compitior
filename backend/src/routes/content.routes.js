import { Router } from 'express';
import * as c from '../controllers/content.controller.js';

const router = Router();
router.post('/topics', c.topics);
router.get('/articles', c.list);
router.post('/articles', c.create);
router.get('/articles/:id', c.getOne);
router.delete('/articles/:id', c.remove);
router.get('/articles/:id/markdown', c.markdown);
export default router;
