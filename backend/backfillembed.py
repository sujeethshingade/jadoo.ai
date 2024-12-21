from google.cloud import aiplatform
from vertexai.language_models import TextEmbeddingModel
from supabase import create_client
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env.local')

# Initialize Supabase
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SERVICE_ROLE_KEY")
supabase = create_client(supabase_url, supabase_key)

# Initialize Vertex AI
aiplatform.init(
    project=os.getenv("GOOGLE_CLOUD_PROJECT"),
    location=os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")
)
embedding_model = TextEmbeddingModel.from_pretrained("textembedding-gecko@latest")

def update_embeddings():
    # Get all rows where embedding is null but description exists
    response = supabase.table("images").select("id", "description").is_("embedding", "null").execute()
    
    print(f"Found {len(response.data)} rows to process")
    
    # Process each row
    for row in response.data:
        if row['description']:
            # Generate embedding
            embeddings = embedding_model.get_embeddings([row['description']])
            embedding = embeddings[0].values
            
            # Update the row with the new embedding
            supabase.table("images").update({"embedding": embedding}).eq("id", row["id"]).execute()
            print(f"Updated embedding for row {row['id']}")

if __name__ == "__main__":
    update_embeddings()