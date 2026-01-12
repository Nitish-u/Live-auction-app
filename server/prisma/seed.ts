import { PrismaClient, UserRole } from "@prisma/client";
import { hash } from "bcrypt";

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Starting database seed...");

    const password = await hash("Password123!", 10);

    // Create Admin
    const admin = await prisma.user.upsert({
        where: { email: "admin@example.com" },
        update: {},
        create: {
            email: "admin@example.com",
            password,
            displayName: "Admin User",
            role: UserRole.ADMIN,
            wallet: {
                create: {
                    balance: 1000000,
                },
            },
        },
    });

    console.log(`✅ Admin created: ${admin.email}`);

    // Create User
    const user = await prisma.user.upsert({
        where: { email: "user@example.com" },
        update: {},
        create: {
            email: "user@example.com",
            password,
            displayName: "Demo User",
            role: UserRole.USER,
            wallet: {
                create: {
                    balance: 5000,
                },
            },
        },
    });

    console.log(`✅ User created: ${user.email}`);

    console.log("\nCredentials:");
    console.log("Admin: admin@example.com / Password123!");
    console.log("User:  user@example.com / Password123!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
