from supabase import create_client, Client
from dotenv import load_dotenv
import os
import random
import subprocess

load_dotenv('.env.local')
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SERVICE_ROLE_KEY")

supabase: Client = create_client(supabase_url, supabase_key)

image_directory = '/home/mayankch283/val2017/'
all_images = [f for f in os.listdir(image_directory) if f.lower().endswith(('.png', '.jpg', '.jpeg', '.gif'))]
selected_images = random.sample(all_images, 50)

response = None  # { Initialize response to avoid UnboundLocalError }

for image in selected_images:
    file_path = os.path.join(image_directory, image)
    with open(file_path, 'rb') as file:
        supabase.storage.from_('image-store').upload(image, file, {
            'content-type': 'image/jpeg',
        })
        public_url = supabase.storage.from_('image-store').get_public_url(image)
        data = supabase.table('images').select('id').eq('url', public_url).execute()
        if data.data:
            image_id = data.data[0]['id']
            subprocess.run([
                'curl', '-X', 'POST', 'https://jadooai.el.r.appspot.com/update_image_info',
                '-H', 'Content-Type: application/json',
                '-d', f'{{"id": "{image_id}"}}'
            ])
