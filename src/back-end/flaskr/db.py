import flask
from typing import Tuple
import psycopg2
import os
import csv
import time
from tqdm import tqdm

# Connection

def try_get_conn():
    try:
        conn = psycopg2.connect(
            database=os.environ.get("POSTGRES_DB"),
            host=os.environ.get("POSTGRES_URI"),
            password=os.environ.get("POSTGRES_PASSWORD"),
            user="postgres"
        )
        return conn
    except:
        return None

def get_conn_g():
    if "conn" not in flask.g:
        conn = try_get_conn()
        flask.g.conn = conn
        return conn
    return flask.g.conn

# Startup

def init_db():
    """
    Initializes the postgres database by creating the table
    that receives the COVID-19 data, as well as the relevant indexes.
    """
    print("\n########### INITDB ###########\n")
    # Wait for docker to spin up
    conn = None
    while not conn:
        conn = try_get_conn() or time.sleep(1)
    
    print("here")
    print("Connection established")
        
    commands = [
        """
            CREATE TABLE IF NOT EXISTS state_data (
                id SERIAL PRIMARY KEY,
                date DATE NOT NULL,
                region_code VARCHAR(3) NOT NULL,
                region_name VARCHAR(255) NOT NULL,
                state_code VARCHAR(3) NOT NULL,
                state_name VARCHAR(255) NOT NULL,
                state_abbreviation VARCHAR(2) NOT NULL,
                case_total INTEGER NOT NULL
            )
        """,
        """
            CREATE INDEX IF NOT EXISTS date_asc ON state_data ( date ASC )
        """,
    ]
    
    print("Tables created")
        
    with conn.cursor() as c:
        for command in commands:
            c.execute(command)
        conn.commit()
        
def run_data_import():
    """
    Import script for the COVID-19 into the `states_data` postgres table.
    If the table is not empty, the import is assumed to have already run.
    
    This snippet is supposed to be run separately from the main application.
    """
    print("\n########### DATA IMPORT ###########\n")
    conn = try_get_conn()
    covid_data_dir = os.environ.get("COVID_DATA_PATH") or ""
    csv_path = os.path.join(covid_data_dir, "dati-province", "dpc-covid19-ita-province.csv")
    
    if not covid_data_dir or not os.path.exists(csv_path):
        raise Exception("COVID_DATA_DIR is not set or does not exist")
    
    with conn.cursor() as c:
        c.execute("SELECT COUNT(*) FROM state_data;")
        count = c.fetchone()
        if count[0] > 0:
            print("Data table is not emtpy. Skipping.")
            return
    
    with open(csv_path, "r") as f:
        reader = csv.reader(f, delimiter=",")
        # skip headers
        next(reader)
        
        with conn.cursor() as c:
            for row in tqdm(reader, total=257957, desc="COVID data import"):
                if not row:
                    continue
                date = row[0]
                reg_code = row[2]
                reg_name= row[3]
                state_code = row[4]
                state_name = row[5]
                state_abbr = row[6]
                cases = row[9]
                command = """
                    INSERT INTO state_data (
                        date,
                        region_code,
                        region_name,
                        state_code,
                        state_name,
                        state_abbreviation,
                        case_total    
                    ) VALUES (
                        %s, %s, %s, %s, %s, %s, %s
                    )
                """
                
                c.execute(command, (date, reg_code, reg_name, state_code, state_name, state_abbr, cases))
            
            conn.commit()
            
            print("Done")
            
# Data logic

def get_valid_date_interval(conn) -> Tuple[str, str]:
    """
    Fetches the earliest and latest dates which are available in the COVID-19 data.
    Intended to be used as fallback values when the user requests out-of-range dates.
    """
    with conn.cursor() as c:
        c.execute("""
            (
                SELECT date
                FROM state_data
                ORDER BY date ASC
                LIMIT 1
            )

            UNION ALL

            (
                SELECT date
                FROM state_data
                ORDER BY date desc
                LIMIT 1
            )
        """)
        res = c.fetchall()
        return (res[0][0], res[1][0])