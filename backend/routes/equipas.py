from flask import Blueprint, request, jsonify
from db import get_container
import uuid
from datetime import datetime

equipas_bp = Blueprint('equipas', __name__)

@equipas_bp.route('/', methods=['GET'])
def obter_equipa():
    utilizador_id = request.args.get('utilizador_id')
    if not utilizador_id:
        return jsonify({"erro": "utilizador_id obrigatório"}), 400

    container = get_container('equipas')
    items = list(container.query_items(
        query="SELECT * FROM c WHERE c.utilizador_id = @uid",
        parameters=[{"name": "@uid", "value": utilizador_id}],
        enable_cross_partition_query=True
    ))

    return jsonify(items[0] if items else {}), 200


@equipas_bp.route('/', methods=['POST'])
def guardar_equipa():
    data = request.get_json()
    utilizador_id = data.get('utilizador_id')
    jogadores = data.get('jogadores', [])

    if not utilizador_id:
        return jsonify({"erro": "utilizador_id obrigatório"}), 400

    if len(jogadores) > 15:
        return jsonify({"erro": "Máximo de 15 jogadores permitido"}), 400

    container = get_container('equipas')
    items = list(container.query_items(
        query="SELECT * FROM c WHERE c.utilizador_id = @uid",
        parameters=[{"name": "@uid", "value": utilizador_id}],
        enable_cross_partition_query=True
    ))

    equipa = {
        "id": items[0]['id'] if items else str(uuid.uuid4()),
        "utilizador_id": utilizador_id,
        "jogadores": jogadores,
        "atualizado_em": datetime.utcnow().isoformat()
    }

    if items:
        container.replace_item(item=items[0]['id'], body=equipa)
    else:
        container.create_item(equipa)

    return jsonify({"mensagem": "Equipa guardada com sucesso"}), 200