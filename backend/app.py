from flask import Flask, request, jsonify
from flask_cors import CORS
from supabase import create_client, Client
from label import detect_labels_uri
from dotenv import load_dotenv
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
# For production, replace "*" with your frontend's domain, e.g., "https://your-frontend-domain.com"
CORS(app, resources={r"/*": {"origins": "*"}})

# Load environment variables for local development
load_dotenv('.env.local')

# Fetch environment variables
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SERVICE_ROLE_KEY")

print(supabase_url, supabase_key)

# Validate environment variables
if not supabase_url or not supabase_key:
    logger.error("Missing SUPABASE_URL or SERVICE_ROLE_KEY in environment variables")
    raise Exception("Missing SUPABASE_URL or SERVICE_ROLE_KEY in environment variables")

# Initialize Supabase client
supabase: Client = create_client(supabase_url, supabase_key)
logger.info("Supabase client initialized successfully.")

@app.route("/update_image_info", methods=["POST"])
def update_image_info():
    """Handle the update of image information including labels, description, and embedding.
    
    This endpoint processes an image URL to:
    1. Generate labels using Google Cloud Vision
    2. Create a description using the VLM
    3. Generate an embedding using Google Vertex AI
    4. Store all information in Supabase
    """
    data = request.get_json()
    image_id = data.get('id')
    if not image_id:
        logger.warning("No image ID provided in the request.")
        return jsonify({"message": "No image ID provided"}), 400

    # Fetch image record from the 'images' table
    response = supabase.table("images").select("url").eq("id", image_id).single().execute()

    image_url = response.data.get("url")

    if not image_url:
        logger.warning("Image URL not found for the provided image ID.")
        return jsonify({"message": "Image URL not found."}), 404

    # Get labels, description, and embedding using Google Cloud services
    try:
        labels, description, embedding = detect_labels_uri(image_url)
    except Exception as e:
        logger.error(f"Error processing image: {str(e)}")
        return jsonify({"message": str(e)}), 500

    # Update all information in Supabase
    update_response = (
        supabase.table("images")
        .update({
            "tags": ", ".join(labels), 
            "description": description,
            "embedding": embedding
        })
        .eq("id", image_id)
        .execute()
    )

    logger.info(f"Image info updated successfully for image ID: {image_id}")
    return jsonify({"message": "Image info updated successfully"}), 200

@app.route("/search_similar_images", methods=["POST"])
def search_similar_images():
    """Search for similar images based on a text query.
    
    This endpoint:
    1. Takes a text query
    2. Converts it to an embedding using Vertex AI
    3. Finds similar images using vector similarity search in Supabase
    """
    query = request.json.get('query')
    limit = request.json.get('limit', 5)
    
    try:
        # Generate embedding for the search query using Vertex AI
        embedding = embedding_generator.generate_embedding(query)
        
        # Search using vector similarity in Supabase
        response = supabase.rpc(
            'match_images',
            {
                'query_embedding': embedding,
                'match_threshold': 0.7,
                'match_count': limit
            }
        ).execute()
        
        return jsonify(response.data)
    except Exception as e:
        logger.error(f"Error during similarity search: {str(e)}")
        return jsonify({"message": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')