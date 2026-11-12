import tensorflow as tf
import numpy as np
from PIL import Image
from tensorflow.keras.applications.efficientnet import preprocess_input
import os

MODEL_PATH = "best_model.h5"

if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError("Model file not found. Make sure dermanetx.h5 is in backend folder.")

model = tf.keras.models.load_model(MODEL_PATH)

# Adjust if you trained different classes
CLASS_NAMES = ["bcc", "mel", "nv"]

def preprocess_image(image: Image.Image):
    image = image.resize((224, 224))
    img_array = np.array(image)
    img_array = preprocess_input(img_array)
    img_array = np.expand_dims(img_array, axis=0)
    return img_array

def predict(image: Image.Image):
    processed = preprocess_image(image)
    predictions = model.predict(processed, verbose=0)

    class_index = np.argmax(predictions)
    confidence = float(np.max(predictions))

    return {
        "prediction": CLASS_NAMES[class_index],
        "confidence": round(confidence * 100, 2)
    }
