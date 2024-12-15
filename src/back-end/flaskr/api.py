from flask import Blueprint, request
from flaskr.util import parse_date
from flaskr import db, tasks
from celery.result import AsyncResult
from flaskr.util import box

bp = Blueprint("api", __name__, url_prefix="/api")

@bp.get("/states")
def get_state_data_by_date():
    conn = db.get_conn_g()
    _, upper = db.get_valid_date_interval(conn)
    date = parse_date(request.args.get("date")) or upper
    command = """
        SELECT * FROM (
            SELECT 
                *,
                case_total - lag(case_total) OVER (PARTITION BY state_name, region_name ORDER BY date ASC) AS delta
            FROM (
                SELECT
                    to_char(C.date, 'YYYY-MM-DD') as date, 
                    S.state_name as state_name, 
                    S.state_code as state_code,
                    R.region_name as region_name,
                    C.case_total as case_total
                FROM covid_case_records AS C
                FULL JOIN states AS S ON C.state_code = S.state_code
                FULL JOIN regions AS R on S.region_code = R.region_code
                WHERE C.date = %s OR C.date = %s::TIMESTAMP - INTERVAL '1 DAY'
            )
        )
        WHERE date = %s
    """
    with conn.cursor() as c:
        d = date.strftime("%Y-%m-%d")
        c.execute(command, (d, d, d))
        return box(c.fetchall(), ("date", "state_name", "state_code", "region_name", "case_total", "delta_day"))
    

@bp.get("/regions")
def get_region_data_by_date():
    conn = db.get_conn_g()
    lower, upper = db.get_valid_date_interval(conn)
    start = parse_date(request.args.get("start")) or lower
    end = parse_date(request.args.get("end")) or upper
    
    if (start - end).days > 31:
        return "Intervals longer than 31 days are not allowed", 400
    
    cmd = """
        SELECT to_char(C.date, 'YYYY-MM-DD'), R.region_name, SUM(C.case_total) AS case_total
        FROM covid_case_records AS C
        FULL JOIN states AS S ON C.state_code = S.state_code
        FULL JOIN regions AS R on S.region_code = R.region_code
        WHERE C.date >= %s AND C.date <= %s   
        GROUP BY (C.date, R.region_name)
        ORDER BY C.date ASC, case_total DESC, R.region_name ASC
    """
    with conn.cursor() as c:
        c.execute(cmd, (start.strftime("%Y-%m-%d"), end.strftime("%Y-%m-%d")))
        return box(c.fetchall(), ("date", "region_name", "case_total"))
    

@bp.get("/interval")
def get_valid_intervals():
    conn = db.get_conn_g()
    start, end = db.get_valid_date_interval(conn)
    return {
        "start": start.strftime("%Y-%m-%d"),
        "end": end.strftime("%Y-%m-%d")
    }

@bp.get("/export")
def export_state_data_at_date():
    date = parse_date(request.args.get("date"))
    result = tasks.export_state_date_xlsx.delay(date)
    return {
        "task_id": result.id
    }
    
@bp.get("/result/<id>")
def task_result(id: str) -> dict[str, object]:
    result = AsyncResult(id)
    return {
        "ready": result.ready(),
        "successful": result.successful(),
        "value": result.result if result.ready() else None,
    }