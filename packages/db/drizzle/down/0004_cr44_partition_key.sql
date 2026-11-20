-- Reverses 0004_cr44_partition_key.sql (CR-44): newest statement first.
DROP INDEX "jobs_one_claimed_per_partition_uq";
ALTER TABLE "jobs" DROP COLUMN "partition_key";
