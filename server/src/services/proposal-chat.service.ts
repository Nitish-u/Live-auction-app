import prisma from '../config/prisma';
import { ProposalMessage } from '@prisma/client';

export class ProposalChatService {
    async createMessage(proposalId: string, senderId: string, content: string): Promise<ProposalMessage> {
        // Validate proposal and user participation
        const proposal = await prisma.bidProposal.findUnique({
            where: { id: proposalId },
        });

        if (!proposal) {
            throw new Error('Proposal not found');
        }

        if (proposal.status !== 'ACCEPTED') {
            throw new Error('Chat is only available for accepted proposals');
        }

        if (proposal.buyerId !== senderId && proposal.sellerId !== senderId) {
            throw new Error('User is not a participant in this proposal');
        }

        return prisma.proposalMessage.create({
            data: {
                proposalId,
                senderId,
                content,
            },
            include: {
                sender: {
                    select: {
                        displayName: true,
                        avatarUrl: true,
                    },
                },
            },
        });
    }

    async getMessages(proposalId: string, limit: number = 50, offset: number = 0): Promise<ProposalMessage[]> {
        return prisma.proposalMessage.findMany({
            where: { proposalId },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset,
            include: {
                sender: {
                    select: {
                        displayName: true,
                        avatarUrl: true,
                    },
                },
            },
        });
    }
}

export const proposalChatService = new ProposalChatService();
