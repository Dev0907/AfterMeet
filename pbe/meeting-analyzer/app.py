"""
Flask Web Application for Meeting Analyzer
Serves the web interface and handles API endpoints
"""

from flask import Flask, render_template, request, jsonify
from werkzeug.utils import secure_filename
import os
import json
from datetime import datetime
from pathlib import Path

from config.settings import Config
from src.clients import APIClients
from src.transcript_parser import TranscriptParser
from src.meeting_analyzer import MeetingAnalyzer
from src.vector_store import VectorStore
from src.chat_interface import ChatInterface
from src.utils import generate_meeting_id

# Initialize Flask app
app = Flask(__name__, template_folder='templates', static_folder='static')

# Configuration
Config.validate()
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'txt', 'json', 'md'}

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Initialize components
try:
    clients = APIClients()
    clients.create_collection_if_not_exists()
    parser = TranscriptParser(clients.cohere_client)
    analyzer = MeetingAnalyzer(clients.cohere_client)
    vector_store = VectorStore(clients.qdrant_client, clients.embedding_model)
    chat_interface = ChatInterface(clients, vector_store)
    print("✓ All components initialized successfully")
except Exception as e:
    print(f"✗ Error initializing components: {e}")
    raise

# Store active meetings in memory (in production, use database)
active_meetings = {}


