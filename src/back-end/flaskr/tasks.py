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
    os.makedirs("static/exports")

    if os.path.exists(save_path):
        return serve_path
    
    wb = Workbook()
    ws = wb.active
    command = """
        SELECT
            region_name,
            SUM(case_total)
        FROM state_data
        WHERE date = %s
        GROUP BY region_name
        ORDER BY region_name ASC
    """
    with conn.cursor() as c:
        c.execute(command, (datestr,))
        ws.append(["region_name", "case_total"])
        for row in c.fetchall():
            ws.append(row)
        wb.save(save_path)
        return serve_path
    