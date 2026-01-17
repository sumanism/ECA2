"""
Seed script to populate the database with dummy data.
Based on the preContext folder structure.
Run this from the backend directory: python seed_data.py
"""
import uuid
import random
from datetime import datetime, timedelta
from sqlmodel import Session, select
from database import engine, create_db_and_tables
from models import User, Product, Order, OrderItem, Segment

STATES = ["TX", "CA", "NY", "FL", "WA", "IL", "PA", "OH", "GA", "NC", "MI", "NJ", "VA", "AZ", "MA"]
CATEGORIES = ["Electronics", "Footwear", "Apparel", "Accessories", "Home & Garden", "Sports", "Books", "Toys"]

# Real first and last names for realistic data
FIRST_NAMES = [
    "James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda", "William", "Elizabeth",
    "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Christopher", "Karen",
    "Charles", "Nancy", "Daniel", "Lisa", "Matthew", "Betty", "Anthony", "Margaret", "Mark", "Sandra",
    "Donald", "Ashley", "Steven", "Kimberly", "Paul", "Emily", "Andrew", "Donna", "Joshua", "Michelle",
    "Kenneth", "Carol", "Kevin", "Amanda", "Brian", "Melissa", "George", "Deborah", "Timothy", "Stephanie",
    "Ronald", "Rebecca", "Jason", "Sharon", "Edward", "Laura", "Jeffrey", "Cynthia", "Ryan", "Kathleen",
    "Jacob", "Amy", "Gary", "Angela", "Nicholas", "Shirley", "Eric", "Anna", "Jonathan", "Brenda",
    "Stephen", "Pamela", "Larry", "Emma", "Justin", "Nicole", "Scott", "Helen", "Brandon", "Samantha",
    "Benjamin", "Katherine", "Samuel", "Christine", "Gregory", "Debra", "Frank", "Rachel", "Raymond", "Carolyn"
]

LAST_NAMES = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
    "Hernandez", "Lopez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee",
    "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker", "Young",
    "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores", "Green", "Adams",
    "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell", "Carter", "Roberts", "Gomez", "Phillips",
    "Evans", "Turner", "Diaz", "Parker", "Cruz", "Edwards", "Collins", "Reyes", "Stewart", "Morris",
    "Morales", "Murphy", "Cook", "Rogers", "Gutierrez", "Ortiz", "Morgan", "Cooper", "Peterson", "Bailey",
    "Reed", "Kelly", "Howard", "Ramos", "Kim", "Cox", "Ward", "Richardson", "Watson", "Brooks"
]