def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def read_transcript_file(filepath):
    """Read transcript from file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # If JSON, extract transcript text
        if filepath.endswith('.json'):
            try:
                data = json.loads(content)
                if isinstance(data, dict) and 'transcript' in data:
                    return data['transcript']
                elif isinstance(data, dict) and 'text' in data:
                    return data['text']
            except json.JSONDecodeError:
                pass
        
        return content
    except Exception as e:
        raise Exception(f"Error reading file: {str(e)}")


# Routes
@app.route('/')
def index():
    """Serve main page"""
    return render_template('index.html')


@app.route('/api/analyze', methods=['POST'])
def analyze_transcript():
    """
    Analyze uploaded transcript
    
    Expected: multipart/form-data with 'file' field
    Returns: JSON with analysis results
    """
    try:
        # Check if file is present
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        print(f"Received file: {file.filename}")
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'File type not allowed'}), 400
        
        # Save file
        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"{timestamp}_{filename}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Read transcript
        transcript_text = read_transcript_file(filepath)
        
        # Parse transcript
        print("Parsing transcript...")
        transcript = parser.parse_transcript_with_timestamps(transcript_text)
        
        # Add sentiment analysis
        transcript = parser.add_sentiment_analysis(transcript)
        
        # Analyze meeting
        print("Analyzing meeting...")
        summary = analyzer.analyze_meeting(transcript)
        
        # Generate meeting ID and store
        meeting_id = generate_meeting_id()
        print(f"Storing in vector database (Meeting ID: {meeting_id})...")
        stored_points = vector_store.store_transcript_in_qdrant(transcript, meeting_id)
        
        # Extract speakers
        speakers = {}
        for entry in transcript:
            # Handle both 'speaker' and 'speaker_name' keys
            speaker = entry.get('speaker_name') or entry.get('speaker') or 'Unknown'
            if speaker not in speakers:
                speakers[speaker] = {
                    'duration': 0,
                    'segments': 0,
                    'sentiment': 0,
                    'sentiment_count': 0
                }
            speakers[speaker]['segments'] += 1
            
            # Handle duration - convert to float if string
            duration = entry.get('duration', 0)
            if isinstance(duration, str):
                try:
                    duration = float(duration)
                except (ValueError, TypeError):
                    duration = 0
            speakers[speaker]['duration'] += duration
            
            # Handle sentiment - convert to float if string
            sentiment = entry.get('sentiment', 0)
            if isinstance(sentiment, str):
                try:
                    sentiment = float(sentiment)
                except (ValueError, TypeError):
                    sentiment = 0
            elif sentiment is None:
                sentiment = 0
            
            speakers[speaker]['sentiment'] += sentiment
            speakers[speaker]['sentiment_count'] += 1
        
        # Calculate average sentiment per speaker and add sentiment label
        for speaker in speakers:
            if speakers[speaker]['sentiment_count'] > 0:
                speakers[speaker]['sentiment'] = round(
                    speakers[speaker]['sentiment'] / speakers[speaker]['sentiment_count'], 2
                )
            speakers[speaker]['duration'] = round(speakers[speaker]['duration'], 2)
            
            # Add sentiment label (Positive, Negative, Neutral)
            sentiment_score = speakers[speaker]['sentiment']
            if sentiment_score > 0.3:
                speakers[speaker]['sentiment_label'] = 'Positive'
            elif sentiment_score < -0.3:
                speakers[speaker]['sentiment_label'] = 'Negative'
            else:
                speakers[speaker]['sentiment_label'] = 'Neutral'
            
            # Remove temporary count
            del speakers[speaker]['sentiment_count']
        
        # Extract tasks and topics - handle different formats
        tasks = []
        topics = []
        
        # Extract tasks/action items with full structure including tags
        if isinstance(summary.get('action_items'), list):
            for item in summary.get('action_items', []):
                if isinstance(item, dict):
                    # Keep the full object structure with owner, deadline, urgency_reason, and tags
                    tasks.append({
                        'task': item.get('task', str(item)),
                        'owner': item.get('owner', 'Unassigned'),
                        'deadline': item.get('deadline', 'No deadline'),
                        'urgency_reason': item.get('urgency_reason', ''),
                        'urgency': item.get('urgency', 'medium'),
                        'tags': item.get('tags', [])
                    })
                else:
                    tasks.append({
                        'task': str(item),
                        'owner': 'Unassigned',
                        'deadline': 'No deadline',
                        'urgency_reason': '',
                        'urgency': 'medium',
                        'tags': []
                    })
        elif isinstance(summary.get('action_items'), str):
            tasks = [{
                'task': summary.get('action_items'),
                'owner': 'Unassigned',
                'deadline': 'No deadline',
                'urgency_reason': '',
                'urgency': 'medium',
                'tags': []
            }]
        
        # Extract topics
        if isinstance(summary.get('key_topics'), list):
            topics = summary.get('key_topics', [])
        elif isinstance(summary.get('topics_discussed'), list):
            topics = summary.get('topics_discussed', [])
        elif isinstance(summary.get('key_topics'), str):
            topics = [summary.get('key_topics')]
        
        # Fallback: extract from summary text if no topics found
        if not topics and summary.get('summary'):
            # Simple extraction - split by common delimiters
            summary_text = summary.get('summary', '')
            if 'topic' in summary_text.lower():
                topics = ['General Discussion']
        
        # Ensure topics are lists of strings
        topics = [str(t) for t in topics if t]
        
        # Store meeting data
        meeting_data = {
            'meeting_id': meeting_id,
            'timestamp': datetime.now().isoformat(),
            'filename': filename,
            'transcript': transcript,
            'summary': {
                'summary_text': summary.get('summary', ''),
                'duration': f"{len(transcript)} entries",
                'participants': len(speakers),
                'key_focus': summary.get('key_focus', '')
            },
            'sentiment': {speaker: speakers[speaker]['sentiment'] for speaker in speakers},
            'speakers': speakers,
            'tasks': tasks,
            'topics': topics
        }
        
        active_meetings[meeting_id] = meeting_data
        
        # Return results
        return jsonify({
            'meeting_id': meeting_id,
            'summary': meeting_data['summary'],
            'sentiment': meeting_data['sentiment'],
            'speakers': meeting_data['speakers'],
            'tasks': tasks,
            'topics': topics,
            'status': 'success'
        }), 200
        
    except Exception as e:
        print(f"Error in analyze_transcript: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/chat', methods=['POST'])
def chat():
    """
    Chat interface for asking questions about meeting
    
    Expected JSON:
    {
        "meeting_id": "string",
        "question": "string"
    }
    
    Returns: JSON with answer and validation status
    
    Example:
    POST /api/chat
    {
        "meeting_id": "meeting_123",
        "question": "What were the main action items discussed?"
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'error': 'Invalid JSON',
                'status': 'error'
            }), 400
        
        meeting_id = data.get('meeting_id', '').strip()
        question = data.get('question', '').strip()
        
        # Validate inputs
        if not meeting_id:
            return jsonify({
                'error': 'meeting_id is required',
                'status': 'error'
            }), 400
        
        if not question:
            return jsonify({
                'error': 'question is required',
                'status': 'error'
            }), 400
        
        if len(question) < 3:
            return jsonify({
                'error': 'question must be at least 3 characters',
                'status': 'error'
            }), 400
        
        if meeting_id not in active_meetings:
            return jsonify({
                'error': f'Meeting "{meeting_id}" not found. Available meetings: {list(active_meetings.keys())}',
                'status': 'error'
            }), 404
        
        # Get answer using chat interface
        print(f"Processing question for meeting {meeting_id}: {question}")
        meeting_data = active_meetings[meeting_id]
        
        # Check if question is meeting-related
        is_related, validation_reason = chat_interface.is_meeting_related_question(question, meeting_data)
        
        if not is_related:
            return jsonify({
                'answer': 'I can only answer questions related to this meeting. Your question appears to be off-topic. Please ask something about the meeting content, participants, decisions, or action items.',
                'meeting_id': meeting_id,
                'is_meeting_related': False,
                'validation_reason': validation_reason,
                'status': 'success'
            }), 200
        
        # Get answer with semantic search
        answer = chat_interface.chat_with_transcript(
            question,
            meeting_data,
            use_semantic_search=True
        )
        
        return jsonify({
            'answer': answer,
            'meeting_id': meeting_id,
            'is_meeting_related': True,
            'status': 'success'
        }), 200
        
    except Exception as e:
        print(f"Error in chat: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'error': str(e),
            'status': 'error'
        }), 500


