import json
from datetime import datetime

def export_meeting_analysis(data, filename="meeting_analysis.json"):
    """Export meeting analysis to JSON file"""
    # Create a copy without embedding model reference
    export_data = {
        "meeting_id": data["meeting_id"],
        "timestamp": data["timestamp"],
        "overall_sentiment": data["overall_sentiment"],
        "summary": data["summary"],
        "qdrant_stored": data["qdrant_stored"],
        "total_entries_stored": data["total_entries_stored"],
        "transcript_sample": data["transcript"][:5]  # First 5 entries for reference
    }

    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(export_data, f, indent=2, ensure_ascii=False)
    print(f"\n✓ Meeting analysis exported to {filename}")

def generate_meeting_id():
    """Generate unique meeting ID"""
    return f"mtg_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

def demo_questions(chat_interface, processed_data):
    """Run demo Q&A session"""
    print("\n" + "="*60)
    print("SAMPLE Q&A DEMO")
    print("="*60)

    questions = [
        "What are the main action items and their urgency levels?",
        "Who is responsible for the backend?",
        "What concerns did the team raise?",
        "What is the timeline for the hackathon?"
    ]

    for i, question in enumerate(questions, 1):
        print(f"\n[Q{i}] {question}")
        print("-" * 60)
        answer = chat_interface.chat_with_transcript(question, processed_data)
        print(f"[A{i}] {answer}")

def print_meeting_summary(processed_data):
    """Print formatted meeting summary"""
    print("\n" + "="*60)
    print("MEETING DATA PROCESSED")
    print("="*60)
    print(f"Meeting ID: {processed_data['meeting_id']}")
    print(f"Total messages: {len(processed_data['transcript'])}")
    print(f"Action items: {len(processed_data['summary'].get('action_items', []))}")
    print(f"Overall sentiment: {processed_data['overall_sentiment']}")
    print(f"Stored in Qdrant Cloud: {processed_data['qdrant_stored']}")
    print(f"Total entries in Qdrant: {processed_data['total_entries_stored']}")
    
    print("\nMeeting Summary:")
    print(json.dumps(processed_data['summary'], indent=2))