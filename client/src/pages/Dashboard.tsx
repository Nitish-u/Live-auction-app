import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getCurrentUser } from "@/lib/auth";
import { getSellerDashboard, getBidderDashboard, getAdminDashboard } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DisputeManagerTab } from "@/components/admin/DisputeManagerTab";
import { RecentAuctionsTable } from "@/components/dashboard/RecentAuctionsTable";
import { RecentAssetsWidget } from "@/components/dashboard/RecentAssetsWidget";
import { ActiveBidsTable } from "@/components/dashboard/ActiveBidsTable";
import { WonAuctionsWidget } from "@/components/dashboard/WonAuctionsWidget";

// Helper for currency formatting if not available
const formatMoney = (amount: string | number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(amount));
};

export function Dashboard() {
    const user = getCurrentUser();
    const isAdmin = user?.role === "ADMIN";

    const { data: sellerData, isLoading: isSellerLoading } = useQuery({
        queryKey: ["dashboard", "seller"],
        queryFn: getSellerDashboard,
    });

    const { data: bidderData, isLoading: isBidderLoading } = useQuery({
        queryKey: ["dashboard", "bidder"],
        queryFn: getBidderDashboard,
    });

    const { data: adminData, isLoading: isAdminLoading } = useQuery({
        queryKey: ["dashboard", "admin"],
        queryFn: getAdminDashboard,
        enabled: isAdmin,
    });

    return (
        <div className="container py-8 space-y-8">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>

            <Tabs defaultValue="seller" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="seller">Seller</TabsTrigger>
                    <TabsTrigger value="bidder">Bidder</TabsTrigger>
                    {isAdmin && <TabsTrigger value="admin">Admin</TabsTrigger>}
                </TabsList>

                <TabsContent value="seller" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {isSellerLoading ? <Skeleton className="h-8 w-20" /> : (
                                    <div className="text-2xl font-bold">{sellerData?.assets.total || 0}</div>
                                )}
                                <p className="text-xs text-muted-foreground mt-1">
                                    {sellerData?.assets.approved || 0} approved, {sellerData?.assets.pending || 0} pending
                                </p>
                                <Link to={`/users/${user?.sub}/assets`} className="text-xs text-primary hover:underline mt-2 inline-block">
                                    View My Assets →
                                </Link>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Live Auctions</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {isSellerLoading ? <Skeleton className="h-8 w-20" /> : (
                                    <div className="text-2xl font-bold">{sellerData?.auctions.live || 0}</div>
                                )}
                                <p className="text-xs text-muted-foreground mt-1">
                                    {sellerData?.auctions.scheduled || 0} scheduled
                                </p>
                                <Link to={`/users/${user?.sub}/assets`} className="text-xs text-primary hover:underline mt-2 inline-block">
                                    View Auctions →
                                </Link>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Released Earnings</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {isSellerLoading ? <Skeleton className="h-8 w-20" /> : (
                                    <div className="text-2xl font-bold">{formatMoney(sellerData?.earnings.totalReleased || 0)}</div>
                                )}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Funds in Escrow</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {isSellerLoading ? <Skeleton className="h-8 w-20" /> : (
                                    <div className="text-2xl font-bold">{formatMoney(sellerData?.earnings.inEscrow || 0)}</div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Recent Auctions - full width */}
                        <div className="lg:col-span-2">
                            <RecentAuctionsTable />
                        </div>

                        {/* Recent Assets - sidebar */}
                        <div>
                            <RecentAssetsWidget />
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="bidder" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Active Bids</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {isBidderLoading ? <Skeleton className="h-8 w-20" /> : (
                                    <div className="text-2xl font-bold">{bidderData?.bids.active || 0}</div>
                                )}
                                <Link to="/" className="text-xs text-primary hover:underline mt-2 inline-block">
                                    Explore Auctions →
                                </Link>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Won Auctions</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {isBidderLoading ? <Skeleton className="h-8 w-20" /> : (
                                    <div className="text-2xl font-bold text-green-600">{bidderData?.bids.won || 0}</div>
                                )}
                                <p className="text-xs text-muted-foreground mt-1">
                                    Items won
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {isBidderLoading ? <Skeleton className="h-8 w-20" /> : (
                                    <div className="text-2xl font-bold">{formatMoney(bidderData?.wallet.balance || 0)}</div>
                                )}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Locked Funds</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {isBidderLoading ? <Skeleton className="h-8 w-20" /> : (
                                    <div className="text-2xl font-bold">{formatMoney(bidderData?.wallet.locked || 0)}</div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Active Bids - full width */}
                        <div className="lg:col-span-2">
                            <ActiveBidsTable />
                        </div>

                        {/* Won Auctions - sidebar */}
                        <div>
                            <WonAuctionsWidget />
                        </div>
                    </div>
                </TabsContent>

                {isAdmin && (
                    <TabsContent value="admin" className="space-y-8">
                        {/* Stats Row */}
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Pending Assets</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {isAdminLoading ? <Skeleton className="h-8 w-20" /> : (
                                        <div className="text-2xl font-bold">{adminData?.assets.pendingReview || 0}</div>
                                    )}
                                    {/* Link to admin review section if implemented, or just keep generic */}
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Active Disputes</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {isAdminLoading ? <Skeleton className="h-8 w-20" /> : (
                                        <div className="text-2xl font-bold text-red-500">{adminData?.disputes.open || 0}</div>
                                    )}
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Live Auctions</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {isAdminLoading ? <Skeleton className="h-8 w-20" /> : (
                                        <div className="text-2xl font-bold">{adminData?.auctions.live || 0}</div>
                                    )}
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Holding</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {isAdminLoading ? <Skeleton className="h-8 w-20" /> : (
                                        <div className="text-2xl font-bold">{adminData?.escrows.holding || 0}</div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Dispute Manager Section */}
                        <div className="space-y-4">
                            <h3 className="text-xl font-semibold tracking-tight">Dispute Manager</h3>
                            <DisputeManagerTab />
                        </div>
                    </TabsContent>
                )}
            </Tabs>
        </div>
    );
}
