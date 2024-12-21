from supabase import create_client, Client
from dotenv import load_dotenv
import os
import subprocess

load_dotenv('.env.local')
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SERVICE_ROLE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)

records = supabase.table('images').select('id').execute()
for record in records.data:
    image_id = record['id']
    subprocess.run([
        'curl', '-X', 'POST', 'https://jadooai.el.r.appspot.com/update_image_info',
        '-H', 'Content-Type: application/json',
        '-d', f'{{"id": "{image_id}"}}'
    ])