@app.route('/api/meetings/<meeting_id>', methods=['GET'])
def get_meeting(meeting_id):
    """
    Get meeting data
    
    Returns: Complete meeting analysis including summary, speakers, tasks, topics
    
    Example:
    GET /api/meetings/meeting_123
    """
    try:
        if meeting_id not in active_meetings:
            return jsonify({
                'error': f'Meeting "{meeting_id}" not found',
                'available_meetings': list(active_meetings.keys()),
                'status': 'error'
            }), 404
        
        meeting = active_meetings[meeting_id]
        return jsonify({
            'meeting_id': meeting_id,
            'summary': meeting['summary'],
            'sentiment': meeting['sentiment'],
            'speakers': meeting['speakers'],
            'tasks': meeting['tasks'],
            'topics': meeting['topics'],
            'timestamp': meeting['timestamp'],
            'filename': meeting['filename'],
            'status': 'success'
        }), 200
        
    except Exception as e:
        return jsonify({
            'error': str(e),
            'status': 'error'
        }), 500


@app.route('/api/health', methods=['GET'])
def health():
    """
    Health check endpoint
    
    Returns: Server status and active meetings count
    
    Example:
    GET /api/health
    """
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'active_meetings': len(active_meetings),
        'meetings': list(active_meetings.keys())
    }), 200


@app.route('/api/meetings', methods=['GET'])
def list_meetings():
    """
    List all active meetings
    
    Returns: Array of meeting IDs with basic info
    
    Example:
    GET /api/meetings
    """
    try:
        meetings_list = []
        for meeting_id, meeting_data in active_meetings.items():
            meetings_list.append({
                'meeting_id': meeting_id,
                'filename': meeting_data.get('filename'),
                'timestamp': meeting_data.get('timestamp'),
                'participants': len(meeting_data.get('speakers', {})),
                'action_items': len(meeting_data.get('tasks', []))
            })
        
        return jsonify({
            'meetings': meetings_list,
            'total': len(meetings_list),
            'status': 'success'
        }), 200
    except Exception as e:
        return jsonify({
            'error': str(e),
            'status': 'error'
        }), 500


