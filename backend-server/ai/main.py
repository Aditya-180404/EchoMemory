import sys
import json
import os
import mysql.connector
from processor import AzureAIProcessor
from narrative import NarrativeEngine
from tts import AzureTTSEngine
from config_loader import load_php_config

def process_memory(memory_id):
    # 1. Load Config from PHP
    config_path = os.path.join(os.path.dirname(__file__), '../config/config.php')
    php_config = load_php_config(config_path)
    
    # 2. Connect to DB
    db = mysql.connector.connect(
        host=php_config.get('DB_HOST', 'localhost'),
        user=php_config.get('DB_USER', 'root'),
        password=php_config.get('DB_PASS', ''),
        database=php_config.get('DB_NAME', 'echomemory')
    )
    cursor = db.cursor(dictionary=True)

    # 3. Fetch Memory Data
    cursor.execute("SELECT * FROM memories WHERE id = %s", (memory_id,))
    memory = cursor.fetchone()
    if not memory:
        print(f"Memory {memory_id} not found")
        return

    # 4. Initialize Azure AI Services
    processor = AzureAIProcessor(
        php_config.get('AZURE_SPEECH_KEY'),
        php_config.get('AZURE_SPEECH_REGION'),
        php_config.get('AZURE_LANGUAGE_KEY'),
        php_config.get('AZURE_LANGUAGE_ENDPOINT')
    )
    
    narrative_generator = NarrativeEngine(
        php_config.get('AZURE_OPENAI_KEY'),
        php_config.get('AZURE_OPENAI_ENDPOINT'),
        php_config.get('AZURE_OPENAI_DEPLOYMENT')
    )
    
    tts_engine = AzureTTSEngine(
        php_config.get('AZURE_SPEECH_KEY'),
        php_config.get('AZURE_SPEECH_REGION')
    )

    # Path to audio (adjust based on storage strategy)
    audio_path = memory['audio_path'] 
    if not os.path.exists(audio_path):
        # In a real scenario, download from Azure Blob if not local
        audio_path = os.path.join(os.path.dirname(__file__), '../storage/uploads/', audio_path)

    # 5. Execute Pipeline
    print(f"Running Azure AI Pipeline for Memory {memory_id}...")
    
    # Run STT & Entity Extraction
    results = processor.process_voice(audio_path, memory['language_code'])
    if 'error' in results:
        print(results['error'])
        return
    
    # Generate Narrative via Azure OpenAI
    reconstruction = narrative_generator.reconstruct(
        results['text'], 
        results['entities'], 
        results['emotions'], 
        memory['language_code']
    )

    # Generate Neural TTS
    tts_filename = f"reconstructed_{memory['uid']}.mp3"
    storage_base = os.path.join(os.path.dirname(__file__), '../storage/processed/')
    if not os.path.exists(storage_base): os.makedirs(storage_base)
    
    tts_path = os.path.join(storage_base, tts_filename)
    tts_engine.generate_speech(reconstruction['narrative'], memory['language_code'], tts_path)

    # 6. Update Database
    cursor.execute("""
        UPDATE memories 
        SET narrative_text = %s, 
            confidence_score = %s,
            media_path = %s
        WHERE id = %s
    """, (reconstruction['narrative'], reconstruction['confidence'], f"processed/{tts_filename}", memory_id))

    db.commit()
    cursor.close()
    db.close()
    print(f"Memory {memory_id} successfully reconstructed via Azure AI.")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        process_memory(sys.argv[1])
    else:
        print("Usage: python main.py <memory_id>")
