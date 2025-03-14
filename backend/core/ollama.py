import httpx
from fastapi import HTTPException
from ..config import config_manager

async def get_models():
    """Get available models from Ollama service"""
    try:
        config = config_manager.config
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{config.ollama.host}/api/tags")
            if response.status_code == 200:
                models = response.json()
                return {"models": [model["name"] for model in models["models"]]}
            else:
                raise HTTPException(status_code=502, detail=f"Failed to get models from Ollama service: {response.text}")
    except Exception as e:
        print(f"Error connecting to Ollama service: {str(e)}")
        return {"models": []}  # 返回空列表而不是默认配置

async def generate_response(model: str, prompt: str) -> httpx.Response:
    """Generate response from Ollama"""
    try:
        config = config_manager.config
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{config.ollama.host}/api/generate",
                json={
                    "model": model,
                    "prompt": prompt,
                    "stream": True,
                    "options": {
                        "temperature": 0.7,
                        "top_p": 0.9,
                        "top_k": 40,
                        "num_predict": 4096
                    }
                },
                timeout=60.0
            )
            
            if response.status_code != 200:
                error_msg = f"Failed to generate response: {response.text}"
                raise HTTPException(status_code=502, detail=error_msg)
                
            return response
            
    except httpx.HTTPError as e:
        error_msg = f"Failed to connect to Ollama service: {str(e)}"
        raise HTTPException(status_code=502, detail=error_msg)
    except Exception as e:
        error_msg = f"Error generating response: {str(e)}"
        raise HTTPException(status_code=500, detail=error_msg)
