import os
import sys
import time
import wave
import argparse
import traceback
import torch
import whisperx
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Body
from fastapi.responses import JSONResponse
import uvicorn
import shutil
import tempfile
import numpy as np
from typing import Optional
from pydantic import BaseModel

# Workaround: Disable torchcodec backend to avoid _dlopen errors on Windows
os.environ["TORCHAUDIO_USE_BACKEND_DISPATCHER"] = "0"
os.environ["no_proxy"] = "localhost,127.0.0.1"

# Import audio libraries & configure ffmpeg path for pydub
try:
    from pydub import AudioSegment
    HAS_PYDUB = True
    
    # Auto-detect ffmpeg path (conda installs it in Library/bin/)
    ffmpeg_path = shutil.which("ffmpeg")
    ffprobe_path = shutil.which("ffprobe")
    
    if ffmpeg_path:
        AudioSegment.converter = ffmpeg_path
        print(f"✅ pydub available, ffmpeg: {ffmpeg_path}")
    else:
        # Try common conda location
        conda_prefix = os.environ.get("CONDA_PREFIX", "")
        if conda_prefix:
            candidate = os.path.join(conda_prefix, "Library", "bin", "ffmpeg.exe")
            if os.path.exists(candidate):
                AudioSegment.converter = candidate
                print(f"✅ pydub available, ffmpeg (conda): {candidate}")
            else:
                print("⚠️ pydub available but ffmpeg not found - MP3 support may fail")
        else:
            print("⚠️ pydub available but ffmpeg not found - MP3 support may fail")
    
    if ffprobe_path:
        AudioSegment.ffprobe = ffprobe_path
    elif conda_prefix:
        candidate_probe = os.path.join(conda_prefix, "Library", "bin", "ffprobe.exe")
        if os.path.exists(candidate_probe):
            AudioSegment.ffprobe = candidate_probe

except ImportError:
    HAS_PYDUB = False
    print("⚠️ pydub not available")

try:
    import soundfile as sf
    HAS_SOUNDFILE = True
    print("✅ soundfile available")
except ImportError:
    HAS_SOUNDFILE = False

from omegaconf.listconfig import ListConfig
from omegaconf.dictconfig import DictConfig

app = FastAPI(title="WhisperX Medical STT Server")

# Global variables for models
device = "cuda" if torch.cuda.is_available() else "cpu"
batch_size = 16
compute_type = "int8"

model = None
model_a = None
metadata = None
diarize_model = None

def load_models(model_name: str, language_code: str, hf_token: Optional[str] = None):
    global model, model_a, metadata, diarize_model
    print(f"🚀 Loading WhisperX model: {model_name} on {device}...")
    
    if model is None:
        model = whisperx.load_model(model_name, device, compute_type=compute_type)
    
    print(f"📏 Loading Alignment model for language: {language_code}...")
    model_a, metadata = whisperx.load_align_model(language_code=language_code, device=device)
    
    if hf_token:
        print("👥 Loading Diarization model...")
        diarize_model = whisperx.DiarizationPipeline(use_auth_token=hf_token, device=device)
    else:
        print("⚠️ No HF_TOKEN provided. Diarization will be skipped.")


def load_audio_universal(file_path: str, sr: int = 16000) -> np.ndarray:
    """
    Robust audio loader using miniaudio (pure Python/C without external FFmpeg DLL dependencies).
    Bypasses broken conda FFmpeg installations on Windows (0xC0000139 errors).
    """
    file_size = os.path.getsize(file_path)
    print(f"  🔊 Loading audio: {file_path} ({file_size} bytes / {file_size/1024:.1f} KB)")
    
    if file_size == 0:
        raise RuntimeError(f"Audio file is empty (0 bytes): {file_path}")

    try:
        import miniaudio
    except ImportError:
        raise RuntimeError("miniaudio library is missing! Run: conda run -n mea_env pip install miniaudio")

    with open(file_path, 'rb') as f:
        header = f.read(4)
    
    is_wav = header[:4] == b'RIFF'
    is_mp3 = header[:2] == b'\xff\xfb' or header[:2] == b'\xff\xf3' or header[:3] == b'ID3'
    format_name = "WAV" if is_wav else ("MP3" if is_mp3 else "Unknown")
    print(f"  📋 Detected format: {format_name} (header: {header[:4].hex()})")

    print(f"  📖 Running miniaudio decoder...")
    try:
        if is_mp3:
            decoded = miniaudio.mp3_read_file_f32(file_path)
        elif is_wav:
            decoded = miniaudio.wav_read_file_f32(file_path)
        else:
            # Fallback to general read if possible, but miniaudio might not support everything
            # Let's try mp3 and then wav
            try:
                decoded = miniaudio.mp3_read_file_f32(file_path)
            except:
                decoded = miniaudio.wav_read_file_f32(file_path)
    except Exception as e:
        raise RuntimeError(f"miniaudio failed to decode! Error: {e}")

    # Convert to numpy array
    audio = np.array(decoded.samples, dtype=np.float32)
    
    # Miniaudio f32 returns interleaved samples, so we need to reshape if multi-channel
    if decoded.nchannels > 1:
        audio = audio.reshape(-1, decoded.nchannels).mean(axis=1).astype(np.float32)
    
    # Resample if needed
    if decoded.sample_rate != sr:
        duration = len(audio) / decoded.sample_rate
        target_length = int(duration * sr)
        audio = np.interp(
            np.linspace(0, len(audio), target_length),
            np.arange(len(audio)),
            audio
        ).astype(np.float32)

    print(f"  ✅ Audio loaded successfully via miniaudio: {len(audio)/sr:.1f}s, {sr}Hz mono")
    return audio


