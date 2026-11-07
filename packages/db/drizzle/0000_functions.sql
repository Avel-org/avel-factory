-- The seven functions: the map's six (uuid_generate_v7, touch_updated_at, freeze_once_set,
-- refuse_update, freeze_plan_detail, freeze_plan), rewritten from the rules they enforce
-- (CR-19 items 1 and 3; the map has no function bodies), and freeze_after_set (CR-13; INT, finding 02).
-- Every refusal is raised as a check_violation that names the trigger as its constraint, so the
-- server's error mapper reports it the way it reports a CHECK (CONSTRAINT_VIOLATION, 422).

-- A version-7 UUID (RFC 9562): 48 bits of Unix time in milliseconds, then the version, then
-- random bits with the RFC variant. Ids made later sort later.
CREATE FUNCTION uuid_generate_v7() RETURNS uuid
LANGUAGE plpgsql VOLATILE PARALLEL SAFE AS $$
DECLARE
  unix_ms bytea := substring(int8send(floor(extract(epoch FROM clock_timestamp()) * 1000)::bigint) FROM 3);
  value bytea := uuid_send(gen_random_uuid());
BEGIN
  value := overlay(value PLACING unix_ms FROM 1 FOR 6);
  value := set_byte(value, 6, (get_byte(value, 6) & 15) | 112);
  RETURN encode(value, 'hex')::uuid;
END
$$;
--> statement-breakpoint

-- BEFORE UPDATE on every mutable table: updated_at moves to now and row_version goes up by one,
-- on every update, so a write that sends a stale row_version can be refused (Q4).
CREATE FUNCTION touch_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  NEW.row_version := OLD.row_version + 1;
  RETURN NEW;
END
$$;
--> statement-breakpoint

-- BEFORE UPDATE, with the columns as arguments: a listed column can be set while it is null,
-- and once it is set it can't change.
CREATE FUNCTION freeze_once_set() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  old_row jsonb := to_jsonb(OLD);
  new_row jsonb := to_jsonb(NEW);
  col text;
BEGIN
  FOREACH col IN ARRAY TG_ARGV LOOP
    IF NOT (old_row ? col) THEN
      RAISE EXCEPTION 'freeze_once_set: % has no column %', TG_TABLE_NAME, col;
    END IF;
    IF old_row ->> col IS NOT NULL AND (new_row -> col) IS DISTINCT FROM (old_row -> col) THEN
      RAISE EXCEPTION USING
        ERRCODE = 'check_violation',
        CONSTRAINT = TG_NAME,
        TABLE = TG_TABLE_NAME,
        COLUMN = col,
        MESSAGE = format('%s.%s is frozen once set', TG_TABLE_NAME, col);
    END IF;
  END LOOP;
  RETURN NEW;
END
$$;
--> statement-breakpoint

-- BEFORE UPDATE on the immutable tables: an update is refused. Inserts and deletes are not
-- this function's business (deletes are governed by the foreign keys).
CREATE FUNCTION refuse_update() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION USING
    ERRCODE = 'check_violation',
    CONSTRAINT = TG_NAME,
    TABLE = TG_TABLE_NAME,
    MESSAGE = format('%s is immutable: rows are never updated', TG_TABLE_NAME);
END
$$;
--> statement-breakpoint

