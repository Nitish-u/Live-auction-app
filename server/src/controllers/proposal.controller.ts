import { Request, Response } from 'express';
import { proposalService } from '../services/proposal.service';

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
