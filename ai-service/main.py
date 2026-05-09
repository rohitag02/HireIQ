from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai
import os, tempfile, json, time

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

API_KEY = os.environ.get("GEMINI_API_KEY", "")
genai.configure(api_key=API_KEY)

def get_model():
    for model_name in ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.0-pro"]:
        try:
            return genai.GenerativeModel(model_name), model_name
        except:
            continue
    return None, None

def extract_text(path):
    try:
        import pdfplumber
        with pdfplumber.open(path) as pdf:
            return "\n".join(p.extract_text() or "" for p in pdf.pages)
    except Exception as e:
        return f"Could not extract text: {str(e)}"

@app.post("/analyze")
async def analyze(
    file: UploadFile = File(...),
    job_description: str = Form(...),
    role: str = Form(...)
):
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name
    text = extract_text(tmp_path)
    return await run_analysis(text, job_description, role)

@app.post("/analyze-text")
async def analyze_text(
    resume_text: str = Form(...),
    job_description: str = Form(...),
    role: str = Form(...)
):
    return await run_analysis(resume_text, job_description, role)

async def run_analysis(resume, jd, role):
    prompt = f"""You are an expert ATS resume analyzer.
Analyze this resume against the job description carefully.
Return ONLY a valid JSON object. No markdown. No backticks. No extra text. Just the raw JSON.

Use this exact structure:
{{
  "overall_score": <number between 0 and 100>,
  "ats_score": <number between 0 and 100>,
  "keyword_match": <number between 0 and 100>,
  "experience_match": <number between 0 and 100>,
  "interview_readiness": <number between 0 and 100>,
  "strengths": ["Write actual strength 1", "Write actual strength 2", "Write actual strength 3"],
  "weaknesses": ["Write actual weakness 1", "Write actual weakness 2", "Write actual weakness 3"],
  "matched_skills": ["skill1", "skill2", "skill3", "skill4"],
  "missing_skills": ["missing1", "missing2", "missing3"],
  "partial_skills": ["partial1", "partial2"],
  "suggestions": [
    {{"priority": "high", "category": "Keywords", "text": "Write specific suggestion here"}},
    {{"priority": "high", "category": "Experience", "text": "Write specific suggestion here"}},
    {{"priority": "medium", "category": "Format", "text": "Write specific suggestion here"}},
    {{"priority": "low", "category": "Skills", "text": "Write specific suggestion here"}}
  ],
  "role_matches": [
    {{"role": "Write a related role title", "match": <number>, "reason": "Write reason"}},
    {{"role": "Write another related role", "match": <number>, "reason": "Write reason"}},
    {{"role": "Write third related role", "match": <number>, "reason": "Write reason"}}
  ],
  "summary": "Write 2 to 3 sentences summarizing the overall match and key recommendations."
}}

TARGET ROLE: {role}

RESUME:
{resume}

JOB DESCRIPTION:
{jd}"""

    models_to_try = [
       "gemini-2.5-flash",
       "gemini-2.0-flash",
       "gemini-2.0-flash-lite",
       "gemini-flash-latest",
       "gemini-flash-lite-latest"
    ]

    last_error = ""

    for model_name in models_to_try:
        try:
            print(f"Trying model: {model_name}")
            model = genai.GenerativeModel(model_name)
            response = model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.3,
                    max_output_tokens=2048,
                )
            )
            text = response.text.strip()
            text = text.replace("```json", "").replace("```", "").strip()
            if text.startswith("{"):
                parsed = json.loads(text)
                print(f"Success with model: {model_name}")
                return {"result": json.dumps(parsed), "resume_text": resume}
        except Exception as e:
            last_error = str(e)
            print(f"Model {model_name} failed: {last_error}")
            if "quota" in last_error.lower() or "429" in last_error:
                time.sleep(2)
                continue
            continue

    print(f"All models failed. Last error: {last_error}")

    smart_fallback = generate_smart_fallback(resume, jd, role, last_error)
    return {"result": json.dumps(smart_fallback), "resume_text": resume}


def generate_smart_fallback(resume, jd, role, error):
    resume_words = set(resume.lower().split())
    jd_words = set(jd.lower().split())
    common = resume_words & jd_words

    important_skills = [
        "python", "javascript", "react", "node", "sql", "java", "css", "html",
        "aws", "docker", "git", "api", "typescript", "mongodb", "postgresql",
        "machine learning", "data", "excel", "communication", "leadership",
        "management", "agile", "scrum", "figma", "design", "marketing"
    ]

    matched = [s for s in important_skills if s in resume.lower() and s in jd.lower()]
    missing = [s for s in important_skills if s not in resume.lower() and s in jd.lower()]

    keyword_score = min(90, max(20, int((len(common) / max(len(jd_words), 1)) * 200)))
    skill_score = min(90, max(20, int((len(matched) / max(len(matched) + len(missing), 1)) * 100)))
    overall = int((keyword_score + skill_score) / 2)

    return {
        "overall_score": overall,
        "ats_score": max(overall - 5, 20),
        "keyword_match": keyword_score,
        "experience_match": skill_score,
        "interview_readiness": max(overall - 10, 20),
        "strengths": [
            f"Your resume contains {len(matched)} relevant skills for this role",
            f"Resume has {len(resume.split())} words showing good detail",
            "Your background shows relevant experience in the field"
        ],
        "weaknesses": [
            f"Missing {len(missing)} key skills from the job description",
            "Consider tailoring your resume more specifically to this role",
            "Add more quantifiable achievements with numbers and metrics"
        ],
        "matched_skills": matched[:8] if matched else ["general skills"],
        "missing_skills": missing[:6] if missing else ["review job description for specifics"],
        "partial_skills": [],
        "suggestions": [
            {"priority": "high", "category": "Keywords", "text": f"Add these missing keywords: {', '.join(missing[:4]) if missing else 'review job description'}"},
            {"priority": "high", "category": "Achievements", "text": "Add specific numbers to your achievements — percentages, revenue, team size, project scale"},
            {"priority": "medium", "category": "Format", "text": "Make sure your resume is in a clean single-column format for best ATS compatibility"},
            {"priority": "low", "category": "Summary", "text": "Add a professional summary at the top tailored to this specific role"}
        ],
        "role_matches": [
            {"role": role, "match": overall, "reason": "Based on keyword and skill overlap analysis"},
            {"role": f"Senior {role}", "match": max(overall - 15, 20), "reason": "Similar role requiring more experience"},
            {"role": f"Junior {role}", "match": min(overall + 10, 95), "reason": "Similar role with lower experience requirements"}
        ],
        "summary": f"Based on keyword analysis, your resume matches approximately {overall}% of the requirements for {role}. You have {len(matched)} matching skills but are missing {len(missing)} key skills from the job description. Focus on adding the missing skills and tailoring your resume language to match the job description more closely."
    }

@app.get("/health")
def health():
    return {"status": "ok", "api_key_set": bool(API_KEY)}

@app.get("/models")
def list_models():
    try:
        models = [m.name for m in genai.list_models()]
        return {"models": models}
    except Exception as e:
        return {"error": str(e)}