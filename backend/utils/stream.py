import json
import asyncio
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def stream_response(response):
    """Stream response from Ollama"""
    try:
        buffer = ""
        async for line in response.aiter_lines():
            line = line.strip()
            if line:
                logger.debug(f"Received line from Ollama: {line[:100]}...")  # Log first 100 chars
                try:
                    # Try to parse as JSON first
                    data = json.loads(line)
                    if "response" in data:
                        chunk = data["response"]
                        if chunk:
                            logger.debug(f"Sending chunk: {chunk[:100]}...")  # Log first 100 chars
                            # Ensure we're sending valid JSON for each chunk
                            yield json.dumps({"response": chunk}) + "\n"
                            await asyncio.sleep(0.01)  # Small delay to control flow
                    elif "done" in data and data["done"]:
                        # Handle completion marker
                        if buffer:  # Send any remaining buffered content
                            logger.debug(f"Sending final buffer: {buffer[:100]}...")  # Log first 100 chars
                            yield json.dumps({"response": buffer}) + "\n"
                        logger.debug("Sending done marker")
                        break
                    elif "error" in data:
                        # Handle error responses
                        logger.error(f"Error from Ollama: {data['error']}")
                        yield json.dumps({"error": data["error"]}) + "\n"
                        break
                except json.JSONDecodeError:
                    # If not JSON, wrap the line in a response object
                    logger.debug(f"Non-JSON line received: {line[:100]}...")  # Log first 100 chars
                    buffer += line
                    yield json.dumps({"response": line}) + "\n"
                    await asyncio.sleep(0.01)
    except Exception as e:
        # Handle any streaming errors
        error_msg = str(e)
        logger.error(f"Streaming error: {error_msg}")
        if not response.is_closed:
            yield json.dumps({"error": error_msg}) + "\n"
            
    # Ensure we send a completion marker
    logger.debug("Stream completed, sending final done marker")
    yield json.dumps({"done": True}) + "\n"
