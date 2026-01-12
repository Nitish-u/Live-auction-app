import bcrypt from "bcrypt";

// Using bcrypt as requested
export const password = {
    hash: async (pwd: string) => {
        return await bcrypt.hash(pwd, 10);
    },
    compare: async (pwd: string, hash: string) => {
        return await bcrypt.compare(pwd, hash);
    },
};
