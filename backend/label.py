from vlm import generate_description
import en_core_web_sm
from google.cloud import vision
from sklearn.feature_extraction.text import TfidfVectorizer
from nltk.corpus import wordnet

nlp = en_core_web_sm.load()

def extract_keywords(text, top_n=10):
    vectorizer = TfidfVectorizer(stop_words='english')
    X = vectorizer.fit_transform([text])
    indices = X[0].toarray().argsort()[0, -top_n:]
    features = vectorizer.get_feature_names_out()
    return [features[i] for i in indices]

def get_synonyms(word):
    synonyms = set()
    for syn in wordnet.synsets(word):
        for lemma in syn.lemmas():
            synonyms.add(lemma.name())
    return list(synonyms)

def detect_labels_uri(uri):
    """Detects labels in the file located in Google Cloud Storage or on the Web."""
    client = vision.ImageAnnotatorClient()
    image = vision.Image()
    image.source.image_uri = uri

    response = client.label_detection(image=image)
    labels = response.label_annotations
    print("Labels:")

    final_labels = [label.description for label in labels]

    # Generate description and extract important words
    description = generate_description(uri)
    doc = nlp(description)
    
    # Extract entities
    important_words = [
        ent.text
        for ent in doc.ents
        if ent.label_ in ("GPE", "ORG", "PERSON", "LOC", "PRODUCT", "EVENT", "NORP", "FAC", "LAW", "WORK_OF_ART", "LANGUAGE")
    ]
    
    # Extract noun phrases
    noun_phrases = [chunk.text for chunk in doc.noun_chunks]
    important_words.extend(noun_phrases)
    
    # Extract keywords
    keywords = extract_keywords(description)
    important_words.extend(keywords)
    
    # Expand tags with synonyms
    expanded_tags = []
    for word in important_words:
        expanded_tags.extend(get_synonyms(word))
    important_words.extend(expanded_tags)
    
    # Remove duplicates and add to final labels
    final_labels.extend(list(set(important_words)))
    final_labels = list(set(final_labels))

    print(final_labels)
    if response.error.message:
        raise Exception(
            "{}\nFor more info on error messages, check: "
            "https://cloud.google.com/apis/design/errors".format(response.error.message)
    )
    return final_labels, description
