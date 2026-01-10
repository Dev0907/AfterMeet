import cohere
import requests
import json
from qdrant_client import QdrantClient
from qdrant_client.models import VectorParams, Distance
from sentence_transformers import SentenceTransformer
from config.settings import Config

class APIClients:
    """Initialize and manage API clients"""
    
    def __init__(self):
        Config.validate()
        
        # Initialize Cohere client
        self.cohere_client = cohere.Client(Config.COHERE_API_KEY)
        
        # Initialize Ollama client (for Q&A to avoid rate limits)
        self.ollama_base_url = Config.OLLAMA_BASE_URL
        self.ollama_model = Config.OLLAMA_MODEL
        
        # Initialize Qdrant client
        self.qdrant_client = QdrantClient(
            url=Config.QDRANT_URL,
            api_key=Config.QDRANT_API_KEY,
        )
        
        # Initialize Sentence Transformer model
        print("Loading Sentence Transformer model...")
        self.embedding_model = SentenceTransformer(Config.EMBEDDING_MODEL)
        
        print("✓ All clients initialized successfully")
        self._verify_connections()
    
    def chat_with_ollama(self, prompt, system_prompt=None, temperature=0.7, max_tokens=1000):
        """Chat with Ollama model for Q&A purposes"""
        try:
            url = f"{self.ollama_base_url}/api/generate"
            
            # Combine system and user prompts
            full_prompt = prompt
            if system_prompt:
                full_prompt = f"{system_prompt}\n\nUser: {prompt}\n\nAssistant:"
            
            payload = {
                "model": self.ollama_model,
                "prompt": full_prompt,
                "stream": False,
                "options": {
                    "temperature": temperature,
                    "num_predict": max_tokens
                }
            }
            
            response = requests.post(url, json=payload, timeout=30)
            response.raise_for_status()
            
            result = response.json()
            return result.get("response", "")
            
        except Exception as e:
            print(f"⚠ Ollama request failed: {e}")
            return f"Error: Could not get response from Ollama. Make sure Ollama is running and the model '{self.ollama_model}' is available."
    
    def _verify_connections(self):
        """Verify API connections"""
        try:
            # Test Qdrant connection
            collections = self.qdrant_client.get_collections()
            print(f"✓ Qdrant connection verified. Collections: {len(collections.collections)}")
            
            # Test Cohere connection (simple ping)
            print("✓ Cohere client ready")
            
            # Test Ollama connection
            try:
                response = requests.get(f"{self.ollama_base_url}/api/tags", timeout=5)
                if response.status_code == 200:
                    models = response.json().get("models", [])
                    model_names = [m.get("name", "") for m in models]
                    if self.ollama_model in model_names:
                        print(f"✓ Ollama connection verified. Model '{self.ollama_model}' available")
                    else:
                        print(f"⚠ Ollama connected but model '{self.ollama_model}' not found. Available models: {model_names}")
                else:
                    print(f"⚠ Ollama server responded with status {response.status_code}")
            except Exception as e:
                print(f"⚠ Ollama connection failed: {e}")
            
        except Exception as e:
            print(f"⚠ Connection verification failed: {e}")
    
    def create_collection_if_not_exists(self):
        """Create Qdrant collection if it doesn't exist"""
        try:
            collections = self.qdrant_client.get_collections().collections
            collection_names = [col.name for col in collections]

            if Config.COLLECTION_NAME in collection_names:
                print(f"✓ Collection '{Config.COLLECTION_NAME}' already exists")
                collection_info = self.qdrant_client.get_collection(Config.COLLECTION_NAME)
                print(f"  Points count: {collection_info.points_count}")
                
                # Check if we need to create index for meeting_id
                try:
                    # Try to create index for meeting_id if it doesn't exist
                    from qdrant_client.models import PayloadSchemaType
                    self.qdrant_client.create_payload_index(
                        collection_name=Config.COLLECTION_NAME,
                        field_name="meeting_id",
                        field_schema=PayloadSchemaType.KEYWORD
                    )
                    print("✓ Created index for meeting_id field")
                except Exception as e:
                    if "already exists" in str(e).lower():
                        print("✓ Index for meeting_id already exists")
                    else:
                        print(f"⚠ Could not create index for meeting_id: {e}")
            else:
                from qdrant_client.models import PayloadSchemaType
                self.qdrant_client.create_collection(
                    collection_name=Config.COLLECTION_NAME,
                    vectors_config=VectorParams(size=Config.EMBEDDING_DIM, distance=Distance.COSINE),
                )
                print(f"✓ Created new collection: {Config.COLLECTION_NAME}")
                
                # Create index for meeting_id
                self.qdrant_client.create_payload_index(
                    collection_name=Config.COLLECTION_NAME,
                    field_name="meeting_id",
                    field_schema=PayloadSchemaType.KEYWORD
                )
                print("✓ Created index for meeting_id field")
                
        except Exception as e:
            print(f"⚠ Error with collection: {e}")
            raise