import { Link } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowRight } from "lucide-react"

interface SellerCardProps {
    seller: {
        id: string
        email: string
        displayName?: string
        avatarUrl?: string
    }
}

export function SellerCard({ seller }: SellerCardProps) {
    return (
        <Card>
            <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-6">
                    <Avatar className="w-16 h-16">
                        <AvatarImage src={seller.avatarUrl} />
                        <AvatarFallback>
                            {seller.displayName?.[0] || seller.email[0]}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <h3 className="font-semibold text-lg">
                            {seller.displayName || "Seller"}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {seller.email}
                        </p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" asChild>
                        <Link to={`/users/${seller.id}`}>
                            View Profile
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Link>
                    </Button>
                    <Button variant="outline" className="flex-1" asChild>
                        <Link to={`/users/${seller.id}/assets`}>
                            See All Items
                        </Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
