import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://tpophphtloixefuxujsi.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwb3BocGh0bG9peGVmdXh1anNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNDIyMDMsImV4cCI6MjA5MDgxODIwM30.OEhJfBPH8rC4tu7Fv6JJav06WOR-fjDlF9wC3R3e2fs";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
