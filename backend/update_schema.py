#!/usr/bin/env python3
"""
Script to update the database schema to include 'metro' in the mode ENUM
"""

import mysql.connector
import os
from dotenv import load_dotenv

def update_schema():
    """Update the database schema to include metro mode"""
    try:
        # Load environment variables
        load_dotenv()
        
        # Connect to MySQL
        connection = mysql.connector.connect(
            host=os.getenv('MYSQL_HOST', 'localhost'),
            user=os.getenv('MYSQL_USER', 'root'),
            password=os.getenv('MYSQL_PASSWORD', 'satvik@12345'),
            database=os.getenv('MYSQL_DB', 'travelapp'),
            port=int(os.getenv('MYSQL_PORT', 3306))
        )
        
        cursor = connection.cursor()
        
        # Update the mode ENUM to include 'metro'
        alter_query = """
        ALTER TABLE trips 
        MODIFY COLUMN mode ENUM('walk','bike','bus','car','train','cycling','metro') NOT NULL
        """
        
        cursor.execute(alter_query)
        connection.commit()
        
        print("✅ Successfully updated mode ENUM to include 'metro'")
        
        # Verify the change
        cursor.execute("SHOW COLUMNS FROM trips LIKE 'mode'")
        result = cursor.fetchone()
        print(f"Updated mode column: {result[1]}")
        
    except mysql.connector.Error as err:
        print(f"Error updating schema: {err}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

if __name__ == "__main__":
    update_schema()
