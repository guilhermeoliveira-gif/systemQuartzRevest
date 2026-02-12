-- Make foto_url optional in movimento_peca
ALTER TABLE movimento_peca ALTER COLUMN foto_url DROP NOT NULL;

-- If usuario_id is UUID and we were sending text, we need to ensure we send UUID. 
-- But we can't change the column type easily if it already has data. Assuming it is UUID or Text.
-- If it is UUID, sending 'CURRENT_USER' will fail.

-- This migration just fixes the photo url constraint.
