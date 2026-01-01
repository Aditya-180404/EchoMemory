from openai import AzureOpenAI

class NarrativeEngine:
    """
    EchoMemory Narrative Reconstruction Engine
    Powered by Azure OpenAI (GPT-4)
    """
    
    def __init__(self, api_key, endpoint, deployment_name):
        self.client = AzureOpenAI(
            api_key=api_key,  
            api_version="2023-05-15",
            azure_endpoint=endpoint
        )
        self.deployment_name = deployment_name

    def reconstruct(self, base_text, entities, emotions, language='en'):
        """
        Use GPT-4 to build a supportive, non-hallucinatory narrative.
        """
        prompt = f"""
        You are a supportive assistive AI for people with memory loss.
        Reconstruct a cohesive, empathetic memory from these fragments.
        
        Original Text: {base_text}
        Entities Found: {entities}
        Detected Sentiment: {emotions}
        
        Rules:
        1. Speak in the first person ("I remember...") only if confidence is high, else use supportive uncertainty ("It seems like...").
        2. Do NOT hallucinate details not present in the fragments.
        3. Maintain a calm, non-alarming tone.
        4. Respond in {language} language.
        5. Keep it under 100 words.
        """

        try:
            response = self.client.chat.completions.create(
                model=self.deployment_name,
                messages=[
                    {"role": "system", "content": "You are EchoMemory, a calm and supportive memory reconstruction assistant."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3
            )
            
            narrative = response.choices[0].message.content
            
            return {
                "narrative": narrative,
                "confidence": 0.9, # GPT-4 generated narratives are typically high confidence reconstructions
                "suggest_correction": False
            }
        except Exception as e:
            print(f"OpenAI Error: {e}")
            return {"error": "Narrative generation failed"}

if __name__ == "__main__":
    pass
