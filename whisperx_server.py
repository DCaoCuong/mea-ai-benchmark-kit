import os
import time
import argparse
import torch
import whisperx
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
import uvicorn
import shutil
import tempfile
from typing import Optional

app = FastAPI(title="WhisperX Medical STT Server")

# Global variables for models
device = "cuda" if torch.cuda.is_available() else "cpu"
batch_size = 16 # reduce if low on VRAM
compute_type = "int8" # change to "float16" if on GPU and have enough VRAM

model = None
model_a = None
metadata = None
diarize_model = None

def load_models(model_name: str, language_code: str, hf_token: Optional[str] = None):
    global model, model_a, metadata, diarize_model
    print(f"🚀 Loading WhisperX model: {model_name} on {device}...")
    
    # 1. Transcribe with original whisper (batched)
    model = whisperx.load_model(model_name, device, compute_type=compute_type)
    
    # 2. Align whisper output
    print(f"📏 Loading Alignment model for language: {language_code}...")
    model_a, metadata = whisperx.load_align_model(language_code=language_code, device=device)
    
    # 3. Diarization
    if hf_token:
        print("👥 Loading Diarization model...")
        diarize_model = whisperx.DiarizationPipeline(use_auth_token=hf_token, device=device)
    else:
        print("⚠️ No HF_TOKEN provided. Diarization will be skipped.")

@app.on_event("startup")
async def startup_event():
    # Load defaults from env
    model_name = os.getenv("WHISPER_MODEL", "small")
    language = os.getenv("WHISPER_LANGUAGE", "vi")
    hf_token = os.getenv("HF_TOKEN")
    
    load_models(model_name, language, hf_token)

@app.post("/inference")
async def inference(
    file: UploadFile = File(...),
    language: str = Form("vi"),
    diarize: bool = Form(True)
):
    if not model:
        raise HTTPException(status_code=503, detail="Model not loaded")

    # Save uploaded file to temp
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name

    try:
        start_time = time.time()
        
        # 1. Transcribe
        audio = whisperx.load_audio(tmp_path)
        result = model.transcribe(audio, batch_size=batch_size, language=language)
        
        # 2. Align
        result = whisperx.align(result["segments"], model_a, metadata, audio, device, return_char_alignments=False)
        
        # 3. Diarize
        if diarize and diarize_model:
            diarize_segments = diarize_model(audio)
            result = whisperx.assign_word_speakers(diarize_segments, result)

        process_time = time.time() - start_time
        
        return {
            "text": "".join([s["text"] for s in result["segments"]]),
            "segments": result["segments"],
            "word_segments": result.get("word_segments", []),
            "meta": {
                "process_time": process_time,
                "device": device,
                "model": os.getenv("WHISPER_MODEL", "small")
            }
        }

    except Exception as e:
        print(f"❌ Error during inference: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "device": device,
        "model_loaded": model is not None,
        "align_loaded": model_a is not None,
        "diarize_enabled": diarize_model is not None
    }

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=8080)
    parser.add_argument("--host", type=str, default="0.0.0.0")
    args = parser.parse_args()
    
    uvicorn.run(app, host=args.host, port=args.port)
