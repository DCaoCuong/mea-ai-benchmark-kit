import traceback
import asyncio
from pydantic import BaseModel

class LocalInferenceRequest(BaseModel):
    file_path: str
    language: str = "vi"

try:
    import moonshine_server
    req = LocalInferenceRequest(file_path=r'benchmarks\test-data\audio\scenario-003.mp3')
    result = asyncio.run(moonshine_server.inference_local(req))
    print(result['text'][:100], "... (truncated)")
except Exception as e:
    print(e)
    traceback.print_exc()
