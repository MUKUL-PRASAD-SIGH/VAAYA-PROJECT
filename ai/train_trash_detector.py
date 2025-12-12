"""
Train a simple CNN for Trash vs Clean environment classification.
Dataset: any TrashNet-like dataset or your custom images.
Outputs: ai/models/trash_detector.tflite
"""

import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
import os

# Paths
DATA_DIR = "datasets/trashnet_binary"  # structure: trash/, clean/
MODEL_DIR = "ai/models"
os.makedirs(MODEL_DIR, exist_ok=True)

# Image parameters
IMG_SIZE = (224, 224)
BATCH_SIZE = 16

# Data augmentation
datagen = ImageDataGenerator(
    rescale=1./255,
    validation_split=0.2,
    rotation_range=10,
    width_shift_range=0.1,
    height_shift_range=0.1,
    zoom_range=0.1,
    horizontal_flip=True
)

train_gen = datagen.flow_from_directory(
    DATA_DIR,
    target_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    class_mode='binary',
    subset='training'
)

val_gen = datagen.flow_from_directory(
    DATA_DIR,
    target_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    class_mode='binary',
    subset='validation'
)

# Model — simple MobileNetV2 transfer learning
base_model = tf.keras.applications.MobileNetV2(
    input_shape=(224, 224, 3),
    include_top=False,
    weights='imagenet'
)
base_model.trainable = False  # freeze base

model = tf.keras.Sequential([
    base_model,
    tf.keras.layers.GlobalAveragePooling2D(),
    tf.keras.layers.Dense(128, activation='relu'),
    tf.keras.layers.Dropout(0.3),
    tf.keras.layers.Dense(1, activation='sigmoid')
])

model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])

print("✅ Training started...")
history = model.fit(train_gen, validation_data=val_gen, epochs=10)
print("✅ Training completed.")

# Save normal model
model.save(os.path.join(MODEL_DIR, "trash_detector.h5"))
print("💾 Saved: trash_detector.h5")

# Convert to TensorFlow Lite
converter = tf.lite.TFLiteConverter.from_keras_model(model)
tflite_model = converter.convert()
tflite_path = os.path.join(MODEL_DIR, "trash_detector.tflite")
with open(tflite_path, "wb") as f:
    f.write(tflite_model)
print(f"✨ Exported TensorFlow Lite model → {tflite_path}")
