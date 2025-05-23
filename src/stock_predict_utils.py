import pandas as pd
import requests
import numpy as np
import tensorflow as tf
from .stock_response import StockResponse
from pytz import timezone
from datetime import datetime
from typing import List, Any, Optional
from stock_indicators import indicators

def convert_to_unix_timestamp(date_str: str) -> int:
    date_with_time = datetime.strptime(date_str, "%Y-%m-%d %H:%M:%S")
    return int(date_with_time.timestamp())


def predict_stock_trend(model: Optional[Any], stock_code: str, date: str):
    # Convert date
    end_ts = convert_to_unix_timestamp(date)
    start_ts = convert_to_unix_timestamp("2020-01-01 17:00:00")  # or go 100 days back

    # Fetch data
    stock_url = f"https://query2.finance.yahoo.com/v8/finance/chart/{stock_code}?period1={start_ts}&period2={end_ts}&interval=1d"
    headers = {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0"
    }
    r = requests.get(stock_url, headers=headers)
    stock_data = StockResponse.from_json(r.json()).stock_data

    # for testing only, print the last date that got from the api
    print('Last date:')
    print(stock_data[-1].date)

    df = StockResponse(stock_data).to_dataframe()

    # Compute indicators
    df = compute_and_add_indicators(stock_data, df)

    # Drop non-feature columns
    feature_df = df.drop(columns=["date", "next_day_price_move"], errors="ignore")

    # Only use feature that saved on "selected_features.txt"
    selected_features = []
    with open("keras_models/selected_features.txt", "r") as f:
        for line in f:
            selected_features.append(line.strip())
    feature_df = feature_df[selected_features]

    # Get last window (e.g., last 60 days)
    window_size = 20  # TODO: change to load from config file later
    if len(feature_df) < window_size:
        print("Not enough data to predict")
        return

    x_input = feature_df[-window_size:].values
    x_input = x_input.reshape((1, x_input.shape[0], x_input.shape[1]))

    # Ensure x_input does not contain decimal.Decimal objects by converting them to float
    if isinstance(x_input, np.ndarray):
        x_input = x_input.astype(float)  # Convert the entire NumPy array to float
    else:
        # For iterables other than NumPy arrays
        x_input = np.array([float(value) for value in x_input])


    # Load model
    # model = load_model("stock_trend_predictor.h5", custom_objects={'focal_loss': focal_loss})

    # Predict
    pred = model.predict(x_input)
    predicted_class = np.argmax(pred)

    label_map = {0: "Downtrend", 1: "neutral", 2: "Uptrend"}
    # print(f"Prediction for {stock_code} on {date}: {label_map[predicted_class]}") // TODO: benerin lah ini bjir kapan datenya
    print(f"Prediction for {stock_code}: {label_map[predicted_class]}")
    return predicted_class, stock_data[-1].date


def compute_and_add_indicators(stock_data: List, df: pd.DataFrame) -> pd.DataFrame:
    """
    Compute technical indicators and add them to the DataFrame.

    Parameters:
    - stock_data (List): List of Quote objects containing stock data.
    - df (pd.DataFrame): DataFrame containing stock data.

    Returns:
    - pd.DataFrame: Updated DataFrame with technical indicators.
    """
    # Compute Technical Indicators
    sma = indicators.get_sma(stock_data, 14)
    rsi = indicators.get_rsi(stock_data, 14)
    macd = indicators.get_macd(stock_data)
    bollinger = indicators.get_bollinger_bands(stock_data, 20)
    atr = indicators.get_atr(stock_data, 14)
    wma = indicators.get_wma(stock_data, 14)
    tr = indicators.get_tr(stock_data)
    stoch_oscillator = indicators.get_stoch(stock_data)
    william = indicators.get_williams_r(stock_data)
    ema = indicators.get_ema(stock_data, 14)
    obv = indicators.get_obv(stock_data)
    ichimoku = indicators.get_ichimoku(stock_data)
    vwap = indicators.get_vwap(stock_data)
    smi = indicators.get_smi(stock_data)
    dema = indicators.get_dema(stock_data, 14)
    mfi = indicators.get_mfi(stock_data)
    cci = indicators.get_cci(stock_data)
    cmo = indicators.get_cmo(stock_data, 14)

    # Add indicators to the DataFrame
    for i in range(len(df)):
        df.loc[i, 'SMA'] = sma[i].sma
        df.loc[i, 'RSI'] = rsi[i].rsi
        df.loc[i, 'MACD'] = macd[i].macd
        df.loc[i, 'bollinger_upper'] = bollinger[i].upper_band
        df.loc[i, 'bollinger_lower'] = bollinger[i].lower_band
        df.loc[i, 'ATR'] = atr[i].atr
        df.loc[i, 'WMA'] = wma[i].wma
        df.loc[i, 'TR'] = tr[i].tr
        df.loc[i, '%K'] = stoch_oscillator[i].k
        df.loc[i, '%D'] = stoch_oscillator[i].d
        df.loc[i, '%R'] = william[i].williams_r
        df.loc[i, 'EMA'] = ema[i].ema
        df.loc[i, 'OBV'] = obv[i].obv
        df.loc[i, 'Ichimoku'] = ichimoku[i].kijun_sen
        df.loc[i, 'VWAP'] = vwap[i].vwap
        df.loc[i, 'SMI'] = smi[i].smi
        df.loc[i, 'DEMA'] = dema[i].dema
        df.loc[i, 'MFI'] = mfi[i].mfi
        df.loc[i, 'CCI'] = cci[i].cci
        df.loc[i, 'CMO'] = cmo[i].cmo

    # Handle missing values or NaNs
    df = df.dropna()

    # Convert columns to appropriate data types
    df = df.astype({
        'close': 'float64',
        'SMA': 'float64',
        'RSI': 'float64',
        'MACD': 'float64',
        'bollinger_upper': 'float64',
        'bollinger_lower': 'float64',
        'ATR': 'float64',
        'WMA': 'float64',
        'TR': 'float64',
        '%K': 'float64',
        '%D': 'float64',
        '%R': 'float64',
        'EMA': 'float64',
        'OBV': 'float64',
        'Ichimoku': 'float64',
        'VWAP': 'float64',
        'SMI': 'float64',
        'DEMA': 'float64',
        'MFI': 'float64',
        'CCI': 'float64',
        'CMO': 'float64'
    })

    # Verify data types (optional, can be disabled to save computation)
    # print(df.dtypes)

    return df

def focal_loss_with_class_weights(gamma=2.0, alpha=None):
    if alpha is None:
        alpha = [0.3, 1.0, 0.3]

    def loss(y_true, y_pred):
        y_true = tf.one_hot(tf.cast(tf.squeeze(y_true), tf.int32), depth=3)
        y_pred = tf.clip_by_value(y_pred, 1e-8, 1.0)

        cross_entropy = -y_true * tf.math.log(y_pred)
        weight = tf.pow(1 - y_pred, gamma)

        if alpha is not None:
            alpha_tensor = tf.constant(alpha, dtype=tf.float32)
            alpha_weight = y_true * alpha_tensor
            weight *= alpha_weight

        loss = weight * cross_entropy
        return tf.reduce_mean(tf.reduce_sum(loss, axis=-1))
    return loss