-- BEFORE INSERT OR UPDATE OR DELETE on the plan detail tables: a row can be written only while
-- its plan is a draft. Once the plan is approved (and after, when it is superseded) its detail
-- is frozen: no insert, update or delete. An update is checked against both the old and the
-- new plan, so a row can't be moved out of or into a frozen plan.
CREATE FUNCTION freeze_plan_detail() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  plan_ids uuid[];
  frozen_plan uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    plan_ids := ARRAY[(to_jsonb(NEW) ->> 'plan_id')::uuid];
  ELSIF TG_OP = 'UPDATE' THEN
    plan_ids := ARRAY[(to_jsonb(OLD) ->> 'plan_id')::uuid, (to_jsonb(NEW) ->> 'plan_id')::uuid];
  ELSE
    plan_ids := ARRAY[(to_jsonb(OLD) ->> 'plan_id')::uuid];
  END IF;
  SELECT p.id INTO frozen_plan FROM plans p
   WHERE p.id = ANY (plan_ids) AND p.state <> 'draft'
   LIMIT 1;
  IF frozen_plan IS NOT NULL THEN
    RAISE EXCEPTION USING
      ERRCODE = 'check_violation',
      CONSTRAINT = TG_NAME,
      TABLE = TG_TABLE_NAME,
      MESSAGE = format('%s: plan %s is no longer a draft, so its detail is frozen', TG_TABLE_NAME, frozen_plan);
  END IF;
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END
$$;
--> statement-breakpoint

-- BEFORE UPDATE on plans: a draft can change freely and be approved. Once a plan is approved its
-- content is frozen: the only change left is approved -> superseded (row_version and updated_at
-- still move, by touch_updated_at). A superseded plan can't change at all.
CREATE FUNCTION freeze_plan() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.state = 'draft' THEN
    RETURN NEW;
  END IF;
  IF (to_jsonb(NEW) - 'state' - 'row_version' - 'updated_at')
     IS DISTINCT FROM (to_jsonb(OLD) - 'state' - 'row_version' - 'updated_at') THEN
    RAISE EXCEPTION USING
      ERRCODE = 'check_violation',
      CONSTRAINT = TG_NAME,
      TABLE = TG_TABLE_NAME,
      MESSAGE = format('plan %s is %s: its content is frozen', OLD.id, OLD.state);
  END IF;
  IF NEW.state IS DISTINCT FROM OLD.state
     AND NOT (OLD.state = 'approved' AND NEW.state = 'superseded') THEN
    RAISE EXCEPTION USING
      ERRCODE = 'check_violation',
      CONSTRAINT = TG_NAME,
      TABLE = TG_TABLE_NAME,
      MESSAGE = format('plan %s can''t move from %s to %s', OLD.id, OLD.state, NEW.state);
  END IF;
  RETURN NEW;
END
$$;
--> statement-breakpoint

-- BEFORE UPDATE, with a gate column and then the columns it freezes: once the old row's gate
-- column is set, the listed columns can't change (CR-13: missions.kind is frozen once
-- onboarding_started_at is set). freeze_once_set can't do it, because the frozen column is set
-- from insert.
CREATE FUNCTION freeze_after_set() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  old_row jsonb := to_jsonb(OLD);
  new_row jsonb := to_jsonb(NEW);
  gate text := TG_ARGV[0];
  col text;
BEGIN
  IF TG_NARGS < 2 THEN
    RAISE EXCEPTION 'freeze_after_set: % needs a gate column and at least one column', TG_NAME;
  END IF;
  IF NOT (old_row ? gate) THEN
    RAISE EXCEPTION 'freeze_after_set: % has no column %', TG_TABLE_NAME, gate;
  END IF;
  IF old_row ->> gate IS NULL THEN
    RETURN NEW;
  END IF;
  FOREACH col IN ARRAY TG_ARGV[1:] LOOP
    IF NOT (old_row ? col) THEN
      RAISE EXCEPTION 'freeze_after_set: % has no column %', TG_TABLE_NAME, col;
    END IF;
    IF (new_row -> col) IS DISTINCT FROM (old_row -> col) THEN
      RAISE EXCEPTION USING
        ERRCODE = 'check_violation',
        CONSTRAINT = TG_NAME,
        TABLE = TG_TABLE_NAME,
        COLUMN = col,
        MESSAGE = format('%s.%s is frozen once %s is set', TG_TABLE_NAME, col, gate);
    END IF;
  END LOOP;
  RETURN NEW;
END
$$;
