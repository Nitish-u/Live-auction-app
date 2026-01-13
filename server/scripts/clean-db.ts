import 'dotenv/config';
import prisma from "../src/config/prisma";

async function main() {
    console.log("🧹 Cleaning up database...");

    // Delete in order of dependencies (Child -> Parent)
    await prisma.notification.deleteMany();
    await prisma.bidProposal.deleteMany();
    await prisma.dispute.deleteMany();
    await prisma.escrow.deleteMany();
    await prisma.message.deleteMany();
    await prisma.bid.deleteMany();
    await prisma.auction.deleteMany();
    await prisma.asset.deleteMany();
    await prisma.passwordResetToken.deleteMany();
    await prisma.wallet.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.user.deleteMany();

    console.log("✨ Database cleaned successfully.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
