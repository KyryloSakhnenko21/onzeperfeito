from flask import Blueprint, jsonify, request
from db import get_container

jornadas_bp = Blueprint('jornadas', __name__)

@jornadas_bp.route('/pontuacoes', methods=['GET'])
def obter_pontuacoes():
    jornada = request.args.get('jornada')
    container = get_container('pontuacoes')

    if jornada:
        items = list(container.query_items(
            query="SELECT * FROM c WHERE c.jornada = @jornada",
            parameters=[{"name": "@jornada", "value": jornada}],
            enable_cross_partition_query=True
        ))
    else:
        items = list(container.query_items(
            query="SELECT * FROM c",
            enable_cross_partition_query=True
        ))

    return jsonify(items), 200


@jornadas_bp.route('/evento', methods=['GET'])
def obter_evento():
    jornada = request.args.get('jornada')
    container = get_container('eventos_jornada')

    items = list(container.query_items(
        query="SELECT * FROM c WHERE c.jornada = @jornada",
        parameters=[{"name": "@jornada", "value": jornada}],
        enable_cross_partition_query=True
    ))

    if not items:
        return jsonify({"erro": "Nenhum evento para esta jornada"}), 404

    return jsonify(items[0]), 200