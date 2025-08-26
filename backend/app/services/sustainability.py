from __future__ import annotations
from typing import Dict, Any

# Placeholder service: later integrate real providers or on-chain treasury flows

def estimate_tx_carbon(chain_id: int, tx_hash: str) -> Dict[str, Any]:
    # Very rough placeholder values; replace with chain-specific factors
    return {
        "chain_id": chain_id,
        "tx_hash": tx_hash,
        "estimate_kg": 0.001,
        "method": "placeholder-static-factor",
    }


def offset_carbon(user_id: int, amount_kg: float) -> Dict[str, Any]:
    # Record an offset intent; integrate with provider later
    return {"user_id": user_id, "offseted_kg": amount_kg, "provider": "placeholder"}
