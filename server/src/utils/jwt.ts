import jwt from "jsonwebtoken";
import { env } from "../config/env";

export const token = {
    sign: (payload: object) => {
        return jwt.sign(payload, env.JWT_SECRET, { expiresIn: "15m", algorithm: "HS256" });
    },
    verify: (token: string) => {
        return jwt.verify(token, env.JWT_SECRET);
    },
};
