-- Adaugă pagina MRC în pages și acordă permisiuni standard pe roluri
insert into pages (page_key, page_name)
values ('mrc', 'MRC')
on conflict (page_key) do update
set page_name = excluded.page_name;

insert into page_permissions (role, page_key, can_view, can_add, can_edit, can_delete)
values
  ('admin', 'mrc', true, true, true, true),
  ('editor', 'mrc', true, true, true, false),
  ('operator', 'mrc', true, true, true, false),
  ('viewer', 'mrc', true, false, false, false)
on conflict (role, page_key) do update
set
  can_view = excluded.can_view,
  can_add = excluded.can_add,
  can_edit = excluded.can_edit,
  can_delete = excluded.can_delete;
