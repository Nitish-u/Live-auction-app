export interface MailOptions {
    to: string;
    subject: string;
    templateName: TemplateName;
    variables: Record<string, string>;
}

export type TemplateName =
    | 'verify'
    | 'resetPassword'
    | 'auctionCreated'
    | 'newBid'
    | 'outbid'
    | 'auctionWon'
    | 'payment';

export interface BaseTemplateVariables {
    BODY_CONTENT: string;
}

export interface VerifyAccountVariables {
    VERIFY_LINK: string;
}

export interface ResetPasswordVariables {
    RESET_LINK: string;
}

export interface AuctionCreatedVariables {
    AUCTION_TITLE: string;
    DASHBOARD_LINK: string;
}

export interface NewBidVariables {
    AUCTION_TITLE: string;
    BID_AMOUNT: string;
    BIDDER_NAME: string;
    AUCTION_LINK: string;
}

export interface OutbidVariables {
    AUCTION_TITLE: string;
    CURRENT_BID: string;
    AUCTION_LINK: string;
}

export interface AuctionWonVariables {
    AUCTION_TITLE: string;
    WIN_AMOUNT: string;
    PAYMENT_LINK: string;
}

export interface PaymentConfirmationVariables {
    AUCTION_TITLE: string;
    TXN_ID: string;
}
