from __future__ import annotations
from typing import Optional, Dict, Any
from web3 import Web3

from app.services.chain_registry import registry

# Minimal ERC20 ABI for common functions
ERC20_ABI = [
    {
        "constant": True,
        "inputs": [{"name": "account", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"name": "", "type": "uint256"}],
        "type": "function",
    },
    {
        "constant": True,
        "inputs": [],
        "name": "decimals",
        "outputs": [{"name": "", "type": "uint8"}],
        "type": "function",
    },
    {
        "constant": True,
        "inputs": [],
        "name": "symbol",
        "outputs": [{"name": "", "type": "string"}],
        "type": "function",
    },
    {
        "constant": False,
        "inputs": [
            {"name": "spender", "type": "address"},
            {"name": "amount", "type": "uint256"}
        ],
        "name": "approve",
        "outputs": [{"name": "", "type": "bool"}],
        "type": "function",
    },
    {
        "constant": True,
        "inputs": [
            {"name": "owner", "type": "address"},
            {"name": "spender", "type": "address"}
        ],
        "name": "allowance",
        "outputs": [{"name": "", "type": "uint256"}],
        "type": "function",
    },
]


def _get_token_address(chain_id: Optional[int]) -> Optional[str]:
    cfg = registry.get_config(chain_id)
    # Expect TOKEN_ADDRESS_<CHAINID> or TOKEN_ADDRESS legacy
    env_key = f"TOKEN_ADDRESS_{cfg.chain_id}"
    import os
    addr = os.getenv(env_key) or os.getenv("TOKEN_ADDRESS")
    if not addr:
        return None
    return Web3.to_checksum_address(addr)


def get_token_contract(chain_id: Optional[int]):
    addr = _get_token_address(chain_id)
    if not addr:
        raise RuntimeError("Token address not configured. Set TOKEN_ADDRESS_<CHAINID> or TOKEN_ADDRESS")
    w3 = registry.get_web3(chain_id)
    return w3.eth.contract(address=addr, abi=ERC20_ABI)


def get_token_balance(chain_id: Optional[int], address: str) -> Dict[str, Any]:
    w3 = registry.get_web3(chain_id)
    acct = Web3.to_checksum_address(address)
    token = get_token_contract(chain_id)
    raw = token.functions.balanceOf(acct).call()
    decimals = token.functions.decimals().call()
    symbol = token.functions.symbol().call()
    human = float(raw) / (10 ** decimals)
    return {
        "address": acct,
        "chain_id": registry.get_config(chain_id).chain_id,
        "symbol": symbol,
        "decimals": decimals,
        "balance": human,
        "raw": str(raw),
    }


def approve_token(chain_id: Optional[int], owner_private_key: str, spender: str, amount_wei: int) -> str:
    w3 = registry.get_web3(chain_id)
    token = get_token_contract(chain_id)
    owner_addr = w3.eth.account.from_key(owner_private_key).address
    tx = token.functions.approve(Web3.to_checksum_address(spender), int(amount_wei)).build_transaction({
        'from': owner_addr,
        'nonce': w3.eth.get_transaction_count(owner_addr),
        'gas': 100000,
        'gasPrice': w3.to_wei('20', 'gwei'),
    })
    signed = w3.eth.account.sign_transaction(tx, owner_private_key)
    tx_hash = w3.eth.send_raw_transaction(signed.rawTransaction)
    return tx_hash.hex()


def get_allowance(chain_id: Optional[int], owner: str, spender: str) -> Dict[str, Any]:
    token = get_token_contract(chain_id)
    raw = token.functions.allowance(Web3.to_checksum_address(owner), Web3.to_checksum_address(spender)).call()
    decimals = token.functions.decimals().call()
    symbol = token.functions.symbol().call()
    return {
        'allowance_raw': str(raw),
        'allowance': float(raw) / (10 ** decimals),
        'symbol': symbol,
        'decimals': decimals,
    }
