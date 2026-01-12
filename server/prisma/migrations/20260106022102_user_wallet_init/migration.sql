-- Add constraints to Wallet
ALTER TABLE "Wallet" ADD CONSTRAINT "balance_non_negative" CHECK ("balance" >= 0);
ALTER TABLE "Wallet" ADD CONSTRAINT "locked_non_negative" CHECK ("locked" >= 0);