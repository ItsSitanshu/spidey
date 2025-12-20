// supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://grohxeojncomskqomvru.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdyb2h4ZW9qbmNvbXNrcW9tdnJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxNjA0NjcsImV4cCI6MjA4MTczNjQ2N30.OOK-5f7jmCICn0aJ1KjUsc2QDKCc58ahYvxkc7z0XuE'; // get from Supabase dashboard -> API -> anon key

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function uploadSnapshot(uri: string) {
  const TS = Date.now();
  const fileName = `${TS}.jpg`;
  const { data, error } = await supabase.storage
    .from('snapshots')
    .upload(fileName, await fetch(uri).then(r => r.blob()))

  console.log("data from upload: ", data);

  if (error) {
    console.error('Upload failed', error);
    return null;
  }

  const publicUrl = supabase.storage.from('snapshots').getPublicUrl(fileName);
  console.log("publicurl: ", publicUrl);

  const { data: any, error: insertError } = await supabase
    .from('live_feed')
    .insert({
      timestamp: TS,
      image_url: publicUrl,
    })
    .select()
    .single();

  if (insertError) {
    console.error('DB insert failed:', insertError);
    return null;
  }

  return data;
}
