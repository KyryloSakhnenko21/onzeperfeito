from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from routes.auth import auth_bp
from routes.jogadores import jogadores_bp
from routes.equipas import equipas_bp
from routes.ligas import ligas_bp
from routes.jornadas import jornadas_bp
import os

app = Flask(__name__, static_folder='static', static_url_path='')
CORS(app)

app.register_blueprint(auth_bp, url_prefix='/auth')
app.register_blueprint(jogadores_bp, url_prefix='/jogadores')
app.register_blueprint(equipas_bp, url_prefix='/equipas')
app.register_blueprint(ligas_bp, url_prefix='/ligas')
app.register_blueprint(jornadas_bp, url_prefix='/jornadas')

@app.route('/api/status')
def api_status():
    return jsonify({
        "app": "OnzePerfeito",
        "versao": "1.0",
        "status": "online"
    })

@app.route('/health')
def health():
    return jsonify({"status": "healthy"})

@app.route('/')
@app.route('/<path:filename>')
def frontend(filename='index.html'):
    static_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static')
    if filename != 'index.html' and os.path.exists(os.path.join(static_dir, filename)):
        return send_from_directory(static_dir, filename)
    return send_from_directory(static_dir, 'index.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=False)