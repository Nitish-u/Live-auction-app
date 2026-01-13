import { Request, Response } from 'express';
import { proposalService } from '../services/proposal.service';
import { proposalChatService } from '../services/proposal-chat.service';
import { proposalFinalizationService } from '../services/proposal-finalization.service';
import { uploadProposalDoc } from '../services/storage.service';

export const createProposal = async (req: Request, res: Response) => {
    try {
        const { assetId, proposedAmount } = req.body;
        const buyerId = (req as any).user.id;

        const proposal = await proposalService.createProposal(buyerId, assetId, Number(proposedAmount));
        res.status(201).json(proposal);
    } catch (error: any) {
        res.status(error.statusCode || 500).json({ message: error.message || "Internal Server Error" });
    }
};

export const getMySentProposals = async (req: Request, res: Response) => {
    try {
        const buyerId = (req as any).user.id;
        const proposals = await proposalService.getBuyerProposals(buyerId);
        res.json(proposals);
    } catch (error: any) {
        res.status(error.statusCode || 500).json({ message: error.message || "Internal Server Error" });
    }
};

export const getMyReceivedProposals = async (req: Request, res: Response) => {
    try {
        const sellerId = (req as any).user.id;
        const { assetId } = req.query;
        const proposals = await proposalService.getSellerProposals(sellerId, assetId as string);
        res.json(proposals);
    } catch (error: any) {
        res.status(error.statusCode || 500).json({ message: error.message || "Internal Server Error" });
    }
};

export const acceptProposal = async (req: Request, res: Response) => {
    try {
        const sellerId = (req as any).user.id;
        const { id } = req.params;
        if (!id) throw { statusCode: 400, message: "Missing proposal ID" };
        const proposal = await proposalService.acceptProposal(sellerId, id);
        res.json(proposal);
    } catch (error: any) {
        res.status(error.statusCode || 500).json({ message: error.message || "Internal Server Error" });
    }
};

export const rejectProposal = async (req: Request, res: Response) => {
    try {
        const sellerId = (req as any).user.id;
        const { id } = req.params;
        if (!id) throw { statusCode: 400, message: "Missing proposal ID" };
        const proposal = await proposalService.rejectProposal(sellerId, id);
        res.json(proposal);
    } catch (error: any) {
        res.status(error.statusCode || 500).json({ message: error.message || "Internal Server Error" });
    }
};

export const counterProposal = async (req: Request, res: Response) => {
    try {
        const sellerId = (req as any).user.id;
        const { id } = req.params;
        if (!id) throw { statusCode: 400, message: "Missing proposal ID" };
        const { proposedAmount } = req.body;
        const proposal = await proposalService.counterProposal(sellerId, id, Number(proposedAmount));
        res.status(201).json(proposal);
    } catch (error: any) {
        res.status(error.statusCode || 500).json({ message: error.message || "Internal Server Error" });
    }
};

export const createMessage = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { id } = req.params;
        const { content } = req.body;

        if (!content) throw { statusCode: 400, message: "Content is required" };

        if (!id) throw { statusCode: 400, message: "Missing proposal ID" };
        const message = await proposalChatService.createMessage(id, userId, content);

        // Emit socket event (will be handled by socket service/controller hook but for now we might need to emit here or service emits)
        // Ideally controller calls service, and service or controller emits.
        // Spec says "Message sent via API, broadcast to room".
        // We need access to io instance. Usually app.set('io', io) and req.app.get('io').
        const io = req.app.get('io');
        if (io) {
            io.to(`proposal:${id}`).emit(`proposal:${id}:message`, message);
        }

        res.status(201).json(message);
    } catch (error: any) {
        res.status(error.statusCode || 500).json({ message: error.message || "Internal Server Error" });
    }
};

export const getMessages = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        if (!id) throw { statusCode: 400, message: "Missing proposal ID" };
        const { limit, offset } = req.query;
        const messages = await proposalChatService.getMessages(id, Number(limit) || 50, Number(offset) || 0);
        res.json(messages);
    } catch (error: any) {
        res.status(error.statusCode || 500).json({ message: error.message || "Internal Server Error" });
    }
};

export const createFinalization = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        if (!id) throw { statusCode: 400, message: "Missing proposal ID" };
        const finalization = await proposalFinalizationService.createFinalization(id);
        res.status(201).json(finalization);
    } catch (error: any) {
        res.status(error.statusCode || 500).json({ message: error.message || "Internal Server Error" });
    }
};

export const uploadFinalizationDocs = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { id } = req.params;
        const files = req.files as Express.Multer.File[];

        if (!files || files.length === 0) {
            throw { statusCode: 400, message: "No files uploaded" };
        }

        const uploadResults = await Promise.all(
            files.map(file => uploadProposalDoc(file))
        );

        const urls = uploadResults.map(result => result.url);

        if (!id) throw { statusCode: 400, message: "Missing proposal ID" };
        const finalization = await proposalFinalizationService.uploadDocs(id, userId, urls);

        res.json({
            finalizationId: finalization.id,
            docsUrl: urls
        });
    } catch (error: any) {
        res.status(error.statusCode || 500).json({ message: error.message || "Internal Server Error" });
    }
};

export const confirmFinalization = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { id } = req.params;
        if (!id) throw { statusCode: 400, message: "Missing proposal ID" };
        const finalization = await proposalFinalizationService.confirmFinalization(id, userId);
        res.json(finalization);
    } catch (error: any) {
        res.status(error.statusCode || 500).json({ message: error.message || "Internal Server Error" });
    }
};

export const getFinalization = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        if (!id) throw { statusCode: 400, message: "Missing proposal ID" };
        const finalization = await proposalFinalizationService.getFinalization(id);
        // if (!finalization) throw { statusCode: 404, message: "Finalization not found" }; 
        // Frontend expects null or empty if not found? 
        // Spec says "Response: { ... }". If it doesn't exist, user sees "Finalization not available yet".
        // Service returns null if not found.
        res.json(finalization);
    } catch (error: any) {
        res.status(error.statusCode || 500).json({ message: error.message || "Internal Server Error" });
    }
};
