import os
import time
import torch
import moonshine
from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel
import uvicorn
import shutil
import tempfile
import numpy as np

app = FastAPI(title="Moonshine STT Server")

class LocalInferenceRequest(BaseModel):
    file_path: str
    language: str = "vi"

# Load model (Moonshine is tiny and fast)
print("🚀 Loading Moonshine model (tiny)...")
model = moonshine.load_model('moonshine/tiny')

def get_audio_array(file_path: str) -> np.ndarray:
    """Uses miniaudio to load and resample any audio to 16kHz float32 array"""
    import miniaudio
    import wave
    
    with open(file_path, 'rb') as f:
        header = f.read(4)
    
    is_wav = header[:4] == b'RIFF'
    is_mp3 = header[:2] == b'\xff\xfb' or header[:2] == b'\xff\xf3' or header[:3] == b'ID3'
    
    if is_mp3:
        decoded = miniaudio.mp3_read_file_f32(file_path)
    elif is_wav:
        decoded = miniaudio.wav_read_file_f32(file_path)
    else:
        try:
            decoded = miniaudio.mp3_read_file_f32(file_path)
        except:
            decoded = miniaudio.wav_read_file_f32(file_path)

    audio = np.array(decoded.samples, dtype=np.float32)
    if decoded.nchannels > 1:
        audio = audio.reshape(-1, decoded.nchannels).mean(axis=1).astype(np.float32)
    
    sr = decoded.sample_rate
    if sr != 16000:
        target_length = int((len(audio) / sr) * 16000)
        audio = np.interp(np.linspace(0, len(audio), target_length), np.arange(len(audio)), audio).astype(np.float32)

    return audio

def transcribe_audio_chunked(audio_array: np.ndarray, model) -> str:
    """Chunks audio array into 30 second segments to bypass the 64s moonshine limit"""
    sr = 16000
    chunk_samples = 30 * sr
    
    texts = []
    for i in range(0, len(audio_array), chunk_samples):
        chunk = audio_array[i:i + chunk_samples]
        chunk = np.expand_dims(chunk, axis=0) # [batch, samples]
        tokens = moonshine.transcribe(chunk, model)
        text = tokens[0] if isinstance(tokens, list) else tokens
        if text.strip():
            texts.append(text.strip())
            
    return " ".join(texts)

@app.post("/inference-local")
async def inference_local(req: LocalInferenceRequest):
    if not os.path.exists(req.file_path):
        raise HTTPException(status_code=400, detail=f"File not found: {req.file_path}")

    try:
        start_time = time.time()
        
        audio_array = get_audio_array(req.file_path)
        text = transcribe_audio_chunked(audio_array, model)
        
        process_time = time.time() - start_time
        
        return {
            "text": text,
            "meta": {
                "process_time": process_time,
                "engine": "moonshine",
                "model": "tiny"
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/transcribe")
async def transcribe(file: UploadFile = File(...)):
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name

    try:
        start_time = time.time()
        
        audio_array = get_audio_array(tmp_path)
        text = transcribe_audio_chunked(audio_array, model)
        
        process_time = time.time() - start_time
        
        return {
            "text": text,
            "meta": {
                "process_time": process_time,
                "engine": "moonshine",
                "model": "tiny"
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

@app.get("/health")
async def health():
    return {"status": "ok", "engine": "moonshine"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8081)
