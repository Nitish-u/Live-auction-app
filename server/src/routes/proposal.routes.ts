import { Router } from 'express';
import multer from 'multer';
import {
    createProposal,
    getMySentProposals,
    getMyReceivedProposals,
    acceptProposal,
    rejectProposal,
    counterProposal,
    createMessage,
    getMessages,
    createFinalization,
    uploadFinalizationDocs,
    confirmFinalization,
    getFinalization
} from '../controllers/proposal.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    }
});

router.post('/', authenticate, createProposal);
router.get('/my-sent', authenticate, getMySentProposals);
router.get('/my-assets', authenticate, getMyReceivedProposals);
router.post('/:id/accept', authenticate, acceptProposal);
router.post('/:id/reject', authenticate, rejectProposal);
router.post('/:id/counter', authenticate, counterProposal);

// Chat & Finalization
router.post('/:id/messages', authenticate, createMessage);
router.get('/:id/messages', authenticate, getMessages);
router.post('/:id/finalize', authenticate, createFinalization);
router.post('/:id/finalize/docs', authenticate, upload.array("files", 5), uploadFinalizationDocs);
router.post('/:id/finalize/confirm', authenticate, confirmFinalization);
router.get('/:id/finalize', authenticate, getFinalization);

export default router;
