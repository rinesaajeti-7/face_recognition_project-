"""Face++ API Client për Age Progression Tool"""
import requests
import logging

logger = logging.getLogger(__name__)

class FacePPClient:
    def __init__(self):
        self.api_key = "6hZG-tICfLmeTcArc0fO783C1w6a3a-_"
        self.api_secret = "MGx0PP__QWmEIo1rMmt6d_KIdDogWh94"
        self.url = "https://api-us.faceplusplus.com/facepp/v3/detect"

    def get_age_gender(self, image_path: str):
        """Analizon fytyrën dhe kthen moshën dhe gjininë"""
        try:
            with open(image_path, "rb") as f:
                files = {"image_file": f}
                data = {
                    "api_key": self.api_key,
                    "api_secret": self.api_secret,
                    "return_attributes": "gender,age"
                }
                response = requests.post(self.url, data=data, files=files, timeout=30)
                result = response.json()

                if "error_message" in result:
                    return {"success": False, "error": result["error_message"]}

                faces = result.get("faces", [])
                if not faces:
                    return {"success": False, "error": "No face detected"}

                face = faces[0]
                attributes = face.get("attributes", {})
                return {
                    "success": True,
                    "age": attributes.get("age", {}).get("value"),
                    "gender": attributes.get("gender", {}).get("value"),
                    "age_range": attributes.get("age", {}).get("range"),
                    "gender_confidence": attributes.get("gender", {}).get("confidence")
                }
        except Exception as e:
            logger.error(f"Face++ API error: {e}")
            return {"success": False, "error": str(e)}

# Singleton instance
facepp_client = FacePPClient()
