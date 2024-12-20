from vlm import generate_description
import spacy

nlp = spacy.load("en_core_web_sm")


def detect_labels_uri(uri):
    """Detects labels in the file located in Google Cloud Storage or on the
    Web."""
    from google.cloud import vision

    client = vision.ImageAnnotatorClient()
    image = vision.Image()
    image.source.image_uri = uri

    response = client.label_detection(image=image)
    labels = response.label_annotations
    print("Labels:")

    final_labels = []
    for label in labels:
        final_labels.append(label.description)

    # Generate description and extract important words
    description = generate_description(uri)
    doc = nlp(description)
    important_words = [
        ent.text
        for ent in doc.ents
        if ent.label_ in ("GPE", "ORG", "PERSON", "LOC", "PRODUCT", "EVENT")
    ]
    final_labels.extend(important_words)

    print(final_labels)
    if response.error.message:
        raise Exception(
            "{}\nFor more info on error messages, check: "
            "https://cloud.google.com/apis/design/errors".format(response.error.message)
        )

    return final_labels, description
