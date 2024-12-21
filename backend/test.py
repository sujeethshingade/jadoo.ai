from supabase import create_client, Client
import os
from dotenv import load_dotenv

load_dotenv('.env.local')

supabase_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
supabase_key = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
supabase: Client = create_client(supabase_url, supabase_key)

response = supabase.storage.from_('image-store').upload('000000015440.jpg', '/home/mayankch283/val2017/000000015440.jpg', {'content-type': 'image/jpeg', })

print(response)