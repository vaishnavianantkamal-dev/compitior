import { Router } from 'express';
import * as c from '../controllers/analysis.controller.js';

const router = Router();
router.post('/', c.create);
router.get('/', c.list);
router.get('/:id', c.getOne);
router.delete('/:id', c.remove);
router.post('/:id/rerun', c.rerun);
router.get('/:id/markdown', c.markdown);
router.post('/:id/share', c.share);
router.post('/:id/save', c.toggleSave);
router.post('/:id/publish', c.publish);
export default router;
