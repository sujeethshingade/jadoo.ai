from flask import Flask, request, jsonify
from flask_cors import CORS
from supabase import create_client, Client
from label import detect_labels_uri
from dotenv import load_dotenv
import os
import logging
import google.generativeai as genai
import requests
import httpx
import base64

app = Flask(__name__)
# For production, replace "*" with your frontend's domain, e.g., "https://your-frontend-domain.com"
CORS(app, resources={r"/*": {"origins": "*"}})

# Load environment variables for local development
load_dotenv('.env.local')
os.getenv("GEMINI_KEY")
genai.configure(api_key=os.getenv("GEMINI_API"))

# Fetch environment variables
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SERVICE_ROLE_KEY")

print(supabase_url, supabase_key)

# Initialize Supabase client
supabase: Client = create_client(supabase_url, supabase_key)

# Configure logging
logging.basicConfig(level=logging.DEBUG)

@app.route("/update_image_info", methods=["POST"])
def update_image_info():
    data = request.get_json()
    image_id = data.get('id')
    if not image_id:
        return jsonify({"message": "No image ID provided"}), 400

    # Fetch image record from the 'images' table
    response = supabase.table("images").select("url").eq("id", image_id).single().execute()

    image_url = response.data.get("url")

    if not image_url:
        return jsonify({"message": "Image URL not found."}), 404

    # Get labels from Google Vision API
    try:
        labels, description = detect_labels_uri(image_url)
    except Exception as e:
        return jsonify({"message": str(e)}), 500

    # Update the tags and description in your table
    update_response = (
        supabase.table("images")
        .update({"tags": ", ".join(labels), "description": description})
        .eq("id", image_id)
        .execute()
    )

    return jsonify({"message": "Image info updated successfully"}), 200

@app.route('/chatbot', methods=['POST'])
def chatbot():
    try:
        data = request.get_json()
        question = data.get('content')
        image_url = data.get('image_url')
        context = data.get('context', '')
        
        if not question or not image_url:
            return jsonify({"error": "Question and image URL are required"}), 400
            
        # Fetch the image content
        image_response = httpx.get(image_url)
        if image_response.status_code != 200:
            logging.error(f"Failed to download image. Status code: {image_response.status_code}")
            return jsonify({"error": "Failed to download the image."}), 500
            
        # Encode image to base64
        encoded_image = base64.b64encode(image_response.content).decode('utf-8')
        
        # Initialize the Generative Model
        model = genai.GenerativeModel(model_name="gemini-1.5-pro")
        
        # Generate content using the model with context
        prompt = f"Context: {context}\nQuestion: {question}" if context else question
        generation_response = model.generate_content([
            {
                'mime_type': 'image/jpeg',
                'data': encoded_image
            },
            prompt
        ])
        
        answer = generation_response.candidates[0].content.parts[0].text
        return jsonify({"reply": answer}), 200
        
    except Exception as e:
        logging.error(f"Exception occurred: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')