import vertexai

from vertexai.generative_models import GenerativeModel, ChatSession

# TODO(developer): Update and un-comment below line
# PROJECT_ID = "your-project-id"
vertexai.init(project="jadooai", location="us-central1")

model = GenerativeModel("gemini-1.5-flash-002")

chat_session = model.start_chat()

def get_chat_response(chat: ChatSession, prompt: str) -> str:
    text_response = []
    responses = chat.send_message(prompt, stream=True)
    for chunk in responses:
        text_response.append(chunk.text)
    return "".join(text_response)

prompt = "Hello."
print(get_chat_response(chat_session, prompt))
# Example response:
# Hello there! How can I help you today?

prompt = "What are all the colors in a rainbow?"
print(get_chat_response(chat_session, prompt))
# Example response:
# The colors in a rainbow are often remembered using the acronym ROY G. BIV:
# * **Red**
# * **Orange** ...

prompt = "Why does it appear when it rains?"
print(get_chat_response(chat_session, prompt))
# Example response:
# It's important to note that these colors blend smoothly into each other, ...
