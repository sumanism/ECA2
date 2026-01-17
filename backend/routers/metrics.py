from fastapi import APIRouter, Depends
from sqlmodel import Session, select, func
from backend.models import User, Order, Product, OrderItem, CustomerMetrics, ProductSalesMetrics
from backend.database import get_session
from datetime import datetime, timedelta
from typing import Dict

router = APIRouter()

@router.get("/dashboard")
def get_dashboard_metrics(session: Session = Depends(get_session)):
    """Get dashboard overview metrics"""
    
    # Total customers
    total_customers = session.exec(select(func.count(User.id))).one()
    
    # Total revenue (30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    revenue_30d = session.exec(
        select(func.sum(Order.total_amount))
        .where(Order.order_date >= thirty_days_ago)
    ).one() or 0
    
    # Total orders
    total_orders = session.exec(select(func.count(Order.id))).one()
    
    # Average order value
    avg_order_value = session.exec(
        select(func.avg(Order.total_amount))
    ).one() or 0
    
    # Customer retention - count users with more than 1 order
    from sqlalchemy import case
    user_order_counts = session.exec(
        select(
            Order.user_id,
            func.count(Order.id).label('order_count')
        ).group_by(Order.user_id).having(func.count(Order.id) > 1)
    ).all()
    
    returning_customers = len(user_order_counts)
    
    return {
        "total_customers": total_customers,
        "revenue_30d": float(revenue_30d),
        "total_orders": total_orders,
        "average_order_value": float(avg_order_value),
        "returning_customers": returning_customers,
        "new_customers": total_customers - returning_customers
    }

@router.get("/customers/{user_id}/metrics")
def get_customer_metrics(user_id: str, session: Session = Depends(get_session)):
    """Get metrics for a specific customer"""
    user = session.get(User, user_id)
    if not user:
        return {"error": "User not found"}
    
    # Calculate metrics
    orders = session.exec(select(Order).where(Order.user_id == user_id)).all()
    
    lifetime_value = sum(order.total_amount for order in orders)
    avg_order_value = lifetime_value / len(orders) if orders else 0
    
    days_since_last_order = None
    if user.last_order_date:
        days_since_last_order = (datetime.utcnow() - user.last_order_date).days
    
    return {
        "user_id": user_id,
        "lifetime_value": lifetime_value,
        "average_order_value": avg_order_value,
        "days_since_last_order": days_since_last_order,
        "total_orders": len(orders)
    }

@router.get("/products/{product_id}/metrics")
def get_product_metrics(product_id: str, session: Session = Depends(get_session)):
    """Get metrics for a specific product"""
    product = session.get(Product, product_id)
    if not product:
        return {"error": "Product not found"}
    
    # Get order items for this product
    order_items = session.exec(
        select(OrderItem).where(OrderItem.product_id == product_id)
    ).all()
    
    total_units_sold = sum(item.quantity for item in order_items)
    total_orders = len(set(item.order_id for item in order_items))
    total_revenue = sum(item.quantity * item.unit_price for item in order_items)
    
    last_purchased_at = None
    if order_items:
        # Get the most recent order date
        order_ids = [item.order_id for item in order_items]
        orders = session.exec(
            select(Order).where(Order.id.in_(order_ids))
        ).all()
        if orders:
            last_purchased_at = max(order.order_date for order in orders)
    
    return {
        "product_id": product_id,
        "total_units_sold": total_units_sold,
        "total_orders": total_orders,
        "total_revenue": total_revenue,
        "last_purchased_at": last_purchased_at.isoformat() if last_purchased_at else None
    }

@router.get("/top-products")
def get_top_products(limit: int = 10, session: Session = Depends(get_session)):
    """Get top selling products"""
    # This is a simplified version - in production, use proper aggregation
    products = session.exec(select(Product)).all()
    product_metrics = []
    
    for product in products:
        order_items = session.exec(
            select(OrderItem).where(OrderItem.product_id == product.id)
        ).all()
        
        total_sold = sum(item.quantity for item in order_items)
        revenue = sum(item.quantity * item.unit_price for item in order_items)
        
        product_metrics.append({
            "product_id": product.id,
            "product_name": product.name,
            "units_sold": total_sold,
            "revenue": revenue
        })
    
    # Sort by units sold
    product_metrics.sort(key=lambda x: x["units_sold"], reverse=True)
    return product_metrics[:limit]
