# Meeting Analyzer

AI-powered meeting analysis tool with REST APIs for uploading transcripts, analyzing meetings, and asking questions about meeting content.

## ✨ Features

- 📝 Meeting transcript parsing with timestamps
- 🤖 AI-powered summarization and action item extraction
- ⚡ Urgency detection for tasks with LLM analysis
- 😊 Sentiment analysis per speaker
- 🔍 Semantic search using vector embeddings (Qdrant)
- 💬 Interactive Q&A with meeting validation
- 📊 Speaker statistics and participation metrics
- 🎯 Meeting-only Q&A (rejects off-topic questions)
- 🚀 Production-ready REST APIs

## 🚀 Quick Start

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your API keys:
# - COHERE_API_KEY
# - QDRANT_URL
# - QDRANT_API_KEY
# - OLLAMA_BASE_URL (default: http://localhost:11434)
```

### 3. Start Services
```bash
# Terminal 1: Start Ollama (for Q&A)
ollama serve

# Terminal 2: Start Flask server
python app.py
```

Server runs at: `http://localhost:5000`

### 4. Test APIs
```bash
python test_apis.py
```

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| **API_DOCUMENTATION.md** | Complete API reference with examples |
| **DEVELOPER_GUIDE.md** | Developer guide with code examples |
| **QUICK_REFERENCE.md** | Quick lookup for common tasks |
| **IMPLEMENTATION_SUMMARY.md** | What was implemented and how |

## 🔌 API Endpoints

### Upload & Analyze
```bash
POST /api/analyze
# Upload a meeting transcript and get analysis
```

### Get Meeting Data
```bash
GET /api/meetings                    # List all meetings
GET /api/meetings/{id}               # Get full analysis
GET /api/meetings/{id}/summary       # Get text summary
GET /api/meetings/{id}/tasks         # Get action items
GET /api/meetings/{id}/speakers      # Get speaker stats
```

### Ask Questions
```bash
POST /api/chat
# Ask questions about the meeting (meeting-only validation)
```

### Health Check
```bash
GET /api/health
# Check server status
```

## 💻 Usage Examples

### Python
```python
import requests

BASE = "http://localhost:5000"

# Upload transcript
with open('meeting.txt', 'rb') as f:
    r = requests.post(f"{BASE}/api/analyze", files={'file': f})
    meeting_id = r.json()['meeting_id']

# Ask question
r = requests.post(f"{BASE}/api/chat", json={
    "meeting_id": meeting_id,
    "question": "What are the main action items?"
})
print(r.json()['answer'])
```

### cURL
```bash
# Upload
curl -X POST http://localhost:5000/api/analyze \
  -F "file=@meeting.txt"

# Ask question
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"meeting_id":"meeting_abc123","question":"What were the deadlines?"}'
```

### JavaScript/Node.js
```javascript
// Upload
const formData = new FormData();
formData.append('file', fileInput.files[0]);
const response = await fetch('http://localhost:5000/api/analyze', {
  method: 'POST',
  body: formData
});
const data = await response.json();
const meetingId = data.meeting_id;

// Ask question
const answer = await fetch('http://localhost:5000/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    meeting_id: meetingId,
    question: "What are the action items?"
  })
});
```

## 🎯 Q&A Validation

The system validates that questions are meeting-related:

### ✓ Valid Questions
- "What were the main topics discussed?"
- "Who is responsible for the Q1 roadmap?"
- "What are the deadlines mentioned?"
- "What was the overall sentiment?"

### ✗ Invalid Questions (Rejected)
- "What's the weather today?"
- "Tell me a joke"
- "How do I cook pasta?"

## 📊 Response Format

### Success
```json
{
  "status": "success",
  "meeting_id": "meeting_abc123",
  "data": { ... }
}
```

### Error
```json
{
  "status": "error",
  "error": "Descriptive error message"
}
```

## 🧪 Testing

Run the comprehensive test suite:
```bash
python test_apis.py
```

