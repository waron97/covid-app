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
    
    print("Connection established")
        
    commands = [
        """
            CREATE TABLE IF NOT EXISTS covid_case_records (
                date DATE NOT NULL,
                state_code VARCHAR(3) NOT NULL,
                case_total INTEGER NOT NULL,
                CONSTRAINT covid_case_records_pkey PRIMARY KEY (date, state_code)
            )
        """,
        """
            CREATE TABLE IF NOT EXISTS regions (
                region_code VARCHAR(3) PRIMARY KEY,
                region_name VARCHAR(255) NOT NULL
            )
        """,
        """
            CREATE TABLE IF NOT EXISTS states (
                state_code VARCHAR(3) PRIMARY KEY,
                state_name VARCHAR(255) NOT NULL,
                state_abbreviation VARCHAR(2) NOT NULL,
                region_code VARCHAR(3) NOT NULL REFERENCES regions (region_code)
            )
        """
        # """
        #     CREATE INDEX IF NOT EXISTS date_asc ON state_data ( date ASC )
        # """,
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
    
    with open(csv_path, "rbU") as f:
        num_lines = sum(1 for _ in f)
    
    
    with conn.cursor() as c:
        # Check if all records are imported, maybe newer data is available
        c.execute("SELECT COUNT(*) FROM covid_case_records;")
        count = c.fetchone()
        # -1 because headers are not imported
        if count[0] >= num_lines - 1:
            print("Found no new rows to import. Skipping...")
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
                commands = [
                    (
                        """
                        INSERT INTO regions (
                                region_code,
                                region_name
                            ) VALUES (
                                %s, %s
                            )
                            ON CONFLICT DO NOTHING
                        """, 
                        (reg_code, reg_name)
                    ),
                    (
                        """
                            INSERT INTO states (
                                state_code,
                                state_name,
                                state_abbreviation,
                                region_code
                            ) VALUES (
                                %s, %s, %s, %s
                            )
                            ON CONFLICT DO NOTHING
                        """, 
                        (state_code, state_name, state_abbr, reg_code)
                    ),
                    (
                        """
                            INSERT INTO covid_case_records (
                                date,
                                state_code,
                                case_total    
                            ) VALUES (
                                %s, %s, %s
                            )
                            ON CONFLICT DO UPDATE
                        """, 
                        (date, state_code, cases)
                    )
                ]
                
                for (command, args) in commands:
                    c.execute(command, args)
            
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
                FROM covid_case_records
                ORDER BY date ASC
                LIMIT 1
            )

            UNION ALL

            (
                SELECT date
                FROM covid_case_records
                ORDER BY date desc
                LIMIT 1
            )
        """)
        res = c.fetchall()
        return (res[0][0], res[1][0])