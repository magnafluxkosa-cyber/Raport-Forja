-- Permite viewer + ACL să scrie în rf_documents pentru pagina Îmbunătățire continuă

insert into public.page_permissions (role, page_key, can_view, can_add, can_edit, can_delete)
values ('viewer', 'imbunatatire-continua', true, true, true, false)
on conflict (role, page_key)
do update set
  can_view = excluded.can_view,
  can_add = excluded.can_add,
  can_edit = excluded.can_edit,
  can_delete = excluded.can_delete;

drop policy if exists "ic_insert_by_page_permissions" on public.rf_documents;
drop policy if exists "ic_update_by_page_permissions" on public.rf_documents;

create policy "ic_insert_by_page_permissions"
on public.rf_documents
for insert
to authenticated
with check (
  doc_key in (
    'imbunatatire-continua',
    'imbunatatire_continua',
    'Imbunatatire continua',
    'imbunatatire continua'
  )
  and exists (
    select 1
    from public.page_permissions pp
    where lower(pp.role) = lower(
      coalesce(
        (select p.role from public.profiles p where p.user_id = auth.uid() limit 1),
        (select p.role from public.profiles p where lower(p.email) = lower(auth.jwt() ->> 'email') limit 1),
        (select a.role from public.rf_acl a where lower(a.email) = lower(auth.jwt() ->> 'email') limit 1),
        'viewer'
      )
    )
    and pp.page_key in (
      'imbunatatire-continua',
      'imbunatatire_continua',
      'imbunatatire continua',
      'imbunatatire-continua.html',
      'imbunatatire_continua.html'
    )
    and (pp.can_add = true or pp.can_edit = true)
  )
);

create policy "ic_update_by_page_permissions"
on public.rf_documents
for update
to authenticated
using (
  doc_key in (
    'imbunatatire-continua',
    'imbunatatire_continua',
    'Imbunatatire continua',
    'imbunatatire continua'
  )
  and exists (
    select 1
    from public.page_permissions pp
    where lower(pp.role) = lower(
      coalesce(
        (select p.role from public.profiles p where p.user_id = auth.uid() limit 1),
        (select p.role from public.profiles p where lower(p.email) = lower(auth.jwt() ->> 'email') limit 1),
        (select a.role from public.rf_acl a where lower(a.email) = lower(auth.jwt() ->> 'email') limit 1),
        'viewer'
      )
    )
    and pp.page_key in (
      'imbunatatire-continua',
      'imbunatatire_continua',
      'imbunatatire continua',
      'imbunatatire-continua.html',
      'imbunatatire_continua.html'
    )
    and (pp.can_add = true or pp.can_edit = true)
  )
)
with check (
  doc_key in (
    'imbunatatire-continua',
    'imbunatatire_continua',
    'Imbunatatire continua',
    'imbunatatire continua'
  )
  and exists (
    select 1
    from public.page_permissions pp
    where lower(pp.role) = lower(
      coalesce(
        (select p.role from public.profiles p where p.user_id = auth.uid() limit 1),
        (select p.role from public.profiles p where lower(p.email) = lower(auth.jwt() ->> 'email') limit 1),
        (select a.role from public.rf_acl a where lower(a.email) = lower(auth.jwt() ->> 'email') limit 1),
        'viewer'
      )
    )
    and pp.page_key in (
      'imbunatatire-continua',
      'imbunatatire_continua',
      'imbunatatire continua',
      'imbunatatire-continua.html',
      'imbunatatire_continua.html'
    )
    and (pp.can_add = true or pp.can_edit = true)
  )
);
