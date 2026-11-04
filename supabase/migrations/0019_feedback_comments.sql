-- Optional comment per feedback question (specs/038-camp-feedback, US6).
--
-- allow_comment lets rating and choice questions show a voluntary comment
-- box once an answer is chosen. The comment itself lives in the answers jsonb
-- of feedback_responses next to the answered value, so it stays as anonymous
-- as the answer. No CHECK constraint; the app forces false for free text.

alter table public.camp_feedback_questions
  add column allow_comment boolean not null default false;
