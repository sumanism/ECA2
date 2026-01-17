from typing import Optional
from datetime import datetime
from sqlmodel import SQLModel, Field
import uuid
from sqlalchemy import Column, JSON

# =====================
# AUTHENTICATION
# =====================

class AdminUser(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    email: str = Field(index=True, unique=True)
    hashed_password: str
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

# =====================
# CORE TRANSACTIONAL TABLES
# =====================

class User(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    email: str = Field(index=True, unique=True)
    phone: Optional[str] = None

    first_name: str
    last_name: str

    marketing_opt_in: bool = True
    shipping_state: Optional[str] = None
    shipping_country: Optional[str] = None

    total_order_value: float = 0.0
    order_count: int = 0
    last_order_date: Optional[datetime] = None

    created_at: datetime = Field(default_factory=datetime.utcnow)


class Product(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    name: str
    category: str
    brand: str
    price: float
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Order(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    user_id: str = Field(foreign_key="user.id", index=True)

    order_date: datetime
    order_status: str
    total_amount: float
    currency: str
    channel: str
    coupon_code: Optional[str] = None

    created_at: datetime = Field(default_factory=datetime.utcnow)


class OrderItem(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    order_id: str = Field(foreign_key="order.id", index=True)
    product_id: str = Field(foreign_key="product.id", index=True)

    quantity: int
    unit_price: float


# =====================
# ANALYTICS / DERIVED TABLES
# =====================

class CustomerMetrics(SQLModel, table=True):
    user_id: str = Field(foreign_key="user.id", primary_key=True)

    lifetime_value: float
    average_order_value: float
    days_since_last_order: Optional[int] = None

    updated_at: datetime = Field(default_factory=datetime.utcnow)


class ProductSalesMetrics(SQLModel, table=True):
    product_id: str = Field(foreign_key="product.id", primary_key=True)

    total_units_sold: int
    total_orders: int
    total_revenue: float
    last_purchased_at: Optional[datetime] = None

    updated_at: datetime = Field(default_factory=datetime.utcnow)


class CustomerProductAffinity(SQLModel, table=True):
    user_id: str = Field(foreign_key="user.id", primary_key=True)
    product_id: str = Field(foreign_key="product.id", primary_key=True)

    purchase_count: int
    total_quantity: int
    last_purchased_at: Optional[datetime] = None


# =====================
# SEGMENTATION & CAMPAIGNS
# =====================

class Segment(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    name: str
    description: Optional[str] = None

    definition: dict = Field(sa_column=Column(JSON), default={})
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Campaign(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    segment_id: str = Field(foreign_key="segment.id")
    flow_id: Optional[str] = Field(default=None, foreign_key="flow.id")  # Optional flow association

    name: str
    description: Optional[str] = None
    status: str  # draft, active, paused, completed
    start_time: Optional[datetime] = None
    start_date: Optional[datetime] = None  # Campaign start date
    start_time_of_day: Optional[str] = None  # Time of day (e.g., "10:00", "14:30")

    created_at: datetime = Field(default_factory=datetime.utcnow)


class CampaignStep(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    campaign_id: str = Field(foreign_key="campaign.id")

    step_number: int
    subject: str
    body_text: str
    delay_days: int

    created_at: datetime = Field(default_factory=datetime.utcnow)


class CampaignDeliveryStats(SQLModel, table=True):
    campaign_id: str = Field(foreign_key="campaign.id", primary_key=True)

    emails_sent: int
    emails_delivered: int
    emails_failed: int
    avg_latency_ms: Optional[int] = None

    updated_at: datetime = Field(default_factory=datetime.utcnow)


# =====================
# FLOWS
# =====================

class Flow(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    segment_id: str = Field(foreign_key="segment.id", index=True)  # Flow targets a segment

    entry_condition_type: Optional[str] = None  # Event type: signup, first_purchase, cart_abandoned, order_completed, subscription_renewal
    entry_condition: Optional[str] = None  # Optional entry condition description
    name: Optional[str] = None  # Optional flow name

    created_at: datetime = Field(default_factory=datetime.utcnow)


class FlowStep(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    flow_id: str = Field(foreign_key="flow.id", index=True)

    step_type: str  # SEND_EMAIL | WAIT | SEND_PUSH | EXIT
    config: dict = Field(sa_column=Column(JSON), default={})  # JSON config for step
    next_step_id: Optional[str] = Field(foreign_key="flowstep.id", default=None)  # Link to next step
    step_order: int  # Order of step in flow

    created_at: datetime = Field(default_factory=datetime.utcnow)


class FlowDeliveryStats(SQLModel, table=True):
    flow_id: str = Field(foreign_key="flow.id", primary_key=True)

    emails_sent: int
    emails_delivered: int
    emails_failed: int
    avg_latency_ms: Optional[int] = None

    updated_at: datetime = Field(default_factory=datetime.utcnow)


# =====================
# AI AUDIT / TRACEABILITY
# =====================

class AIGenerationLog(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    prompt: str
    output: dict = Field(sa_column=Column(JSON), default={})

    generated_at: datetime = Field(default_factory=datetime.utcnow)
