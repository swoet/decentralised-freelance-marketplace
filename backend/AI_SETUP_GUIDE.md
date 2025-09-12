# AI Configuration Guide

## 🤖 AI Features Overview

Your marketplace includes advanced AI-powered features that enhance matching and content generation:

### 1. Smart Matching System (Always Active)
- **Personality Analysis**: Analyzes user communication patterns from bids, messages, and profiles
- **Semantic Matching**: Uses sentence transformers to understand project requirements and freelancer skills
- **Compatibility Scoring**: Multi-dimensional scoring including personality, skills, work style, and communication
- **Success Prediction**: Predicts project success rates and client satisfaction scores

### 2. Content Generation (Requires OpenAI API Key)
- **Proposal Generation**: AI-generated proposals for freelancers based on project requirements
- **Project Enhancement**: Improve project descriptions for better clarity and attraction
- **Contract Clauses**: Generate standard contract terms tailored to project types
- **Title Suggestions**: Create compelling project titles
- **Bid Improvements**: Help freelancers improve their proposal responses

## ⚙️ Configuration

### Environment Variables (.env file)
```bash
# AI Configuration
AI_MATCHING_ENABLED=true
OPENAI_API_KEY=sk-your-openai-api-key-here
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
MATCHING_CACHE_TTL=3600
```

### Model Options

#### Sentence Transformer Models (for semantic matching):
- `sentence-transformers/all-MiniLM-L6-v2` (default, fast and efficient)
- `sentence-transformers/all-mpnet-base-v2` (higher quality, slower)
- `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2` (multilingual)

#### OpenAI Models (for content generation):
- `gpt-3.5-turbo` (default, cost-effective)
- `gpt-4` (higher quality, more expensive)
- `gpt-4-turbo` (balance of quality and speed)

## 🚀 API Endpoints

### Smart Matching
```http
GET /api/v1/ai-matching/project/{project_id}/matches
GET /api/v1/ai-matching/freelancer/{freelancer_id}/projects
```

### Content Generation
```http
POST /api/v1/ai-content/proposal/generate
POST /api/v1/ai-content/project/enhance
POST /api/v1/ai-content/contract/clauses
POST /api/v1/ai-content/titles/suggest
```

### Admin AI Endpoints
```http
GET /api/v1/dashboard/admin/ai-status
POST /api/v1/dashboard/admin/ai/refresh-all
```

## 🛠️ Setup Instructions

### 1. Install Dependencies (already done):
```bash
pip install sentence-transformers scikit-learn numpy openai
```

### 2. Get OpenAI API Key:
- Visit https://platform.openai.com/api-keys
- Create new API key
- Update OPENAI_API_KEY in .env file

### 3. Test AI Features:
```bash
# Start your backend server
python -m uvicorn app.main:app --reload --port 8001

# Test smart matching
curl http://localhost:8001/api/v1/dashboard/admin/ai-status
```

## 🎯 Usage Examples

### Frontend Integration Example:
```javascript
// Get AI-powered matches for a project
const matches = await fetch('/api/v1/ai-matching/project/123/matches', {
  headers: { 'Authorization': `Bearer ${token}` }
});

// Generate AI proposal
const proposal = await fetch('/api/v1/ai-content/proposal/generate', {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json' 
  },
  body: JSON.stringify({
    project_id: '123',
    additional_context: 'Focus on mobile responsiveness'
  })
});
```

## 🔧 Performance Tuning

### Embedding Cache Settings:
- `MATCHING_CACHE_TTL=3600` - Cache matching results for 1 hour
- Increase for better performance, decrease for more real-time matching

### Model Selection:
- Use smaller models (`all-MiniLM-L6-v2`) for faster responses
- Use larger models (`all-mpnet-base-v2`) for better accuracy

## 🔍 Monitoring

### Available Metrics:
- Personality profiles analyzed
- Compatibility scores calculated
- Content generation requests
- Model performance stats

### Admin Dashboard:
Access AI system status at `/api/v1/dashboard/admin/ai-status`

## ⚡ Performance Notes

### Smart Matching:
- First-time analysis may take 2-3 seconds per user
- Results are cached for improved performance
- Embeddings are generated asynchronously

### Content Generation:
- Requires active OpenAI API key
- Fallback templates provided when API is unavailable
- Rate limits apply based on your OpenAI plan

## 🚨 Troubleshooting

### Common Issues:

1. **"Embedding model not available"**
   - Ensure sentence-transformers is installed
   - Check EMBEDDING_MODEL name in .env

2. **"OpenAI API error"**
   - Verify OPENAI_API_KEY is correct
   - Check your OpenAI account usage limits

3. **Slow matching performance**
   - Increase MATCHING_CACHE_TTL
   - Consider using a smaller embedding model

### Debug Mode:
Set logging level to DEBUG to see detailed AI operation logs.
