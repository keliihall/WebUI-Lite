import json
import asyncio

async def stream_response(response):
    """Stream response from Ollama"""
    try:
        buffer = ""
        async for line in response.aiter_lines():
            line = line.strip()
            if line:
                try:
                    # Try to parse as JSON first
                    data = json.loads(line)
                    if "response" in data:
                        chunk = data["response"]
                        if chunk:
                            # Ensure we're sending valid JSON for each chunk
                            yield json.dumps({"response": chunk}) + "\n"
                            await asyncio.sleep(0.01)  # Small delay to control flow
                    elif "done" in data and data["done"]:
                        # Handle completion marker
                        if buffer:  # Send any remaining buffered content
                            yield json.dumps({"response": buffer}) + "\n"
                        break
                    elif "error" in data:
                        # Handle error responses
                        yield json.dumps({"error": data["error"]}) + "\n"
                        break
                except json.JSONDecodeError:
                    # If not JSON, wrap the line in a response object
                    buffer += line
                    yield json.dumps({"response": line}) + "\n"
                    await asyncio.sleep(0.01)
    except Exception as e:
        # Handle any streaming errors
        error_msg = str(e)
        print(f"Streaming error: {error_msg}")  # Log the error
        if not response.is_closed:
            yield json.dumps({"error": error_msg}) + "\n"
            
    # Ensure we send a completion marker
    yield json.dumps({"done": True}) + "\n"