@app.route('/api/meetings/<meeting_id>/tasks', methods=['GET'])
def get_tasks(meeting_id):
    """
    Get action items/tasks for a meeting
    
    Returns: Array of tasks with owner, deadline, and urgency
    
    Example:
    GET /api/meetings/meeting_123/tasks
    """
    try:
        if meeting_id not in active_meetings:
            return jsonify({
                'error': f'Meeting "{meeting_id}" not found',
                'status': 'error'
            }), 404
        
        meeting = active_meetings[meeting_id]
        tasks = meeting.get('tasks', [])
        
        # Sort by urgency
        urgency_order = {'critical': 0, 'high': 1, 'medium': 2, 'low': 3}
        sorted_tasks = sorted(
            tasks,
            key=lambda x: urgency_order.get(x.get('urgency', 'medium'), 2)
        )
        
        return jsonify({
            'meeting_id': meeting_id,
            'tasks': sorted_tasks,
            'total': len(sorted_tasks),
            'status': 'success'
        }), 200
    except Exception as e:
        return jsonify({
            'error': str(e),
            'status': 'error'
        }), 500


@app.route('/api/meetings/<meeting_id>/speakers', methods=['GET'])
def get_speakers(meeting_id):
    """
    Get speaker statistics for a meeting
    
    Returns: Speaker names with duration, segments, and sentiment
    
    Example:
    GET /api/meetings/meeting_123/speakers
    """
    try:
        if meeting_id not in active_meetings:
            return jsonify({
                'error': f'Meeting "{meeting_id}" not found',
                'status': 'error'
            }), 404
        
        meeting = active_meetings[meeting_id]
        speakers = meeting.get('speakers', {})
        
        # Sort by duration
        sorted_speakers = sorted(
            speakers.items(),
            key=lambda x: x[1].get('duration', 0),
            reverse=True
        )
        
        speakers_data = [
            {
                'name': name,
                'duration': info['duration'],
                'segments': info['segments'],
                'sentiment': info['sentiment']
            }
            for name, info in sorted_speakers
        ]
        
        return jsonify({
            'meeting_id': meeting_id,
            'speakers': speakers_data,
            'total_speakers': len(speakers_data),
            'status': 'success'
        }), 200
    except Exception as e:
        return jsonify({
            'error': str(e),
            'status': 'error'
        }), 500


@app.route('/api/meetings/<meeting_id>/summary', methods=['GET'])
def get_summary(meeting_id):
    """
    Get formatted summary for a meeting
    
    Returns: Comprehensive meeting summary with all details
    
    Example:
    GET /api/meetings/meeting_123/summary
    """
    try:
        if meeting_id not in active_meetings:
            return jsonify({
                'error': f'Meeting "{meeting_id}" not found',
                'status': 'error'
            }), 404
        
        meeting = active_meetings[meeting_id]
        
        # Build comprehensive summary
        summary_text = f"""
MEETING SUMMARY REPORT
{'='*60}

OVERVIEW
{'-'*60}
{meeting['summary'].get('summary_text', 'No summary available')}

KEY PARTICIPANTS
{'-'*60}
"""
        for speaker, info in meeting['speakers'].items():
            summary_text += f"• {speaker}: {info['segments']} segments, {info['duration']}s duration\n"
        
        summary_text += f"\nKEY TOPICS\n{'-'*60}\n"
        for topic in meeting['topics']:
            summary_text += f"• {topic}\n"
        
        summary_text += f"\nACTION ITEMS\n{'-'*60}\n"
        for task in meeting['tasks']:
            summary_text += f"• {task.get('task', 'N/A')} (Owner: {task.get('owner', 'Unassigned')}, Deadline: {task.get('deadline', 'N/A')})\n"
        
        summary_text += f"\nSENTIMENT ANALYSIS\n{'-'*60}\n"
        for speaker, sentiment in meeting['sentiment'].items():
            sentiment_label = "Positive" if sentiment > 0.5 else "Negative" if sentiment < -0.5 else "Neutral"
            summary_text += f"• {speaker}: {sentiment_label} ({sentiment:.2f})\n"
        
        return jsonify({
            'meeting_id': meeting_id,
            'summary': summary_text,
            'status': 'success'
        }), 200
        
    except Exception as e:
        return jsonify({
            'error': str(e),
            'status': 'error'
        }), 500


@app.errorhandler(413)
def request_entity_too_large(error):
    """Handle file too large error"""
    return jsonify({'error': 'File too large (max 16MB)'}), 413


@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({'error': 'Not found'}), 404


@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    return jsonify({'error': 'Internal server error'}), 500


