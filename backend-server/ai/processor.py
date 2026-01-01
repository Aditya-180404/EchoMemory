import os
import azure.cognitiveservices.speech as speechsdk
from azure.ai.textanalytics import TextAnalyticsClient
from azure.core.credentials import AzureKeyCredential

class AzureAIProcessor:
    def __init__(self, speech_key, speech_region, language_key, language_endpoint):
        self.speech_config = speechsdk.SpeechConfig(subscription=speech_key, region=speech_region)
        self.language_client = TextAnalyticsClient(
            endpoint=language_endpoint, 
            credential=AzureKeyCredential(language_key)
        )

    def process_voice(self, audio_path, language_code='en-US'):
        """
        Transcribe audio using Azure Speech SDK
        """
        audio_config = speechsdk.audio.AudioConfig(filename=audio_path)
        speech_recognizer = speechsdk.SpeechRecognizer(
            speech_config=self.speech_config, 
            language=language_code, 
            audio_config=audio_config
        )

        result = speech_recognizer.recognize_once_async().get()

        if result.reason == speechsdk.ResultReason.RecognizedSpeech:
            text = result.text
            # Extract Entities & Sentiment (Emotions)
            analysis = self.analyze_text(text, language_code[:2])
            return {
                "text": text,
                "entities": analysis['entities'],
                "emotions": analysis['sentiment'],
                "language": language_code
            }
        else:
            return {"error": f"Speech recognition failed: {result.reason}"}

    def analyze_text(self, text, lang):
        """
        Analyze text for entities and sentiment using Azure AI Language
        """
        documents = [text]
        
        # 1. Entity Recognition
        entity_response = self.language_client.recognize_entities(documents, language=lang)[0]
        entities = []
        for entity in entity_response.entities:
            entities.append({
                "name": entity.text,
                "type": entity.category.lower(),
                "score": entity.confidence_score
            })

        # 2. Sentiment Analysis (Mapping to Emotions)
        sentiment_response = self.language_client.analyze_sentiment(documents, language=lang)[0]
        
        return {
            "entities": entities,
            "sentiment": [
                {"label": "positive", "score": sentiment_response.confidence_scores.positive},
                {"label": "neutral", "score": sentiment_response.confidence_scores.neutral},
                {"label": "negative", "score": sentiment_response.confidence_scores.negative}
            ]
        }

if __name__ == "__main__":
    pass
