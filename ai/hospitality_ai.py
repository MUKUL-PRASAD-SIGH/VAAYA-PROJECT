from textblob import TextBlob

def analyze_tone(text):
    polarity = TextBlob(text).sentiment.polarity
    if polarity > 0.3: return "positive"
    elif polarity < -0.2: return "negative"
    return "neutral"
