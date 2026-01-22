import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || supabaseUrl.trim() === '') {
  throw new Error(
    'Missing or empty env.NEXT_PUBLIC_SUPABASE_URL. Please add it to your .env.local file. See https://supabase.com/docs/guides/getting-started/quickstarts/nextjs'
  )
}

if (!supabaseAnonKey || supabaseAnonKey.trim() === '') {
  throw new Error(
    'Missing or empty env.NEXT_PUBLIC_SUPABASE_ANON_KEY. Please add it to your .env.local file. See https://supabase.com/docs/guides/getting-started/quickstarts/nextjs'
  )
}

// Validate URL format
try {
  const url = new URL(supabaseUrl)
  // Ensure it's HTTP or HTTPS
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('Invalid protocol')
  }
} catch {
  // Check if they might have swapped the values (API key in URL field)
  if (supabaseUrl.startsWith('sb_') || supabaseUrl.startsWith('eyJ')) {
    throw new Error(
      `Invalid NEXT_PUBLIC_SUPABASE_URL: The value "${supabaseUrl.substring(0, 30)}..." looks like an API key, not a URL.\n\n` +
      `The URL should be in the format: https://xxxxx.supabase.co\n` +
      `You can find your Supabase URL in your project dashboard under Settings → API.\n` +
      `It looks like you may have swapped NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.`
    )
  }
  throw new Error(
    `Invalid NEXT_PUBLIC_SUPABASE_URL format: "${supabaseUrl}".\n\n` +
    `Expected format: https://xxxxx.supabase.co\n` +
    `Found in: Supabase Dashboard → Settings → API → Project URL`
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)