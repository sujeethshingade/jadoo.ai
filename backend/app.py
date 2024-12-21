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
    data = request.get_json()
    image_id = data.get('id')
    if not image_id:
        logger.warning("No image ID provided in the request.")
        return jsonify({"message": "No image ID provided"}), 400

    # Fetch image record from the 'images' table
    response = supabase.table("images").select("url").eq("id", image_id).single().execute()

    # if response.error:
    #     logger.error(f"Supabase error: {response.error.message}")
    #     return jsonify({"message": response.error.message}), 400

    image_url = response.data.get("url")

    if not image_url:
        logger.warning("Image URL not found for the provided image ID.")
        return jsonify({"message": "Image URL not found."}), 404

    # Get labels from Google Vision API
    try:
        labels, description = detect_labels_uri(image_url)
    except Exception as e:
        logger.error(f"Error detecting labels: {str(e)}")
        return jsonify({"message": str(e)}), 500

    # Update the tags and description in your table
    update_response = (
        supabase.table("images")
        .update({"tags": ", ".join(labels), "description": description})
        .eq("id", image_id)
        .execute()
    )

    # if update_response.error:
    #     logger.error(f"Supabase update error: {update_response.error.message}")
    #     return jsonify({"message": update_response.error.message}), 400

    logger.info(f"Image info updated successfully for image ID: {image_id}")
    return jsonify({"message": "Image info updated successfully"}), 200

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')