Tests cover:
- Health check
- Upload and analysis
- All GET endpoints
- Q&A with valid questions
- Q&A with off-topic questions
- Error handling

## 📦 Postman Collection

Import `postman_collection.json` into Postman for pre-configured API requests.

## 🏗️ Project Structure

```
meeting-analyzer/
├── app.py                          # Flask application
├── config/
│   ├── settings.py                # Configuration
│   └── __init__.py
├── src/
│   ├── chat_interface.py           # Q&A with validation
│   ├── clients.py                  # API clients
│   ├── meeting_analyzer.py         # Analysis logic
│   ├── transcript_parser.py        # Parsing logic
│   ├── utils.py                    # Utilities
│   ├── vector_store.py             # Qdrant integration
│   └── __init__.py
├── templates/
│   └── index.html                  # Web interface
├── uploads/                        # Uploaded transcripts
├── requirements.txt                # Dependencies
├── .env                            # Environment variables
├── API_DOCUMENTATION.md            # Full API docs
├── DEVELOPER_GUIDE.md              # Developer guide
├── QUICK_REFERENCE.md              # Quick lookup
├── IMPLEMENTATION_SUMMARY.md       # Implementation details
├── test_apis.py                    # Test suite
└── postman_collection.json         # Postman collection
```

## 🔧 Configuration

### Required Environment Variables
```
COHERE_API_KEY=your_cohere_key
QDRANT_URL=your_qdrant_url
QDRANT_API_KEY=your_qdrant_key
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2:1.5b
COLLECTION_NAME=meeting_transcripts
EMBEDDING_MODEL=all-MiniLM-L6-v2
```

### Supported File Formats
- `.txt` - Plain text (recommended)
- `.json` - JSON with `transcript` or `text` field
- `.md` - Markdown

## 🚨 Troubleshooting

| Issue | Solution |
|-------|----------|
| Connection refused | Ensure server is running: `python app.py` |
| Ollama error | Start Ollama: `ollama serve` |
| Qdrant error | Check `.env` credentials |
| Q&A not working | Verify Ollama is running on port 11434 |
| File too large | Max file size is 16MB |

## 📋 API Keys Required

1. **Cohere** - For meeting analysis and urgency detection
   - Get key: https://cohere.com/

2. **Qdrant Cloud** - For semantic search
   - Get key: https://qdrant.tech/

3. **Ollama** - For Q&A (local, no key needed)
   - Install: https://ollama.ai/

## 🎓 Learning Resources

- See `DEVELOPER_GUIDE.md` for code examples
- See `API_DOCUMENTATION.md` for endpoint details
- See `QUICK_REFERENCE.md` for quick lookup
- Run `test_apis.py` to see all features in action

## 🔄 Workflow Example

1. **Upload Meeting**
   ```bash
   curl -X POST http://localhost:5000/api/analyze -F "file=@meeting.txt"
   # Returns: meeting_id
   ```

2. **Get Summary**
   ```bash
   curl http://localhost:5000/api/meetings/{meeting_id}/summary
   ```

3. **Get Action Items**
   ```bash
   curl http://localhost:5000/api/meetings/{meeting_id}/tasks
   ```

4. **Ask Questions**
   ```bash
   curl -X POST http://localhost:5000/api/chat \
     -H "Content-Type: application/json" \
     -d '{"meeting_id":"{meeting_id}","question":"..."}'
   ```

## 🚀 Production Deployment

For production use, consider:
- [ ] Add authentication (API keys)
- [ ] Use database instead of in-memory storage
- [ ] Implement rate limiting
- [ ] Add request logging and monitoring
- [ ] Use HTTPS
- [ ] Deploy with gunicorn/uWSGI
- [ ] Set up error tracking (Sentry)

## 📝 License

MIT License

## 🤝 Support

For issues or questions:
1. Check the documentation files
2. Run `test_apis.py` to verify setup
3. Check server logs for detailed errors
4. Review `DEVELOPER_GUIDE.md` troubleshooting section