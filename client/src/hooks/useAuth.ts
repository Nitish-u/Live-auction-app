import { useAuthStore } from '@/store/useAuthStore';

export const useAuth = () => {
    const store = useAuthStore();
    return {
        token: store.token,
        user: store.user,
        isAuthenticated: store.isAuthenticated,
        login: store.setAuth,
        logout: store.logout,
    };
};
