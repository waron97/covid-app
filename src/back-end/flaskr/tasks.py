import os
import datetime
from flaskr import db
from celery import shared_task
from openpyxl import Workbook

@shared_task(ignore_result=False)
def export_state_date_xlsx(date: datetime.datetime):
    conn = db.try_get_conn()
    datestr = date.strftime("%Y-%m-%d")
    fname = f"{datestr}.xlsx"
    save_path = f"static/exports/{fname}"
    serve_path = f"{os.environ.get('API_URL')}/static/exports/{fname}"
    
    try:
        os.makedirs("static/exports", exist_ok=True)
    except FileExistsError:
        pass

    if os.path.exists(save_path):
        return serve_path
    
    wb = Workbook()
    ws = wb.active
    command = """
        SELECT
            R.region_name,
            SUM(C.case_total)
        FROM covid_case_records AS C
        FULL JOIN states AS S ON C.state_code = S.state_code
        FULL JOIN regions AS R on S.region_code = R.region_code
        WHERE C.date = %s
        GROUP BY R.region_name
        ORDER BY R.region_name ASC
    """
    with conn.cursor() as c:
        c.execute(command, (datestr,))
        ws.append(["region_name", "case_total"])
        for row in c.fetchall():
            ws.append(row)
        wb.save(save_path)
        return serve_path
    