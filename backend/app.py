from flask import Flask, request
from supabase import create_client, Client
from label import detect_labels_uri
from dotenv import load_dotenv
import os

app = Flask(__name__)
load_dotenv()

supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
supabase_key = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
supabase: Client = create_client(supabase_url, supabase_key)

@app.route('/update_image_info', methods=['POST'])
def update_image_info():
    image_id = request.json.get('id')
    
    if not image_id:
        return {'status': 'error', 'message': 'Image ID is required.'}, 400

    # Fetch image record from the 'images' table
    response = supabase.table('images').select('url').eq('id', image_id).single().execute()
    
    if response.error:
        return {'status': 'error', 'message': response.error.message}, 400
    
    image_url = response.data.get('url')

    if not image_url:
        return {'status': 'error', 'message': 'Image URL not found.'}, 404

    # Get labels from Google Vision API
    try:
        labels = detect_labels_uri(image_url)
    except Exception as e:
        return {'status': 'error', 'message': str(e)}, 500

    # Update the tags and description in your table
    update_response = supabase.table('images').update({
        'tags': ', '.join(labels),
        'description': 'PLACEHOLDER VLM GENERATED TEXT'
    }).eq('id', image_id).execute()

    if update_response.error:
        return {'status': 'error', 'message': update_response.error.message}, 400

    return {'status': 'success'}