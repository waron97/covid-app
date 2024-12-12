"""
Script to be run before main web server to set up database.
Moved outside of app logic to avoid cold starts and concurrent execution by workers.
"""

if __name__ == "__main__":
    from flaskr import db
    db.init_db()
    db.run_data_import()