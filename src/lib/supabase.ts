import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://wphvmdbqainvvimjfkcp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwaHZtZGJxYWludnZpbWpma2NwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNTQyNDgsImV4cCI6MjA5MDgzMDI0OH0.a7-xRf_8uQS2S56TSbODV4uoai1Hull9en_8IN9yAek";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
