# Shared lot names

The public map at <https://alexmalison.github.io/akumal-norte-map-viewer/> reads and subscribes to `public.lot_names` in the Supabase project `akumal-norte-map` (`vgogijvekdjsgeegenqc`). Approved editors sign in by email link. A browser-safe publishable key is embedded in `site/index.html`; secret and service-role keys must stay out of the page and repository.

The live database was initialized with `schema.sql`. Row level security allows anyone to read names, while insert, update, and delete require a signed-in email listed in `public.editors`. The initial approved editor is `alexmalison@gmail.com`.

To approve another editor, add their lowercase email in the Supabase SQL Editor:

```sql
insert into public.editors (email) values ('editor@example.com')
on conflict (email) do nothing;
```

To revoke access, delete that row. The change takes effect on the editor's next write or page refresh. Visitors see changes as they are saved through Supabase Realtime; the page also refreshes names when it regains focus.

GitHub Pages remains a static host. It needs no database secret or GitHub Actions secret for shared names. Supabase Auth's Site URL is the public map URL, and its redirect allowlist also includes `http://100.126.196.118:8765/` for local viewing. Sign-in emails currently redirect to the public map. If the public URL changes, update both Supabase Auth URL configuration and `editorRedirectUrl` in `site/index.html`.
