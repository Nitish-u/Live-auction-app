import { Router } from 'express';
import {
    createProposal,
    getMySentProposals,
    getMyReceivedProposals,
    acceptProposal,
    rejectProposal,
    counterProposal
} from '../controllers/proposal.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.post('/', authenticate, createProposal);
router.get('/my-sent', authenticate, getMySentProposals);
router.get('/my-assets', authenticate, getMyReceivedProposals);
router.post('/:id/accept', authenticate, acceptProposal);
router.post('/:id/reject', authenticate, rejectProposal);
router.post('/:id/counter', authenticate, counterProposal);

export default router;
