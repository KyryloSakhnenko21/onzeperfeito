from flask import Blueprint, request, jsonify
from db import get_container
import bcrypt
import jwt
import os
import uuid
from datetime import datetime, timedelta

auth_bp = Blueprint('auth', __name__)
JWT_SECRET = os.getenv("JWT_SECRET", "onzeperfeito_secret")

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    nome = data.get('nome')

    if not email or not password or not nome:
        return jsonify({"erro": "Campos obrigatórios em falta"}), 400

    container = get_container('utilizadores')

    try:
        lista = list(container.query_items(
            query="SELECT * FROM c WHERE c.email = @email",
            parameters=[{"name": "@email", "value": email}],
            enable_cross_partition_query=True
        ))
        if lista:
            return jsonify({"erro": "Email já registado"}), 409
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

    hash_pw = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    utilizador = {
        "id": str(uuid.uuid4()),
        "email": email,
        "nome": nome,
        "password": hash_pw,
        "criado_em": datetime.utcnow().isoformat()
    }

    container.create_item(utilizador)
    return jsonify({"mensagem": "Utilizador criado com sucesso"}), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    container = get_container('utilizadores')
    lista = list(container.query_items(
        query="SELECT * FROM c WHERE c.email = @email",
        parameters=[{"name": "@email", "value": email}],
        enable_cross_partition_query=True
    ))

    if not lista:
        return jsonify({"erro": "Credenciais inválidas"}), 401

    utilizador = lista[0]
    if not bcrypt.checkpw(password.encode(), utilizador['password'].encode()):
        return jsonify({"erro": "Credenciais inválidas"}), 401

    token = jwt.encode({
        "id": utilizador['id'],
        "email": utilizador['email'],
        "exp": datetime.utcnow() + timedelta(hours=24)
    }, JWT_SECRET, algorithm="HS256")

    return jsonify({"token": token, "nome": utilizador['nome']}), 200