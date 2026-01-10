from datetime import timedelta
import time
from config.settings import Config

class TranscriptParser:
    """Parse and process meeting transcripts"""
    
    def __init__(self, cohere_client):
        self.cohere_client = cohere_client
    
    def parse_transcript_with_timestamps(self, raw_text, start_time=0, avg_gap=30):
        """
        Parse raw transcript and add timestamps

        Args:
            raw_text: Raw transcript string
            start_time: Starting timestamp in seconds
            avg_gap: Average seconds between messages
        """
        lines = [line.strip() for line in raw_text.strip().split('\n') if line.strip()]
        transcript = []
        current_time = start_time

        for line in lines:
            if ':' in line:
                parts = line.split(':', 1)
                speaker = parts[0].strip()
                text = parts[1].strip()

                timestamp = str(timedelta(seconds=current_time))

                transcript.append({
                    "timestamp": timestamp,
                    "speaker_name": speaker,
                    "text": text,
                    "sentiment": None  # Will be filled later
                })

                # Increment time based on text length
                current_time += avg_gap + len(text) // 10

        return transcript
    
    def analyze_sentiment(self, text):
        """
        Analyze sentiment of individual message using LLM
        Returns numeric sentiment score (-1 to 1)
        """
        system_prompt = """You are a sentiment analyzer. Analyze the sentiment of the given text.
        Respond with ONLY ONE WORD: positive, neutral, or negative."""

        try:
            response = self.cohere_client.chat(
                model="command-r-v2",
                preamble=system_prompt,
                message=f"Analyze sentiment: '{text}'",
                temperature=0.1,
                max_tokens=5
            )

            sentiment_text = response.text.strip().lower()

            # Convert to numeric score
            if 'positive' in sentiment_text:
                return 0.75  # Positive sentiment
            elif 'negative' in sentiment_text:
                return -0.75  # Negative sentiment
            else:
                return 0.0  # Neutral sentiment
        except Exception as e:
            print(f"Sentiment analysis error: {e}")
            return 0.0  # Default to neutral on error
    
    def add_sentiment_analysis(self, transcript):
        """Add sentiment analysis to transcript entries"""
        print("\nAnalyzing sentiment for each message...")
        
        for i, entry in enumerate(transcript):
            entry['sentiment'] = self.analyze_sentiment(entry['text'])
            # Add delay to avoid hitting rate limits
            time.sleep(Config.API_DELAY_SECONDS)
            if (i + 1) % 5 == 0:
                print(f"  Processed {i + 1}/{len(transcript)} messages...")
        
        print("✓ Sentiment analysis complete")
        return transcript