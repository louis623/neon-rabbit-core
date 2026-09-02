ALTER TABLE public.calendar_events
  ADD COLUMN IF NOT EXISTS streaming_destinations JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.calendar_events
  ADD CONSTRAINT calendar_events_streaming_destinations_is_array
  CHECK (jsonb_typeof(streaming_destinations) = 'array') NOT VALID;

ALTER TABLE public.calendar_events
  VALIDATE CONSTRAINT calendar_events_streaming_destinations_is_array;