@app.on_event("startup")
async def startup_event():
    model_name = os.getenv("WHISPER_MODEL", "small")
    language = os.getenv("WHISPER_LANGUAGE", "vi")
    hf_token = os.getenv("HF_TOKEN")
    
    torch.serialization.safe_globals([np.core.multiarray._reconstruct])
    load_models(model_name, language, hf_token)


def run_transcription(audio: np.ndarray, language: str, do_diarize: bool) -> dict:
    """Shared transcription logic for both endpoints"""
    start_time = time.time()
    
    # 1. Transcribe
    result = model.transcribe(audio, batch_size=batch_size, language=language)
    
    # 2. Align
    result = whisperx.align(result["segments"], model_a, metadata, audio, device, return_char_alignments=False)
    
    # 3. Diarize
    if do_diarize and diarize_model:
        diarize_segments = diarize_model(audio)
        result = whisperx.assign_word_speakers(diarize_segments, result)

    process_time = time.time() - start_time
    
    full_text = "".join([s["text"] for s in result["segments"]])
    print(f"✅ Transcription complete in {process_time:.2f}s: \"{full_text[:100]}\"")
    
    return {
        "text": full_text,
        "segments": result["segments"],
        "word_segments": result.get("word_segments", []),
        "meta": {
            "process_time": process_time,
            "device": device,
            "model": os.getenv("WHISPER_MODEL", "small")
        }
    }


# ─── Endpoint 1: Upload file (cho production) ───
@app.post("/inference")
async def inference(
    file: UploadFile = File(...),
    language: str = Form("vi"),
    diarize: bool = Form(True)
):
    if not model:
        raise HTTPException(status_code=503, detail="Model not loaded")

    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav", mode='wb') as tmp:
            tmp_path = tmp.name
            content = await file.read()
            tmp.write(content)
            tmp.flush()
            os.fsync(tmp.fileno())
        
        print(f"📝 [Upload] File: {file.filename}, Size: {os.path.getsize(tmp_path)} bytes")
        audio = load_audio_universal(tmp_path)
        return run_transcription(audio, language, diarize)

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)


# ─── Endpoint 2: Local file path (cho benchmark - KHÔNG cần upload) ───
class LocalInferenceRequest(BaseModel):
    file_path: str
    language: str = "vi"
    diarize: bool = True

@app.post("/inference-local")
async def inference_local(req: LocalInferenceRequest):
    """
    Benchmark endpoint: Server đọc file trực tiếp từ ổ cứng.
    Không cần upload qua HTTP → nhanh hơn, không lỗi encoding.
    """
    if not model:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    if not os.path.exists(req.file_path):
        raise HTTPException(status_code=400, detail=f"File not found: {req.file_path}")

    try:
        print(f"📝 [Local] File: {req.file_path}, Size: {os.path.getsize(req.file_path)} bytes")
        audio = load_audio_universal(req.file_path)
        return run_transcription(audio, req.language, req.diarize)
    except Exception as e:
        print(f"❌ Error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "device": device,
        "model_loaded": model is not None,
        "align_loaded": model_a is not None,
        "diarize_enabled": diarize_model is not None,
        "pydub_available": HAS_PYDUB,
        "soundfile_available": HAS_SOUNDFILE
    }

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=8080)
    parser.add_argument("--host", type=str, default="0.0.0.0")
    args = parser.parse_args()
    
    uvicorn.run(app, host=args.host, port=args.port)
