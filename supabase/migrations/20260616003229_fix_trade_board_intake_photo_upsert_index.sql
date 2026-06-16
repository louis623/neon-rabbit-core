drop index if exists public.idx_trade_board_intake_photos_message_attachment;

create unique index if not exists idx_trade_board_intake_photos_message_attachment
  on public.trade_board_intake_photos (session_id, conversation_message_id, attachment_index);

notify pgrst, 'reload schema';
