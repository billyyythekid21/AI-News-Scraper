import os
from google import genai
from twilio.rest import Client

gemini = genai.Client(api_key=os.getenv("GENAI_API_KEY"))
twilio = Client(os.getenv("ACCOUNT_SID"), os.getenv("AUTH_TOKEN"))
FROM_NUMBER = f"whatsapp:{os.getenv('TWILIO_FROM_NUMBER')}"


def scrape_news(topic: str = "AI, Technology and Science") -> str:
    prompt = f"""
    Scrape the latest {topic} news from the web.
    Return in dot-point form with no introduction or conclusion.
    Format:
    - News item 1 ... - News item 10
    Sources:
    - https://source1.com ... - https://source10.com
    """
    response = gemini.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
    )
    return response.text


def chunk_message(text: str, limit: int = 1500) -> list[str]:
    chunks, current = [], ""
    for line in text.splitlines(keepends=True):
        if len(current) + len(line) > limit:
            chunks.append(current)
            current = line
        else:
            current += line
    if current:
        chunks.append(current)
    return chunks


def send_to_subscriber(phone: str, topic: str) -> dict:
    try:
        news = scrape_news(topic)
        chunks = chunk_message(news)
        for i, chunk in enumerate(chunks):
            twilio.messages.create(
                to=f"whatsapp:{phone}",
                from_=FROM_NUMBER,
                body=f"({i+1}/{len(chunks)})\n{chunk}" if len(chunks) > 1 else chunk,
            )
        return {"status": "success", "preview": news[:100]}
    except Exception as e:
        return {"status": "failed", "preview": str(e)}