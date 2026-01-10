"""
Sample meeting transcript for testing
"""

RAW_TRANSCRIPT = """
Dev: Alright, let's get started. Hackathon is in three weeks, so we need a clear plan today.
Farhaan: Agreed. First question is what problem statement we're locking in.
Aaleya: I still think the AI meeting summarizer is strong, especially with task extraction.
Yash: It's strong, but a lot of teams will probably do something similar.
Dev: True, but our edge is urgency detection and action ownership.
Farhaan: Plus end-to-end pipeline, not just a demo.
Aaleya: We need to be careful with scope though. Hackathons punish overengineering.
Yash: Backend-wise, I can handle ingestion and API scaffolding quickly.
Dev: What about frontend?
Aaleya: I can do a clean UI, but I'll need finalized data contracts early.
Farhaan: That means Dev and I should freeze the output schema by this weekend.
Dev: Yes, otherwise integration will be painful.
Yash: What's the biggest risk right now?
Farhaan: Honestly, model latency. If summaries take too long, judges will notice.
Aaleya: Can we fake real-time with partial updates?
Dev: Possibly. Even showing progress would help.
Yash: Another risk is dataset quality. Do we have enough test transcripts?
Dev: Not yet. We should generate synthetic ones.
Farhaan: I can handle transcript generation and evaluation metrics.
Aaleya: Also, we should clearly highlight urgency-based tasks in the UI.
Dev: That's actually our differentiator. Judges like clarity.
Yash: What's the tech stack final call?
Dev: Python backend, FastAPI, Cohere or open-source fallback.
Farhaan: We should keep an offline fallback in case APIs fail.
Aaleya: Timeline check: backend MVP by day five?
Yash: That's tight but doable if scope doesn't change.
Dev: Then frontend integration day six and seven.
Farhaan: Final two days for polish and pitch.
Aaleya: Speaking of pitch, who's presenting?
Dev: I can lead, but Farhaan should cover the technical depth.
Farhaan: Sure, but we need a strong story, not just architecture.
Yash: Story should be about reducing meeting fatigue and missed action items.
Aaleya: Exactly. Less talk, more outcomes.
Dev: Okay, action items are clear. Let's sync daily until the hackathon.
"""