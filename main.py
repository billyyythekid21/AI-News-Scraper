import twilio
from twilio.rest import Client

with open("../secretfiles/news_scraper/secret.txt") as secret:
    TARGET_PHONE_NUMBER = secret.read().strip()