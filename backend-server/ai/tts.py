import azure.cognitiveservices.speech as speechsdk

class AzureTTSEngine:
    """
    Multilingual TTS Engine powered by Azure Neural Voices
    """
    
    def __init__(self, key, region):
        self.speech_config = speechsdk.SpeechConfig(subscription=key, region=region)
        # Using a universal neural voice or standardizing per language
        # For production, map language_code to specific neural voice (e.g., hi-IN-MadhurNeural)

    def generate_speech(self, text, lang='en-US', output_path='output.mp3'):
        """
        Convert text to speech using Azure Neural Voice
        """
        # Map simple language codes to Azure voice locales
        voice_map = {
            'en': 'en-US-JennyNeural',
            'hi': 'hi-IN-MadhurNeural',
            'bn': 'bn-IN-TanishaaNeural',
            'ta': 'ta-IN-PallaviNeural',
            'te': 'te-IN-ShrutiNeural',
            'mr': 'mr-IN-AarohiNeural',
            'gu': 'gu-IN-DhwaniNeural'
        }
        
        voice = voice_map.get(lang[:2], 'en-US-JennyNeural')
        self.speech_config.speech_synthesis_voice_name = voice
        
        audio_config = speechsdk.audio.AudioOutputConfig(filename=output_path)
        synthesizer = speechsdk.SpeechSynthesizer(speech_config=self.speech_config, audio_config=audio_config)
        
        result = synthesizer.speak_text_async(text).get()
        
        if result.reason == speechsdk.ResultReason.SynthesizingAudioCompleted:
            return output_path
        else:
            print(f"TTS Error: {result.reason}")
            return None

if __name__ == "__main__":
    pass
