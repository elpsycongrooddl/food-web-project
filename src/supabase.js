import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ebtcpxgszzyedmdthebv.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVidGNweGdzenp5ZWRtZHRoZWJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1NDI0MDYsImV4cCI6MjA5NDExODQwNn0.QR5InKGwA3vx9WtjyScTmUcbxQkzY4pxe43jooNvlXA'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)