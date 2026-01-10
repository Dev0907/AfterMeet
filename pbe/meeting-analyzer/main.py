#!/usr/bin/env python3
"""
Meeting Analyzer - Main Application
AI-powered meeting analysis with semantic search and interactive chat
"""

from datetime import datetime
from src.clients import APIClients
from src.transcript_parser import TranscriptParser
from src.meeting_analyzer import MeetingAnalyzer
from src.vector_store import VectorStore
from src.chat_interface import ChatInterface
from src.utils import export_meeting_analysis, generate_meeting_id, demo_questions, print_meeting_summary
from data.sample_transcript import RAW_TRANSCRIPT

def main():
    """Main application entry point"""
    print("🚀 Meeting Analyzer - AI-Powered Meeting Analysis")
    print("="*60)
    
    try:
        # Initialize API clients
        clients = APIClients()
        clients.create_collection_if_not_exists()
        
        # Initialize components
        parser = TranscriptParser(clients.cohere_client)
        analyzer = MeetingAnalyzer(clients.cohere_client)
        vector_store = VectorStore(clients.qdrant_client, clients.embedding_model)
        chat_interface = ChatInterface(clients, vector_store)  # Pass full clients object
        
        # Parse transcript
        print(f"\n{'='*60}")
        print("PARSING TRANSCRIPT")
        print("="*60)
        
        transcript = parser.parse_transcript_with_timestamps(RAW_TRANSCRIPT)
        print(f"✓ Parsed {len(transcript)} transcript entries with timestamps")
        
        # Add sentiment analysis
        transcript = parser.add_sentiment_analysis(transcript)
        
        # Analyze meeting
        summary = analyzer.analyze_meeting(transcript)
        
        # Store in vector database
        meeting_id = generate_meeting_id()
        print(f"\n{'='*60}")
        print(f"STORING TRANSCRIPT IN QDRANT CLOUD")
        print(f"{'='*60}")
        print(f"Meeting ID: {meeting_id}")
        
        stored_points = vector_store.store_transcript_in_qdrant(transcript, meeting_id)
        
        # Create processed meeting data
        processed_meeting_data = {
            "meeting_id": meeting_id,
            "timestamp": datetime.now().isoformat(),
            "overall_sentiment": summary.get("overall_sentiment", "neutral"),
            "transcript": transcript,
            "summary": summary,
            "qdrant_stored": True,
            "total_entries_stored": len(stored_points)
        }
        
        # Print summary
        print_meeting_summary(processed_meeting_data)
        
        # Export results
        export_meeting_analysis(processed_meeting_data, "data/meeting_analysis.json")
        
        # Run demo Q&A
        demo_questions(chat_interface, processed_meeting_data)
        
        # Start interactive chat
        print("\n" + "="*60)
        print("🚀 STARTING INTERACTIVE CHAT SESSION")
        print("="*60)
        
        chat_interface.interactive_chat(processed_meeting_data)
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        print("Please check your configuration and API keys.")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())