if __name__ == '__main__':
    print("🚀 Starting Meeting Analyzer Web Server")
    print("=" * 60)
    print("Server running at http://localhost:5000")
    print("=" * 60)
    app.run(debug=True, host='0.0.0.0', port=5000)


@app.route('/api/meetings/<meeting_id>/sentiment', methods=['GET'])
def get_sentiment_analysis(meeting_id):
    """
    Get detailed sentiment analysis for a meeting
    
    Returns: Speaker-wise sentiment with labels (Positive, Negative, Neutral)
    
    Example:
    GET /api/meetings/meeting_123/sentiment
    """
    try:
        if meeting_id not in active_meetings:
            return jsonify({
                'error': f'Meeting "{meeting_id}" not found',
                'status': 'error'
            }), 404
        
        meeting = active_meetings[meeting_id]
        speakers = meeting.get('speakers', {})
        
        # Build sentiment analysis with labels
        sentiment_analysis = []
        for speaker, info in speakers.items():
            sentiment_analysis.append({
                'speaker': speaker,
                'sentiment_score': info['sentiment'],
                'sentiment_label': info.get('sentiment_label', 'Neutral'),
                'segments': info['segments'],
                'duration': info['duration']
            })
        
        # Sort by sentiment score
        sentiment_analysis.sort(key=lambda x: x['sentiment_score'], reverse=True)
        
        # Count sentiment distribution
        positive_count = sum(1 for s in sentiment_analysis if s['sentiment_label'] == 'Positive')
        negative_count = sum(1 for s in sentiment_analysis if s['sentiment_label'] == 'Negative')
        neutral_count = sum(1 for s in sentiment_analysis if s['sentiment_label'] == 'Neutral')
        
        return jsonify({
            'meeting_id': meeting_id,
            'sentiment_analysis': sentiment_analysis,
            'summary': {
                'positive': positive_count,
                'negative': negative_count,
                'neutral': neutral_count,
                'total_speakers': len(sentiment_analysis)
            },
            'status': 'success'
        }), 200
    except Exception as e:
        return jsonify({
            'error': str(e),
            'status': 'error'
        }), 500


@app.route('/api/meetings/<meeting_id>/tasks/by-tag', methods=['GET'])
def get_tasks_by_tag(meeting_id):
    """
    Get tasks filtered by tag
    
    Query Parameters:
    - tag: The tag to filter by (e.g., 'development', 'documentation', 'testing')
    
    Returns: Array of tasks with the specified tag
    
    Example:
    GET /api/meetings/meeting_123/tasks/by-tag?tag=development
    """
    try:
        if meeting_id not in active_meetings:
            return jsonify({
                'error': f'Meeting "{meeting_id}" not found',
                'status': 'error'
            }), 404
        
        tag = request.args.get('tag', '').lower().strip()
        if not tag:
            return jsonify({
                'error': 'tag parameter is required',
                'status': 'error'
            }), 400
        
        meeting = active_meetings[meeting_id]
        tasks = meeting.get('tasks', [])
        
        # Filter tasks by tag
        filtered_tasks = [
            task for task in tasks
            if tag in [t.lower() for t in task.get('tags', [])]
        ]
        
        # Sort by urgency
        urgency_order = {'critical': 0, 'high': 1, 'medium': 2, 'low': 3}
        filtered_tasks.sort(
            key=lambda x: urgency_order.get(x.get('urgency', 'medium'), 2)
        )
        
        return jsonify({
            'meeting_id': meeting_id,
            'tag': tag,
            'tasks': filtered_tasks,
            'total': len(filtered_tasks),
            'status': 'success'
        }), 200
    except Exception as e:
        return jsonify({
            'error': str(e),
            'status': 'error'
        }), 500


