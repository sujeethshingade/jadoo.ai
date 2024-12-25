import google.generativeai as genai
import requests


data = request.get_json()
    question = data.get('question')
    
    # Retrieve image URL from Supabase
    response = supabase.table('images').select('url').execute()
    image_url = response.data[0]['url'] if response.data else None
    
    if not image_url:
        return jsonify({"error": "No image found"}), 404
    
    # Use Gemini API to get answer based on the image
    gemini_api_url = "https://api.gemini.com/answer"
    gemini_response = requests.post(gemini_api_url, json={
        'image_url': image_url,
        'question': question
    })
    
    if gemini_response.status_code != 200:
        return jsonify({"error": "Failed to get answer from Gemini API"}), 500
    
    answer = gemini_response.json().get('answer')
