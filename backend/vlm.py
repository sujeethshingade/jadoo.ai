import vertexai

from vertexai.generative_models import GenerativeModel, Part
import mimetypes


def generate_description(uri):
    vertexai.init(project="jadooai", location="us-central1")

    model = GenerativeModel("gemini-1.5-flash-002")

    # Determine the MIME type of the image
    mime_type, _ = mimetypes.guess_type(uri)
    if mime_type not in ["image/jpeg", "image/png"]:
        raise ValueError("Unsupported image type. Only JPEG and PNG are supported.")

    image_file = Part.from_uri(uri, mime_type)

    # Query the model
    response = model.generate_content([image_file, "explain this image in detail"])
    print(response.text)
    return response.text
