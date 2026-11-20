ALTER TABLE "jobs" ADD COLUMN "partition_key" text;--> statement-breakpoint
CREATE UNIQUE INDEX "jobs_one_claimed_per_partition_uq" ON "jobs" USING btree ("partition_key") WHERE ((state = 'claimed'::text) AND (partition_key IS NOT NULL));
