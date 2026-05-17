ALTER TABLE rep_notes
  ADD COLUMN IF NOT EXISTS memory_type TEXT NOT NULL DEFAULT 'general'
    CHECK (memory_type IN (
      'preference',
      'show_process',
      'customer_pattern',
      'follow_up',
      'show_summary',
      'issue',
      'general'
    )),
  ADD COLUMN IF NOT EXISTS memory_source TEXT NOT NULL DEFAULT 'automatic_high_signal'
    CHECK (memory_source IN (
      'explicit',
      'automatic_high_signal',
      'guarded'
    ));

CREATE INDEX IF NOT EXISTS idx_notes_rep_memory_type
  ON rep_notes(rep_id, memory_type, conversation_date DESC);

CREATE INDEX IF NOT EXISTS idx_notes_rep_memory_source
  ON rep_notes(rep_id, memory_source, conversation_date DESC);
