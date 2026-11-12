from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import io
import json
import os
import pandas as pd
import numpy as np
from sklearn.metrics import classification_report
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications.efficientnet import preprocess_input
from model_loader import model, predict
from config import CLASS_NAMES

app = FastAPI(title="Skin Disease Detection API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------
# 🔥 Evaluate Model Once
# ---------------------------

METRICS = {}

if os.path.exists("metrics.json"):
    with open("metrics.json", "r") as f:
        METRICS = json.load(f)

    print("\n📊 MODEL VALIDATION SUMMARY")
    print("----------------------------------")
    for key, value in METRICS.items():
        print(f"{key}: {value}")
    print("----------------------------------\n")
else:
    print("⚠ metrics.json not found.")


@app.get("/model-metrics")
def get_model_metrics():
    print("\n🔍 Evaluating model on validation set...\n")
    return METRICS


# ---------------------------
# Health Check
# ---------------------------
@app.get("/")
def health_check():
    return {"status": "active"}

# ---------------------------
# Prediction Endpoint
# ---------------------------
@app.post("/predict")
async def predict_disease(file: UploadFile = File(...)):
    contents = await file.read()
    image = Image.open(io.BytesIO(contents)).convert("RGB")
    result = predict(image)
    return result
