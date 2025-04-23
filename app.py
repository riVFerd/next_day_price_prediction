import requests
from flask import Flask, render_template, jsonify
from src.stock_list.stock_list import get_stock_list

app = Flask(__name__)


@app.route('/')
def index():
    return render_template('index.html.jinja', name="Virgy")


@app.route('/list-stock')
def list_stock():
    try:
        stock_list = get_stock_list()
        if stock_list is None:
            return jsonify({"error": "Stock list not found"}), 404
        return jsonify([{"code": stock.stock_code, "name": stock.stock_name} for stock in stock_list])
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run("0.0.0.0", port=5000, debug=True)
