from google.cloud import aiplatform
from vertexai.language_models import TextEmbeddingModel
import os
from typing import List

class EmbeddingGenerator:
    def __init__(self):
        """Initialize the Google Vertex AI client for generating embeddings."""
        # Initialize Vertex AI with your project configuration
        aiplatform.init(
            project=os.getenv("GOOGLE_CLOUD_PROJECT"),
            location=os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")
        )
        # Load the latest version of Google's text embedding model
        self.model = TextEmbeddingModel.from_pretrained("textembedding-gecko@latest")
    
    def generate_embedding(self, text: str) -> List[float]:
        """Generate embedding for the given text description using Google's Vertex AI.
        
        Args:
            text: The text to generate embedding for
            
        Returns:
            A list of floating point numbers representing the embedding
        """
        # Get embeddings returns a list of embeddings, but we're only sending one text
        embeddings = self.model.get_embeddings([text])
        # Return the embedding values for the first (and only) text
        return embeddings[0].values

# Modified label.py
from vlm import generate_description
import en_core_web_sm
from embedding_utils import EmbeddingGenerator
from google.cloud import vision

nlp = en_core_web_sm.load()
embedding_generator = EmbeddingGenerator()

def detect_labels_uri(uri):
    """Detects labels, generates description, and creates embedding for the image.
    
    This function combines three key operations:
    1. Label detection using Google Cloud Vision
    2. Description generation using the VLM
    3. Embedding generation using Google Vertex AI
    """
    # Initialize Vision API client
    client = vision.ImageAnnotatorClient()
    image = vision.Image()
    image.source.image_uri = uri

    # Get labels from Vision API
    response = client.label_detection(image=image)
    labels = response.label_annotations
    print("Labels:")

    final_labels = []
    for label in labels:
        final_labels.append(label.description)

    # Generate description and extract important entities
    description = generate_description(uri)
    doc = nlp(description)
    important_words = [
        ent.text
        for ent in doc.ents
        if ent.label_ in ("GPE", "ORG", "PERSON", "LOC", "PRODUCT", "EVENT", "NORP", "FAC", "LAW", "WORK_OF_ART", "LANGUAGE")
    ]
    final_labels.extend(important_words)
    final_labels = list(set(final_labels))

    # Generate embedding for the description using Vertex AI
    embedding = embedding_generator.generate_embedding(description)

    print(final_labels)
    if response.error.message:
        raise Exception(
            "{}\nFor more info on error messages, check: "
            "https://cloud.google.com/apis/design/errors".format(response.error.message)
        )

    return final_labels, description, embedding