from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from transformers import pipeline, AutoImageProcessor
from PIL import Image
import io

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*","http://localhost:5173/"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

print("Loading model... please wait.")

# 1. Manually load the missing image processor from the base Google model
processor = AutoImageProcessor.from_pretrained("google/mobilenet_v2_1.0_224")

# 2. Pass the processor into your pipeline
classifier = pipeline(
    "image-classification", 
    model="linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification",
    image_processor=processor
) 

@app.get("/")
def home():
    return {"status": "Model is ready. Post images to /predict"}

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    image_data = await file.read()
    image = Image.open(io.BytesIO(image_data))
    
    results = classifier(image)
    return {"analysis": results}