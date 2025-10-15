from __future__ import annotations
from typing import Dict, Any, Optional
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)

# Chain-specific carbon factors (kg CO2 per transaction)
# Based on consensus mechanism and network efficiency
CHAIN_CARBON_FACTORS = {
    1: 0.085,      # Ethereum Mainnet (post-merge PoS)
    137: 0.00079,  # Polygon (PoS, highly efficient)
    56: 0.0004,    # BSC (PoA)
    42161: 0.001,  # Arbitrum (L2)
    10: 0.001,     # Optimism (L2)
    8453: 0.001,   # Base (L2)
    1337: 0.0,     # Local testnet (no real emissions)
    5: 0.0,        # Goerli testnet
    11155111: 0.0, # Sepolia testnet
}

# Carbon offset providers and their rates (USD per kg CO2)
OFFSET_PROVIDERS = {
    "klimadao": {"rate_per_kg": 0.015, "blockchain_native": True},
    "patch": {"rate_per_kg": 0.012, "blockchain_native": False},
    "nori": {"rate_per_kg": 0.020, "blockchain_native": True},
    "default": {"rate_per_kg": 0.015, "blockchain_native": False}
}


def estimate_tx_carbon(chain_id: int, tx_hash: str, gas_used: Optional[int] = None) -> Dict[str, Any]:
    """
    Estimate carbon footprint of a blockchain transaction.
    
    Args:
        chain_id: Blockchain chain ID
        tx_hash: Transaction hash
        gas_used: Actual gas used (optional, for more accurate estimation)
    
    Returns:
        Dict containing carbon estimate and methodology
    """
    # Get chain-specific factor
    base_factor = CHAIN_CARBON_FACTORS.get(chain_id, 0.001)  # Default conservative estimate
    
    # Adjust for actual gas usage if provided
    if gas_used:
        # Scale based on gas (typical tx uses ~21000 gas for simple transfer, ~100000 for contracts)
        gas_factor = gas_used / 100000.0  # Normalize to typical contract interaction
        estimated_kg = base_factor * gas_factor
    else:
        # Use base factor for average transaction
        estimated_kg = base_factor
    
    # Get chain name
    chain_names = {
        1: "Ethereum",
        137: "Polygon",
        56: "BSC",
        42161: "Arbitrum",
        10: "Optimism",
        8453: "Base",
        1337: "Local",
    }
    chain_name = chain_names.get(chain_id, f"Chain {chain_id}")
    
    logger.info(f"Carbon estimate for {tx_hash} on {chain_name}: {estimated_kg:.6f} kg CO2")
    
    return {
        "chain_id": chain_id,
        "chain_name": chain_name,
        "tx_hash": tx_hash,
        "estimate_kg": round(estimated_kg, 6),
        "gas_used": gas_used,
        "method": "chain-specific-factor",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "notes": f"Based on {chain_name} consensus mechanism and network efficiency"
    }


def offset_carbon(user_id: int, amount_kg: float, provider: str = "default", 
                  metadata: Optional[Dict] = None) -> Dict[str, Any]:
    """
    Calculate offset cost and record offset intent.
    
    Args:
        user_id: User ID requesting offset
        amount_kg: Amount of CO2 to offset in kilograms
        provider: Carbon offset provider
        metadata: Additional metadata (project ID, tx details, etc.)
    
    Returns:
        Dict containing offset details and estimated cost
    """
    if amount_kg <= 0:
        raise ValueError("Offset amount must be positive")
    
    # Get provider info
    provider_info = OFFSET_PROVIDERS.get(provider, OFFSET_PROVIDERS["default"])
    
    # Calculate cost
    estimated_cost_usd = amount_kg * provider_info["rate_per_kg"]
    
    # Generate offset record
    offset_record = {
        "user_id": user_id,
        "offseted_kg": round(amount_kg, 6),
        "provider": provider,
        "estimated_cost_usd": round(estimated_cost_usd, 2),
        "blockchain_native": provider_info["blockchain_native"],
        "status": "pending",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "metadata": metadata or {}
    }
    
    logger.info(f"Carbon offset intent recorded: {amount_kg} kg CO2 for user {user_id} via {provider}")
    
    return offset_record


def calculate_cumulative_footprint(transactions: list[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Calculate cumulative carbon footprint for multiple transactions.
    
    Args:
        transactions: List of transaction dicts with chain_id and gas_used
    
    Returns:
        Dict with total footprint and breakdown by chain
    """
    total_kg = 0.0
    by_chain = {}
    
    for tx in transactions:
        chain_id = tx.get("chain_id")
        gas_used = tx.get("gas_used")
        tx_hash = tx.get("tx_hash", "unknown")
        
        estimate = estimate_tx_carbon(chain_id, tx_hash, gas_used)
        kg = estimate["estimate_kg"]
        total_kg += kg
        
        chain_name = estimate["chain_name"]
        if chain_name not in by_chain:
            by_chain[chain_name] = {"count": 0, "total_kg": 0.0}
        
        by_chain[chain_name]["count"] += 1
        by_chain[chain_name]["total_kg"] += kg
    
    return {
        "total_kg": round(total_kg, 6),
        "total_transactions": len(transactions),
        "by_chain": {k: {"count": v["count"], "total_kg": round(v["total_kg"], 6)} 
                     for k, v in by_chain.items()},
        "equivalent_trees_needed": int(total_kg / 21),  # A tree absorbs ~21kg CO2/year
        "equivalent_km_driven": int(total_kg / 0.12),   # Avg car emits ~0.12kg CO2/km
    }


def get_offset_recommendations(total_kg: float) -> Dict[str, Any]:
    """
    Get recommendations for carbon offsetting.
    
    Args:
        total_kg: Total carbon footprint in kg
    
    Returns:
        Dict with provider recommendations and costs
    """
    recommendations = []
    
    for provider_name, provider_info in OFFSET_PROVIDERS.items():
        if provider_name == "default":
            continue
        
        cost = total_kg * provider_info["rate_per_kg"]
        recommendations.append({
            "provider": provider_name,
            "cost_usd": round(cost, 2),
            "blockchain_native": provider_info["blockchain_native"],
            "rate_per_kg": provider_info["rate_per_kg"]
        })
    
    # Sort by cost
    recommendations.sort(key=lambda x: x["cost_usd"])
    
    return {
        "total_kg": round(total_kg, 6),
        "recommendations": recommendations,
        "cheapest_option": recommendations[0] if recommendations else None,
        "blockchain_native_options": [r for r in recommendations if r["blockchain_native"]]
    }
