from flask import Blueprint, request, jsonify
from db import get_container
import uuid
import random
import string
from datetime import datetime

ligas_bp = Blueprint('ligas', __name__)

def gerar_codigo():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

@ligas_bp.route('/', methods=['GET'])
def listar_ligas():
    container = get_container('ligas')
    tipo = request.args.get('tipo', 'global')
    items = list(container.query_items(
        query="SELECT * FROM c WHERE c.tipo = @tipo",
        parameters=[{"name": "@tipo", "value": tipo}],
        enable_cross_partition_query=True
    ))
    return jsonify(items), 200


@ligas_bp.route('/criar', methods=['POST'])
def criar_liga():
    data = request.get_json()
    nome = data.get('nome')
    criador_id = data.get('criador_id')

    liga = {
        "id": str(uuid.uuid4()),
        "nome": nome,
        "tipo": "privada",
        "codigo": gerar_codigo(),
        "criador_id": criador_id,
        "membros": [criador_id],
        "criado_em": datetime.utcnow().isoformat()
    }

    get_container('ligas').create_item(liga)
    return jsonify(liga), 201


@ligas_bp.route('/entrar', methods=['POST'])
def entrar_liga():
    data = request.get_json()
    codigo = data.get('codigo')
    utilizador_id = data.get('utilizador_id')

    container = get_container('ligas')
    items = list(container.query_items(
        query="SELECT * FROM c WHERE c.codigo = @codigo",
        parameters=[{"name": "@codigo", "value": codigo}],
        enable_cross_partition_query=True
    ))

    if not items:
        return jsonify({"erro": "Liga não encontrada"}), 404

    liga = items[0]
    if utilizador_id not in liga['membros']:
        liga['membros'].append(utilizador_id)
        container.replace_item(item=liga['id'], body=liga)

    return jsonify({"mensagem": "Entraste na liga com sucesso"}), 200