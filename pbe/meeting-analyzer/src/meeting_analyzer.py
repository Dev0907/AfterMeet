import json
from datetime import datetime

class MeetingAnalyzer:
    """Analyze meetings and extract insights"""
    
    def __init__(self, cohere_client):
        self.cohere_client = cohere_client
    
    def summarize_with_urgency(self, transcript_text):
        """
        Use Cohere LLM to extract structured meeting insights
        """
        system_prompt = """You are an enterprise AI meeting assistant.
        Extract structured information from meeting transcripts in valid JSON format.

        Focus on:
        - Executive summary (2-3 sentences)
        - Action items with task, owner, deadline (ISO format if mentioned), urgency_reason, and tags
        - Topics discussed
        - Named entities (people, systems, tools)
        - Overall meeting sentiment

        For urgency_reason, provide detailed context about:
        - Why the task is important
        - Any mentioned deadlines or time pressures
        - Dependencies or blockers
        - Impact on the project

        For tags, assign relevant categories like: development, documentation, testing, review, planning, communication, etc.
        """

        user_prompt = f"""Analyze this meeting transcript and return ONLY valid JSON:

Transcript:
{transcript_text}

Required JSON structure:
{{
  "executive_summary": "brief overview",
  "action_items": [
    {{
      "task": "description",
      "owner": "person name",
      "deadline": "YYYY-MM-DD or null",
      "urgency_reason": "detailed explanation of task importance, context, and time sensitivity",
      "tags": ["tag1", "tag2"]
    }}
  ],
  "topics_discussed": ["topic1", "topic2"],
  "named_entities": ["entity1", "entity2"],
  "overall_sentiment": "positive/neutral/negative"
}}

Return ONLY the JSON object, no markdown formatting."""

        response = self.cohere_client.chat(
            model="command-r-v2",
            preamble=system_prompt,
            message=user_prompt,
            temperature=0.2,
            max_tokens=1500
        )

        return response.text
    
    def compute_urgency_with_llm(self, task):
        """
        Use LLM to determine urgency level based on task context

        Returns: critical, high, medium, or low
        """
        system_prompt = """You are an expert project manager analyzing task urgency.
        Evaluate the urgency level based on:
        - Deadline proximity
        - Impact on project/team
        - Dependencies and blockers
        - Language indicators (ASAP, critical, etc.)
        - Business context

        Respond with ONLY ONE WORD: critical, high, medium, or low"""

        task_description = f"""
Task: {task.get('task', 'N/A')}
Owner: {task.get('owner', 'N/A')}
Deadline: {task.get('deadline', 'N/A')}
Context: {task.get('urgency_reason', 'N/A')}
"""

        try:
            response = self.cohere_client.chat(
                model="command-r-v2",
                preamble=system_prompt,
                message=f"Determine urgency level for this task:\n{task_description}",
                temperature=0.2,
                max_tokens=10
            )

            urgency = response.text.strip().lower()

            # Ensure valid urgency level
            if urgency not in ['critical', 'high', 'medium', 'low']:
                urgency = 'medium'

            return urgency
        except Exception as e:
            print(f"Warning: Urgency detection failed. Using default 'medium'. Error: {e}")
            return 'medium'
    
    def compute_speaker_sentiment(self, sentiment_score):
        """
        Convert sentiment score to label: Positive, Negative, or Neutral
        
        Returns: "Positive", "Negative", or "Neutral"
        """
        if sentiment_score > 0.3:
            return "Positive"
        elif sentiment_score < -0.3:
            return "Negative"
        else:
            return "Neutral"
    
    def analyze_meeting(self, transcript):
        """
        Complete meeting analysis pipeline
        """
        print("\n" + "="*60)
        print("ANALYZING MEETING TRANSCRIPT")
        print("="*60)
        
        # Format transcript for LLM
        transcript_text = "\n".join(
            f"[{t['timestamp']}] {t['speaker_name']}: {t['text']}"
            for t in transcript
        )
        
        # Generate summary
        llm_raw = self.summarize_with_urgency(transcript_text)
        
        # Clean potential markdown formatting
        if llm_raw.strip().startswith('```json'):
            llm_raw = llm_raw.strip()[len('```json'):-len('```')].strip()
        elif llm_raw.strip().startswith('```'):
            llm_raw = llm_raw.strip()[3:-3].strip()

        # Parse JSON
        try:
            llm_output = json.loads(llm_raw)
            print("✓ Meeting summary generated successfully")
        except json.JSONDecodeError as e:
            print(f"⚠ JSON parsing error: {e}")
            print("Raw output:", llm_raw[:500])
            llm_output = {
                "executive_summary": "Error parsing summary",
                "action_items": [],
                "topics_discussed": [],
                "named_entities": [],
                "overall_sentiment": "neutral"
            }

        # Apply LLM-based urgency computation to each action item
        print("\nComputing urgency levels with LLM...")
        for i, task in enumerate(llm_output.get("action_items", []), 1):
            print(f"  Analyzing urgency for task {i}/{len(llm_output.get('action_items', []))}...")
            task["urgency"] = self.compute_urgency_with_llm(task)
            # Ensure tags exist
            if "tags" not in task:
                task["tags"] = []

        print("\n✓ Urgency analysis complete")
        
        return llm_output
