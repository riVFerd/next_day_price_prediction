import json
import pytz
from datetime import datetime, timedelta
import wandb

import requests
from flask import Flask, render_template, jsonify, request
from keras.layers import BatchNormalization
from tensorflow.python.keras.models import load_model

from src.stock_list.stock_list import get_stock_list
from src.stock_predict_utils import focal_loss, predict_stock_trend

model = None
app = Flask(__name__)


@app.route('/')
def index():
    return render_template('index.html.jinja')


@app.route('/list-stock')
def list_stock():
    try:
        stock_list = get_stock_list()
        if stock_list is None:
            return jsonify({"error": "Stock list not found"}), 404
        return jsonify([{"code": stock.stock_code, "name": stock.stock_name} for stock in stock_list])
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/predict', methods=['POST'])
def predict():
    stock_code = request.json['stock_code']
    if not stock_code:
        return jsonify({"error": "Stock code is required"}), 400
    stock_code += ".JK"  # Add .JK suffix for Indonesian stocks
    timezone = pytz.timezone('Asia/Jakarta')  # Adjust if needed
    date = datetime.now(timezone).strftime('%Y-%m-%d')
    print(f"Today time: {datetime.now(timezone)}")
    if datetime.now().hour < 16:
        date = (datetime.now() - timedelta(days=1)).replace(hour=17, minute=0, second=0).strftime('%Y-%m-%d %H:%M:%S')

    # Debug mode to save computation time, remove later
    # return jsonify(
    #     {
    #         "prediction": "1",
    #     }
    # )

    # Simulate error
    # return jsonify(
    #     {
    #         "error": "Simulated error",
    #     }
    # ),    200
    try:
        global  model
        if model is None:
            run = wandb.init(mode="online", project="import-model-test")
            artifact = run.use_artifact(
                'rivferd-politeknik-negeri-malang/next_day_price_prediction_TESTING/run_cl70sgdb_model:v7',
                type='model')
            artifact_dir = artifact.download()
            model = load_model(artifact_dir, custom_objects={"loss": focal_loss(alpha=0.5, gamma=1.0)})

        prediction, last_date = predict_stock_trend(model, stock_code, date)
        return jsonify(
            {
                "prediction": str(prediction),
                "last_date": last_date,
            }
        )
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500
