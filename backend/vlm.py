import vertexai

from vertexai.generative_models import GenerativeModel, Part


def generate_description(uri):
    vertexai.init(project="jadooai", location="us-central1")

    model = GenerativeModel("gemini-1.5-flash-002")

    image_file = Part.from_uri(uri, "image/jpeg")

    # Query the model
    response = model.generate_content([image_file, "explain this image in detail"])
    print(response.text)
    return response.text
