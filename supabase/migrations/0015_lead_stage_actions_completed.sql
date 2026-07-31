-- Persist per-buyer, per-stage checklist state for the green step-info panel
-- inside PipelineDetailModal (StageGuidancePanel). The panel keys each item as
-- `${stage}:actions:${itemId}` or `${stage}:docs:${itemId}`; only truthy keys
-- are stored, so the map stays compact.

alter table public.leads
  add column if not exists stage_actions_completed jsonb not null default '{}'::jsonb;
