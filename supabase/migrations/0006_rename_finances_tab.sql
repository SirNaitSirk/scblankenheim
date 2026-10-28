-- The admin tab "Finanzen" moved to /admin/preise (specs/005-price-tier-management).
-- Tab grants are stored as hrefs, so carry existing grants over to the new href.

update public.profiles
  set visible_tabs = array_replace(visible_tabs, '/admin/finanzen', '/admin/preise')
  where '/admin/finanzen' = any(visible_tabs);

update public.admin_invitations
  set visible_tabs = array_replace(visible_tabs, '/admin/finanzen', '/admin/preise')
  where '/admin/finanzen' = any(visible_tabs);
