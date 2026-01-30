
import { MailService } from '../src/modules/mail/mail.service';

// Mock process.env
process.env.SMTP_USER = process.env.SMTP_USER || 'test@example.com';
process.env.SMTP_PASS = process.env.SMTP_PASS || 'password';

async function testMail() {
    console.log('Testing MailService...');

    try {
        await MailService.sendMail({
            to: 'test-recipient@example.com',
            subject: 'Test Auction Created',
            templateName: 'auctionCreated',
            variables: {
                AUCTION_TITLE: 'Rare Vintage Watch',
                DASHBOARD_LINK: 'http://localhost:5173/dashboard/seller'
            }
        });
        console.log('Test 1 Passed: Auction Created Email');

        await MailService.sendMail({
            to: 'test-recipient@example.com',
            subject: 'Test Outbid',
            templateName: 'outbid',
            variables: {
                AUCTION_TITLE: 'Rare Vintage Watch',
                CURRENT_BID: '5000',
                AUCTION_LINK: 'http://localhost:5173/auctions/123'
            }
        });
        console.log('Test 2 Passed: Outbid Email');

        console.log('All tests passed!');
    } catch (error) {
        console.error('Test Failed:', error);
    }
}

testMail();