def seed_database():
    """Generate and seed dummy data"""
    # Create tables first
    create_db_and_tables()
    
    with Session(engine) as session:
        # Check if data already exists
        existing_users = session.exec(select(User)).first()
        if existing_users:
            print("⚠️  Database already contains data. Skipping seed.")
            print("   To re-seed, delete the database.db file first.")
            return
        
        print("Generating realistic dummy data...")
        
        # Generate 100 Users with real names
        users = []
        used_emails = set()
        for i in range(100):
            first_name = random.choice(FIRST_NAMES)
            last_name = random.choice(LAST_NAMES)
            email_base = f"{first_name.lower()}.{last_name.lower()}"
            email_num = 1
            email = f"{email_base}{email_num}@gmail.com"
            
            # Ensure unique emails
            while email in used_emails:
                email_num += 1
                email = f"{email_base}{email_num}@gmail.com"
            used_emails.add(email)
            
            # Create user with varied order history
            days_since_last_order = random.randint(0, 365)
            last_order_date = datetime.utcnow() - timedelta(days=days_since_last_order) if days_since_last_order > 0 else None
            
            # Vary order counts and values for segmentation
            order_count = random.randint(0, 25)
            total_order_value = random.uniform(0, 5000) if order_count > 0 else 0.0
            
            user = User(
                id=str(uuid.uuid4()),
                email=email,
                phone=f"+1-{random.randint(200, 999)}-{random.randint(200, 999)}-{random.randint(1000, 9999)}",
                first_name=first_name,
                last_name=last_name,
                marketing_opt_in=random.choice([True, True, True, False]),  # 75% opt-in
                shipping_state=random.choice(STATES),
                shipping_country="US",
                total_order_value=total_order_value,
                order_count=order_count,
                last_order_date=last_order_date,
                created_at=datetime.utcnow() - timedelta(days=random.randint(30, 730))
            )
            users.append(user)
            session.add(user)
        
        session.commit()
        print(f"✓ Created {len(users)} users with realistic names")
        
        # Generate Products
        products = []
        for i in range(50):
            product = Product(
                id=str(uuid.uuid4()),
                name=f"Product-{i}",
                category=random.choice(CATEGORIES),
                brand=f"Brand-{i%5}",
                price=float(random.randint(10, 200)),
                created_at=datetime.utcnow()
            )
            products.append(product)
            session.add(product)
        
        session.commit()
        print(f"✓ Created {len(products)} products")
        
        # Generate Orders and Order Items
        orders = []
        order_items = []
        
        for i in range(200):  # More orders for better data
            user = random.choice(users)
            order_date = datetime.utcnow() - timedelta(days=random.randint(1, 365))
            
            # Select random products for this order
            selected_products = random.sample(products, random.randint(1, 3))
            order_total = 0.0
            
            # Create order
            order = Order(
                id=str(uuid.uuid4()),
                user_id=user.id,
                order_date=order_date,
                order_status=random.choice(["delivered", "delivered", "delivered", "pending", "shipped"]),
                total_amount=0.0,  # Will update after calculating
                currency="USD",
                channel=random.choice(["web", "mobile", "marketplace"]),
                coupon_code="SALE10" if i % 4 == 0 else None,
                created_at=order_date
            )
            
            # Create order items
            for product in selected_products:
                qty = random.randint(1, 3)
                unit_price = product.price
                order_total += qty * unit_price
                
                order_item = OrderItem(
                    id=str(uuid.uuid4()),
                    order_id=order.id,
                    product_id=product.id,
                    quantity=qty,
                    unit_price=unit_price
                )
                order_items.append(order_item)
                session.add(order_item)
            
            # Update order total
            order.total_amount = order_total
            orders.append(order)
            session.add(order)
            
            # Update user statistics
            user.total_order_value += order_total
            user.order_count += 1
            if user.last_order_date is None or order_date > user.last_order_date:
                user.last_order_date = order_date
        
        session.commit()
        print(f"✓ Created {len(orders)} orders")
        print(f"✓ Created {len(order_items)} order items")
        
        # Create Marketing Segments
        segments = []
        
        # Platinum Users - High value customers
        platinum_segment = Segment(
            id=str(uuid.uuid4()),
            name="Platinum Users",
            description="High-value customers with total purchase value above $1000",
            definition={
                "logical_operator": "AND",
                "criteria": [
                    {"field": "total_order_value", "operator": "gt", "value": 1000},
                    {"field": "marketing_opt_in", "operator": "eq", "value": True}
                ]
            },
            created_at=datetime.utcnow()
        )
        segments.append(platinum_segment)
        session.add(platinum_segment)
        
        # VIP Customers - Very high value
        vip_segment = Segment(
            id=str(uuid.uuid4()),
            name="VIP Customers",
            description="Top-tier customers with total purchase value above $2000",
            definition={
                "logical_operator": "AND",
                "criteria": [
                    {"field": "total_order_value", "operator": "gt", "value": 2000},
                    {"field": "order_count", "operator": "gt", "value": 5}
                ]
            },
            created_at=datetime.utcnow()
        )
        segments.append(vip_segment)
        session.add(vip_segment)
        
        # At-Risk Customers - Haven't ordered recently
        at_risk_segment = Segment(
            id=str(uuid.uuid4()),
            name="At-Risk Customers",
            description="Customers who haven't ordered in the last 90 days but have ordered before",
            definition={
                "logical_operator": "AND",
                "criteria": [
                    {"field": "days_since_last_order", "operator": "gt", "value": 90},
                    {"field": "order_count", "operator": "gt", "value": 0}
                ]
            },
            created_at=datetime.utcnow()
        )
        segments.append(at_risk_segment)
        session.add(at_risk_segment)
        
        # New Customers - Recent first-time buyers
        new_customers_segment = Segment(
            id=str(uuid.uuid4()),
            name="New Customers",
            description="First-time customers with 1-2 orders",
            definition={
                "logical_operator": "AND",
                "criteria": [
                    {"field": "order_count", "operator": "gte", "value": 1},
                    {"field": "order_count", "operator": "lte", "value": 2}
                ]
            },
            created_at=datetime.utcnow()
        )
        segments.append(new_customers_segment)
        session.add(new_customers_segment)
        
        # Active Subscribers - Opted in and recent orders
        active_subscribers_segment = Segment(
            id=str(uuid.uuid4()),
            name="Active Subscribers",
            description="Marketing opt-in customers with recent orders",
            definition={
                "logical_operator": "AND",
                "criteria": [
                    {"field": "marketing_opt_in", "operator": "eq", "value": True},
                    {"field": "days_since_last_order", "operator": "lt", "value": 30}
                ]
            },
            created_at=datetime.utcnow()
        )
        segments.append(active_subscribers_segment)
        session.add(active_subscribers_segment)
        
        # California Customers
        california_segment = Segment(
            id=str(uuid.uuid4()),
            name="California Customers",
            description="All customers located in California",
            definition={
                "logical_operator": "AND",
                "criteria": [
                    {"field": "shipping_state", "operator": "eq", "value": "CA"}
                ]
            },
            created_at=datetime.utcnow()
        )
        segments.append(california_segment)
        session.add(california_segment)
        
        # High Frequency Buyers
        high_frequency_segment = Segment(
            id=str(uuid.uuid4()),
            name="High Frequency Buyers",
            description="Customers with 10+ orders",
            definition={
                "logical_operator": "AND",
                "criteria": [
                    {"field": "order_count", "operator": "gte", "value": 10}
                ]
            },
            created_at=datetime.utcnow()
        )
        segments.append(high_frequency_segment)
        session.add(high_frequency_segment)
        
        # Gold Members - Mid-tier value
        gold_segment = Segment(
            id=str(uuid.uuid4()),
            name="Gold Members",
            description="Mid-tier customers with total purchase value between $500-$1000",
            definition={
                "logical_operator": "AND",
                "criteria": [
                    {"field": "total_order_value", "operator": "gte", "value": 500},
                    {"field": "total_order_value", "operator": "lt", "value": 1000}
                ]
            },
            created_at=datetime.utcnow()
        )
        segments.append(gold_segment)
        session.add(gold_segment)
        
        session.commit()
        print(f"✓ Created {len(segments)} marketing segments")
        
        print("\n✅ Database seeded successfully!")
        print(f"   - {len(users)} users with realistic names")
        print(f"   - {len(products)} products")
        print(f"   - {len(orders)} orders")
        print(f"   - {len(order_items)} order items")
        print(f"   - {len(segments)} marketing segments:")
        for segment in segments:
            print(f"     • {segment.name}")

if __name__ == "__main__":
    seed_database()
