import mysql.connector
from mysql.connector import Error

def test_connection():
    try:
        connection = mysql.connector.connect(
            host='vivantara.com',
            user='aumlaan',
            password='shikhaghosh003'
        )
        if connection.is_connected():
            db_Info = connection.get_server_info()
            print("Connected to MySQL Server version ", db_Info)
            cursor = connection.cursor()
            cursor.execute("SHOW DATABASES")
            records = cursor.fetchall()
            print("Available Databases:")
            for row in records:
                print("- ", row[0])
    except Error as e:
        print("Error while connecting to MySQL", e)
    finally:
        if 'connection' in locals() and connection.is_connected():
            cursor.close()
            connection.close()
            print("MySQL connection is closed")

test_connection()
