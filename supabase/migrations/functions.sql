CREATE OR REPLACE FUNCTION get_next_user_id()
RETURNS integer AS $$
DECLARE
  next_id integer;
  max_id integer;
BEGIN
  -- Lock the table in exclusive mode within the transaction
  -- to ensure only one call can execute this block at a time.
  LOCK TABLE public.tracking IN EXCLUSIVE MODE;

  -- Find the current maximum user_id
  SELECT MAX(user_id) INTO max_id FROM public.tracking;

  -- If the table is empty or max_id is null, start with 1, otherwise increment.
  IF max_id IS NULL THEN
    next_id := 1;
  ELSE
    next_id := max_id + 1;
  END IF;

  -- The lock is released automatically when the function/transaction ends.
  RETURN next_id;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER; -- Use SECURITY DEFINER if needed, ensure ownership allows service_role execution

-- Grant execute permission ONLY to the service_role your admin client uses
GRANT EXECUTE ON FUNCTION public.get_next_user_id() TO service_role;

-- IMPORTANT: Revoke execute from public if it was granted by default (it usually isn't for new functions)
-- REVOKE EXECUTE ON FUNCTION public.get_next_user_id() FROM public;