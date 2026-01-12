
import { jwtDecode } from "jwt-decode";

interface UserToken {
    sub: string;
    email: string; // Assuming we add email to token? 
    // Wait, backend token.sign({ sub: user.id, role: user.role })
    // We didn't explicitly put email in token in backend.
    role: string;
}

export const getCurrentUser = (): UserToken | null => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    try {
        return jwtDecode<UserToken>(token);
    } catch {
        return null;
    }
};
