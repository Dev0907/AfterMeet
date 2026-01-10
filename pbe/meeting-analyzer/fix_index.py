#!/usr/bin/env python3
"""
Fix Qdrant indexing issue
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from src.clients import APIClients
from qdrant_client.models import PayloadSchemaType
from config.settings import Config

def fix_index():
    """Create the missing index for meeting_id"""
    print("🔧 Fixing Qdrant Index")
    print("="*30)
    
    try:
        # Initialize clients
        clients = APIClients()
        
        # Create index for meeting_id
        print("Creating index for meeting_id field...")
        clients.qdrant_client.create_payload_index(
            collection_name=Config.COLLECTION_NAME,
            field_name="meeting_id",
            field_schema=PayloadSchemaType.KEYWORD
        )
        print("✓ Index created successfully!")
        
        # Test the fix
        print("\nTesting search functionality...")
        from src.vector_store import VectorStore
        vector_store = VectorStore(clients.qdrant_client, clients.embedding_model)
        
        # Get a sample meeting ID
        points = clients.qdrant_client.scroll(
            collection_name=Config.COLLECTION_NAME,
            limit=1,
            with_payload=True
        )[0]
        
        if points:
            meeting_id = points[0].payload.get('meeting_id')
            print(f"Testing with meeting ID: {meeting_id}")
            
            results = vector_store.search_relevant_transcript("development", meeting_id, top_k=2)
            print(f"✓ Search test successful! Found {len(results)} results")
            
            for i, result in enumerate(results, 1):
                payload = result.payload
                print(f"  {i}. {payload.get('speaker_name', 'Unknown')}: {payload.get('text', 'N/A')[:50]}...")
        
        print("\n🎉 Index fix completed successfully!")
        
    except Exception as e:
        if "already exists" in str(e).lower():
            print("✓ Index already exists, testing search...")
            # Test anyway
            try:
                from src.vector_store import VectorStore
                vector_store = VectorStore(clients.qdrant_client, clients.embedding_model)
                
                points = clients.qdrant_client.scroll(
                    collection_name=Config.COLLECTION_NAME,
                    limit=1,
                    with_payload=True
                )[0]
                
                if points:
                    meeting_id = points[0].payload.get('meeting_id')
                    results = vector_store.search_relevant_transcript("development", meeting_id, top_k=1)
                    print(f"✓ Search working! Found {len(results)} results")
                    print("🎉 Everything is working correctly!")
                
            except Exception as test_e:
                print(f"❌ Search still failing: {test_e}")
                return False
        else:
            print(f"❌ Error: {e}")
            return False
    
    return True

if __name__ == "__main__":
    success = fix_index()
    sys.exit(0 if success else 1)