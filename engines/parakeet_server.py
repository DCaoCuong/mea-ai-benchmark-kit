import os
import time
import torch
import nemo.collections.asr as nemo_asr
from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel
import uvicorn
import shutil
import tempfile

app = FastAPI(title="Parakeet-CTC Vietnamese STT")

class LocalInferenceRequest(BaseModel):
    file_path: str
    language: str = "vi"

# Load model (0.6B params ~1.2GB VRAM)
print("🚀 Loading Parakeet-CTC 0.6B Vietnamese...")
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "models")
model_path = os.path.join(MODEL_DIR, "parakeet-ctc-0.6b-vi.nemo")
extract_dir = os.path.join(MODEL_DIR, "parakeet_extracted")

if not os.path.exists(model_path):
    print(f"📥 Downloading {model_path} from HuggingFace (only once)...")
    # Note: relative to CWD if using os.system, better to use absolute paths
    os.system(f"huggingface-cli download nvidia/parakeet-ctc-0.6b-vietnamese \"{model_path}\" --local-dir .")

try:
    model = nemo_asr.models.ASRModel.restore_from(model_path)
except Exception as e:
    # On Windows, NeMo sometimes tries to extract into a temp dir and fails. 
    # Workaround: manually extract it, then load config & state dict
    print(f"⚠️ Internal NeMo extraction failed ({e}). Using robust local extraction...")
    import tarfile
    from omegaconf import OmegaConf
    os.makedirs(extract_dir, exist_ok=True)
    with tarfile.open(model_path, 'r') as tar:
        tar.extractall(path=extract_dir)

    # Load manually
    config_yaml = os.path.join(extract_dir, "model_config.yaml")
    conf = OmegaConf.load(config_yaml)
    
    # Check if target class exists
    target = conf.target
    imported_class = nemo_asr.models.ASRModel._save_restore_connector._import_class_by_path(target)
    
    model = imported_class(cfg=conf)
    model.load_state_dict(torch.load(os.path.join(extract_dir, "model_weights.ckpt"), map_location='cpu'))

device = "cuda" if torch.cuda.is_available() else "cpu"
model.to(device)
model.eval()

def ensure_wav(file_path: str) -> str:
    """Uses miniaudio to convert any audio (e.g. mp3) to a temporary 16kHz mono WAV file"""
    import miniaudio
    import wave
    import numpy as np
    
    with open(file_path, 'rb') as f:
        header = f.read(4)
    if header[:4] == b'RIFF':
        return file_path # Already WAV
    
    # Needs conversion (MP3)
    decoded = miniaudio.mp3_read_file_f32(file_path)
    audio = np.array(decoded.samples, dtype=np.float32)
    if decoded.nchannels > 1:
        audio = audio.reshape(-1, decoded.nchannels).mean(axis=1).astype(np.float32)
    
    sr = decoded.sample_rate
    if sr != 16000:
        target_length = int((len(audio) / sr) * 16000)
        audio = np.interp(np.linspace(0, len(audio), target_length), np.arange(len(audio)), audio).astype(np.float32)
        sr = 16000

    audio_int16 = (audio * 32767.0).astype(np.int16)
    tmp_wav = tempfile.mktemp(suffix=".wav")
    with wave.open(tmp_wav, 'wb') as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        wf.writeframes(audio_int16.tobytes())
    return tmp_wav

@app.post("/inference-local")
async def inference_local(req: LocalInferenceRequest):
    if not os.path.exists(req.file_path):
        raise HTTPException(status_code=400, detail=f"File not found: {req.file_path}")

    tmp_path = None
    try:
        start_time = time.time()
        
        # Ensure it's a WAV file for Parakeet
        wav_path = ensure_wav(req.file_path)
        if wav_path != req.file_path:
            tmp_path = wav_path

        # Parakeet transcription
        with torch.no_grad():
            transcription = model.transcribe([wav_path], batch_size=1)
            text = transcription[0] if isinstance(transcription, list) else transcription
            if isinstance(text, list):
                text = " ".join(text)
        
        process_time = time.time() - start_time
        
        return {
            "text": text,
            "meta": {
                "process_time": process_time,
                "engine": "parakeet",
                "model": "ctc-0.6b-vi"
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)

@app.post("/transcribe")
async def transcribe(file: UploadFile = File(...)):
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name

    try:
        start_time = time.time()
        
        # Parakeet transcription
        with torch.no_grad():
            transcription = model.transcribe([tmp_path], batch_size=1)
            text = transcription[0] if isinstance(transcription, list) else transcription
            if isinstance(text, list):
                text = " ".join(text)
        
        process_time = time.time() - start_time
        
        return {
            "text": text,
            "meta": {
                "process_time": process_time,
                "engine": "parakeet",
                "model": "ctc-0.6b-vi"
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

@app.get("/health")
async def health():
    return {"status": "ok", "engine": "parakeet"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8082)
