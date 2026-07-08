-- Amplía los tipos de la base de conocimiento: además de casos y manual,
-- códigos de falla de calderas y criterios de oficio con fundamento.

alter table public.conocimiento drop constraint if exists conocimiento_tipo_check;
alter table public.conocimiento add constraint conocimiento_tipo_check
    check (tipo in ('caso', 'manual', 'falla', 'criterio'));
