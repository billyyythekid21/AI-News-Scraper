import google.genai as genai
import os
from twilio.rest import Client

def scrape_news():
    genai.configure(api_key=os.getenv("GENAI_API_KEY"))
    model = genai.GenerativeModel("gemini-2.5-flash")
    prompt = """
    You are a news scraper. You are given a prompt and you need to scrape 
    the latest news from the web.
    Scrape the latest AI and technology news from the web.
    Return the news in a structured, summarised format in dot-point form
    with no introduction or conclusion, just the news.
    Also include the sources of the news in the format of a dot-point list
     of website links with the full URL.
    The news should be in the following format:
    - News item 1
    - News item 2
    - News item 3
    - News item 4
    - News item 5
    - News item 6
    - News item 7
    - News item 8
    - News item 9
    - News item 10
    - Sources:
      - Source 1
      - Source 2
      - Source 3
      - Source 4
      - Source 5
      - Source 6
      - Source 7
      - Source 8
      - Source 9
      - Source 10
    And include appropriate titles, formatting and spacing for readability.
    """
    response = genai.generate_text(prompt)
    return response.text

def send_whatsapp_news():
    account_sid = os.getenv("ACCOUNT_SID")
    auth_token = os.getenv("AUTH_TOKEN")
    client = Client(account_sid, auth_token)
    message = client.messages.create(
        to="+1234567890",
        from_="+1234567890",
        body=scrape_news()
    )
    print(message.sid)

if __name__ == "__main__":
    send_whatsapp_news()