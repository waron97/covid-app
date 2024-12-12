from flask import Blueprint, request
from flaskr.util import parse_date
from flaskr import db

bp = Blueprint("api", __name__, url_prefix="/api")

@bp.get("/states")
def get_state_data_by_date():
    conn = db.get_conn_g()
    _, upper = db.get_valid_date_interval(conn)
    date = parse_date(request.args.get("date")) or upper
    command = """
        SELECT 
            TO_CHAR(date, 'YYYY-MM-DD'),
            state_name,
            region_name,
            case_total
        FROM state_data WHERE date = %s
    """
    with conn.cursor() as c:
        d = date.strftime("%Y-%m-%d")
        c.execute(command, (d,))
        return c.fetchall()
    

@bp.get("/regions")
def get_region_data_by_date():
    conn = db.get_conn_g()
    lower, upper = db.get_valid_date_interval(conn)
    start = parse_date(request.args.get("start")) or lower
    end = parse_date(request.args.get("end")) or upper
    cmd = """
        SELECT
            to_char(date, 'YYYY-MM-DD'), 
            region_name, 
            SUM(case_total) 
        FROM state_data
        WHERE date >= %s AND date <= %s
        GROUP BY date, region_name
        ORDER BY date ASC, case_total DESC, region_name ASC;
    """
    with conn.cursor() as c:
        c.execute(cmd, (start.strftime("%Y-%m-%d"), end.strftime("%Y-%m-%d")))
        return c.fetchall()
    

@bp.get("/interval")
def get_valid_intervals():
    conn = db.get_conn_g()
    start, end = db.get_valid_date_interval(conn)
    return {
        "start": start.strftime("%Y-%m-%d"),
        "end": end.strftime("%Y-%m-%d")
    }