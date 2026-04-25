from flask import Flask, jsonify
from flask_cors import CORS
from routes.auth import auth_bp
from routes.jogadores import jogadores_bp
from routes.equipas import equipas_bp
from routes.ligas import ligas_bp
from routes.jornadas import jornadas_bp
from flask import send_from_directory

app = Flask(__name__)
CORS(app)

app.register_blueprint(auth_bp, url_prefix='/auth')
app.register_blueprint(jogadores_bp, url_prefix='/jogadores')
app.register_blueprint(equipas_bp, url_prefix='/equipas')
app.register_blueprint(ligas_bp, url_prefix='/ligas')
app.register_blueprint(jornadas_bp, url_prefix='/jornadas')

@app.route('/')
def index():
    return jsonify({
        "app": "OnzePerfeito",
        "versao": "1.0",
        "status": "online"
    })

@app.route('/health')
def health():
    return jsonify({"status": "healthy"})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=False)

@app.route('/app')
@app.route('/app/<path:filename>')
def frontend(filename='index.html'):
    return send_from_directory('static', filename)