import { Outlet } from "react-router-dom";
import { TopNav } from "./TopNav";

export function AppLayout() {
    return (
        <div className="min-h-screen flex flex-col">
            <TopNav />
            <main className="flex-1 bg-background text-foreground">
                <Outlet />
            </main>
        </div>
    );
}
