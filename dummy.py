import os
import sys
from datetime import datetime, timedelta, timezone

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import Database
from models.election import Election

def main():
    Database.init_db()
    admin_id = "60d5ecb54f12345678901234"
    
    e1 = Election.create_election(
        title="Student Council President 2026",
        description="Vote for the next student council president.",
        start_date=datetime.now(timezone.utc) - timedelta(days=1),
        end_date=datetime.now(timezone.utc) + timedelta(days=2),
        created_by=admin_id
    )
    Election.start_election(e1.id)
    
    e2 = Election.create_election(
        title="Best Teacher Award 2026",
        description="Vote for the most inspiring teacher of the year.",
        start_date=datetime.now(timezone.utc) + timedelta(days=5),
        end_date=datetime.now(timezone.utc) + timedelta(days=10),
        created_by=admin_id
    )
    
    e3 = Election.create_election(
        title="Campus Mascot Naming",
        description="Choose the name of our new mascot.",
        start_date=datetime.now(timezone.utc) - timedelta(days=10),
        end_date=datetime.now(timezone.utc) - timedelta(days=5),
        created_by=admin_id
    )
    Election.start_election(e3.id)
    Election.stop_election(e3.id)
    print('Dummy elections added successfully!')

if __name__ == '__main__':
    main()
