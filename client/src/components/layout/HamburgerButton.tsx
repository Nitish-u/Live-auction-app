import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HamburgerButtonProps {
    isOpen: boolean;
    onToggle: () => void;
}

export function HamburgerButton({ isOpen, onToggle }: HamburgerButtonProps) {
    return (
        <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onToggle}
            aria-label="Toggle Menu"
        >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
    );
}