@app.route('/api/meetings/<meeting_id>/tasks/by-owner', methods=['GET'])
def get_tasks_by_owner(meeting_id):
    """
    Get tasks assigned to a specific owner
    
    Query Parameters:
    - owner: The owner name to filter by
    
    Returns: Array of tasks assigned to the owner
    
    Example:
    GET /api/meetings/meeting_123/tasks/by-owner?owner=John
    """
    try:
        if meeting_id not in active_meetings:
            return jsonify({
                'error': f'Meeting "{meeting_id}" not found',
                'status': 'error'
            }), 404
        
        owner = request.args.get('owner', '').strip()
        if not owner:
            return jsonify({
                'error': 'owner parameter is required',
                'status': 'error'
            }), 400
        
        meeting = active_meetings[meeting_id]
        tasks = meeting.get('tasks', [])
        
        # Filter tasks by owner (case-insensitive)
        filtered_tasks = [
            task for task in tasks
            if task.get('owner', '').lower() == owner.lower()
        ]
        
        # Sort by urgency
        urgency_order = {'critical': 0, 'high': 1, 'medium': 2, 'low': 3}
        filtered_tasks.sort(
            key=lambda x: urgency_order.get(x.get('urgency', 'medium'), 2)
        )
        
        return jsonify({
            'meeting_id': meeting_id,
            'owner': owner,
            'tasks': filtered_tasks,
            'total': len(filtered_tasks),
            'status': 'success'
        }), 200
    except Exception as e:
        return jsonify({
            'error': str(e),
            'status': 'error'
        }), 500


@app.route('/api/meetings/<meeting_id>/tasks/by-urgency', methods=['GET'])
def get_tasks_by_urgency(meeting_id):
    """
    Get tasks filtered by urgency level
    
    Query Parameters:
    - urgency: The urgency level (critical, high, medium, low)
    
    Returns: Array of tasks with the specified urgency
    
    Example:
    GET /api/meetings/meeting_123/tasks/by-urgency?urgency=critical
    """
    try:
        if meeting_id not in active_meetings:
            return jsonify({
                'error': f'Meeting "{meeting_id}" not found',
                'status': 'error'
            }), 404
        
        urgency = request.args.get('urgency', '').lower().strip()
        if not urgency or urgency not in ['critical', 'high', 'medium', 'low']:
            return jsonify({
                'error': 'urgency parameter must be one of: critical, high, medium, low',
                'status': 'error'
            }), 400
        
        meeting = active_meetings[meeting_id]
        tasks = meeting.get('tasks', [])
        
        # Filter tasks by urgency
        filtered_tasks = [
            task for task in tasks
            if task.get('urgency', 'medium').lower() == urgency
        ]
        
        return jsonify({
            'meeting_id': meeting_id,
            'urgency': urgency,
            'tasks': filtered_tasks,
            'total': len(filtered_tasks),
            'status': 'success'
        }), 200
    except Exception as e:
        return jsonify({
            'error': str(e),
            'status': 'error'
        }), 500


@app.route('/api/meetings/<meeting_id>/sentiment/by-speaker', methods=['GET'])
def get_sentiment_by_speaker(meeting_id):
    """
    Get sentiment for a specific speaker
    
    Query Parameters:
    - speaker: The speaker name to get sentiment for
    
    Returns: Sentiment details for the speaker
    
    Example:
    GET /api/meetings/meeting_123/sentiment/by-speaker?speaker=John
    """
    try:
        if meeting_id not in active_meetings:
            return jsonify({
                'error': f'Meeting "{meeting_id}" not found',
                'status': 'error'
            }), 404
        
        speaker = request.args.get('speaker', '').strip()
        if not speaker:
            return jsonify({
                'error': 'speaker parameter is required',
                'status': 'error'
            }), 400
        
        meeting = active_meetings[meeting_id]
        speakers = meeting.get('speakers', {})
        
        # Find speaker (case-insensitive)
        speaker_info = None
        for sp_name, sp_data in speakers.items():
            if sp_name.lower() == speaker.lower():
                speaker_info = {
                    'speaker': sp_name,
                    'sentiment_score': sp_data['sentiment'],
                    'sentiment_label': sp_data.get('sentiment_label', 'Neutral'),
                    'segments': sp_data['segments'],
                    'duration': sp_data['duration']
                }
                break
        
        if not speaker_info:
            return jsonify({
                'error': f'Speaker "{speaker}" not found in meeting',
                'available_speakers': list(speakers.keys()),
                'status': 'error'
            }), 404
        
        return jsonify({
            'meeting_id': meeting_id,
            'speaker_sentiment': speaker_info,
            'status': 'success'
        }), 200
    except Exception as e:
        return jsonify({
            'error': str(e),
            'status': 'error'
        }), 500
