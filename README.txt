HELPER v3 (Create User)

1) In helper.html setezi SUPABASE_ANON_KEY (Anon Key Legacy).
2) Urcă helper.html în GitHub Pages (peste helper.html vechi).

3) În Supabase Edge Functions -> admin-control -> Code:
   Înlocuiește tot cu conținutul din admin-control-index.ts (include create-user) și Deploy.

4) În Edge Function Secrets trebuie să existe:
   SUPABASE_URL = https://<project-ref>.supabase.co
   SERVICE_ROLE_KEY = service_role key (Legacy)
