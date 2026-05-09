from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from google import genai
import os, tempfile, json

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY", ""))

def extract_text(path):
    try:
        import pdfplumber
        with pdfplumber.open(path) as pdf:
            return "\n".join(p.extract_text() or "" for p in pdf.pages)
    except Exception as e:
        return f"Could not extract text: {str(e)}"

@app.post("/analyze")
async def analyze(file: UploadFile = File(...), job_description: str = Form(...), role: str = Form(...)):
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name
    text = extract_text(tmp_path)
    return await run_analysis(text, job_description, role)

@app.post("/analyze-text")
async def analyze_text(resume_text: str = Form(...), job_description: str = Form(...), role: str = Form(...)):
    return await run_analysis(resume_text, job_description, role)

async def run_analysis(resume, jd, role):
    prompt = f"""You are an expert ATS resume analyzer.
Analyze the resume against the job description.
Return ONLY a valid JSON object. No markdown. No backticks. Just raw JSON.

Required JSON structure:
{{
  "overall_score": 75,
  "ats_score": 70,
  "keyword_match": 65,
  "experience_match": 80,
  "interview_readiness": 72,
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2", "weakness3"],
  "matched_skills": ["skill1", "skill2", "skill3"],
  "missing_skills": ["skill1", "skill2", "skill3"],
  "partial_skills": ["skill1", "skill2"],
  "suggestions": [
    {{"priority": "high", "category": "Keywords", "text": "Add these missing keywords"}},
    {{"priority": "medium", "category": "Format", "text": "Improve formatting"}}
  ],
  "role_matches": [
    {{"role": "Similar Role 1", "match": 85, "reason": "Strong match because..."}},
    {{"role": "Similar Role 2", "match": 70, "reason": "Good match because..."}}
  ],
  "summary": "2-3 sentence overall assessment."
}}

TARGET ROLE: {role}
RESUME: {resume}
JOB DESCRIPTION: {jd}"""

    try:
        response = client.models.generate_content(
            model="gemini-2.0-flash-lite",
            contents=prompt
        )
        text = response.text.strip()
        text = text.replace("```json", "").replace("```", "").strip()
        json.loads(text)
        return {"result": text, "resume_text": resume}
    except Exception as e:
        fallback = {
            "overall_score": 50, "ats_score": 50, "keyword_match": 50,
            "experience_match": 50, "interview_readiness": 50,
            "strengths": ["Could not fully analyze resume"],
            "weaknesses": ["Please try again"],
            "matched_skills": [], "missing_skills": [], "partial_skills": [],
            "suggestions": [{"priority": "high", "category": "General", "text": f"Error: {str(e)}"}],
            "role_matches": [],
            "summary": f"Analysis error: {str(e)}"
        }
        return {"result": json.dumps(fallback), "resume_text": resume}

@app.get("/health")
def health():
    return {"status": "ok"}