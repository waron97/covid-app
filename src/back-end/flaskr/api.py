from flask import Blueprint, request
from flaskr.db import get_conn_g

bp = Blueprint("api", __name__, url_prefix="/api")

@bp.get("/by-date/<date>")
def get_state_data_by_date(date):
    command = """
        SELECT * FROM state_data WHERE date = %s
    """
    conn = get_conn_g()