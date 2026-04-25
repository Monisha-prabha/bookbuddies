import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://wuteshougsljsosgejnu.supabase.co"
const SUPABASE_ANON_KEY = "sb_publishable_3pqFlZN8Ri_YT4F6kOEsZA_3ZfFKzIG"

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)