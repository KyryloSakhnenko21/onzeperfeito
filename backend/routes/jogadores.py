from flask import Blueprint, jsonify, request
from db import get_container

jogadores_bp = Blueprint('jogadores', __name__)

@jogadores_bp.route('/', methods=['GET'])
def listar_jogadores():
    container = get_container('jogadores')
    clube = request.args.get('clube')

    if clube:
        items = list(container.query_items(
            query="SELECT * FROM c WHERE c.clube = @clube",
            parameters=[{"name": "@clube", "value": clube}],
            enable_cross_partition_query=True
        ))
    else:
        items = list(container.query_items(
            query="SELECT * FROM c",
            enable_cross_partition_query=True
        ))

    return jsonify(items), 200


@jogadores_bp.route('/<jogador_id>', methods=['GET'])
def obter_jogador(jogador_id):
    container = get_container('jogadores')
    items = list(container.query_items(
        query="SELECT * FROM c WHERE c.id = @id",
        parameters=[{"name": "@id", "value": jogador_id}],
        enable_cross_partition_query=True
    ))

    if not items:
        return jsonify({"erro": "Jogador não encontrado"}), 404

    return jsonify(items[0]), 200