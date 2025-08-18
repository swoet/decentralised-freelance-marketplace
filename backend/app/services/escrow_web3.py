import os
from web3 import Web3
import json
from typing import List, Any

ETH_NODE_URL = os.getenv('ETH_NODE_URL', 'http://127.0.0.1:8545')
FACTORY_ADDRESS = os.getenv('ESCROW_FACTORY_ADDRESS')
FACTORY_ABI_PATH = os.getenv('ESCROW_FACTORY_ABI', 'contracts/abi/EscrowFactory.json')
ESCROW_ABI_PATH = os.getenv('ESCROW_FACTORY_ABI', 'contracts/abi/Escrow.json')

w3 = Web3(Web3.HTTPProvider(ETH_NODE_URL))

# Initialize contract ABIs and factory contract conditionally
FACTORY_ABI = None
ESCROW_ABI = None
factory = None

try:
    if os.path.exists(FACTORY_ABI_PATH):
        with open(FACTORY_ABI_PATH) as f:
            FACTORY_ABI = json.load(f)
    if os.path.exists(ESCROW_ABI_PATH):
        with open(ESCROW_ABI_PATH) as f:
            ESCROW_ABI = json.load(f)
    if FACTORY_ABI and FACTORY_ADDRESS:
        factory = w3.eth.contract(address=FACTORY_ADDRESS, abi=FACTORY_ABI)
except Exception as e:
    print(f"Warning: Could not load contract ABIs: {e}")

def deploy_escrow(client: str, freelancer: str, milestone_descriptions: List[str], milestone_amounts: List[int], private_key: str) -> str:
    if not factory:
        raise RuntimeError("Escrow factory not initialized. Check contract configuration.")
    try:
        tx = factory.functions.createEscrow(
            client, freelancer, milestone_descriptions, milestone_amounts
        ).build_transaction({
            'from': client,
            'nonce': w3.eth.get_transaction_count(client),
            'gas': 3000000,
            'gasPrice': w3.to_wei('20', 'gwei'),
        })
        signed = w3.eth.account.sign_transaction(tx, private_key)
        tx_hash = w3.eth.send_raw_transaction(signed.rawTransaction)
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
        # Assume event emits new escrow address
        logs = factory.events.EscrowCreated().process_receipt(receipt)
        escrow_address = logs[0]['args']['escrow'] if logs else None
        return escrow_address
    except Exception as e:
        # Add logging here
        raise RuntimeError(f"Failed to deploy escrow: {e}")

def get_escrow_status(escrow_address: str) -> Any:
    if not ESCROW_ABI:
        raise RuntimeError("Escrow ABI not loaded. Check contract configuration.")
    try:
        escrow = w3.eth.contract(address=escrow_address, abi=ESCROW_ABI)
        status = escrow.functions.status().call()
        return status
    except Exception as e:
        raise RuntimeError(f"Failed to get escrow status: {e}")

def release_milestone(escrow_address: str, milestone_id: int, client_private_key: str) -> str:
    if not ESCROW_ABI:
        raise RuntimeError("Escrow ABI not loaded. Check contract configuration.")
    try:
        escrow = w3.eth.contract(address=escrow_address, abi=ESCROW_ABI)
        client = w3.eth.account.privateKeyToAccount(client_private_key).address
        tx = escrow.functions.releaseMilestone(milestone_id).build_transaction({
            'from': client,
            'nonce': w3.eth.get_transaction_count(client),
            'gas': 200000,
            'gasPrice': w3.to_wei('20', 'gwei'),
        })
        signed = w3.eth.account.sign_transaction(tx, client_private_key)
        tx_hash = w3.eth.send_raw_transaction(signed.rawTransaction)
        return tx_hash.hex()
    except Exception as e:
        raise RuntimeError(f"Failed to release milestone: {e}")

def raise_dispute(escrow_address: str, user_private_key: str) -> str:
    if not ESCROW_ABI:
        raise RuntimeError("Escrow ABI not loaded. Check contract configuration.")
    try:
        escrow = w3.eth.contract(address=escrow_address, abi=ESCROW_ABI)
        user = w3.eth.account.privateKeyToAccount(user_private_key).address
        tx = escrow.functions.raiseDispute().build_transaction({
            'from': user,
            'nonce': w3.eth.get_transaction_count(user),
            'gas': 200000,
            'gasPrice': w3.to_wei('20', 'gwei'),
        })
        signed = w3.eth.account.sign_transaction(tx, user_private_key)
        tx_hash = w3.eth.send_raw_transaction(signed.rawTransaction)
        return tx_hash.hex()
    except Exception as e:
        raise RuntimeError(f"Failed to raise dispute: {e}")

def resolve_dispute(escrow_address: str, payout: int, owner_private_key: str) -> str:
    if not ESCROW_ABI:
        raise RuntimeError("Escrow ABI not loaded. Check contract configuration.")
    try:
        escrow = w3.eth.contract(address=escrow_address, abi=ESCROW_ABI)
        owner = w3.eth.account.privateKeyToAccount(owner_private_key).address
        tx = escrow.functions.resolveDispute(payout).build_transaction({
            'from': owner,
            'nonce': w3.eth.get_transaction_count(owner),
            'gas': 200000,
            'gasPrice': w3.to_wei('20', 'gwei'),
        })
        signed = w3.eth.account.sign_transaction(tx, owner_private_key)
        tx_hash = w3.eth.send_raw_transaction(signed.rawTransaction)
        return tx_hash.hex()
    except Exception as e:
        raise RuntimeError(f"Failed to resolve dispute: {e}")

# Placeholder functions for backward compatibility
def create_escrow_contract(*args, **kwargs):
    raise NotImplementedError("create_escrow_contract not implemented yet")

def release_escrow(*args, **kwargs):
    raise NotImplementedError("release_escrow not implemented yet")

def get_escrow_contracts(*args, **kwargs):
    raise NotImplementedError("get_escrow_contracts not implemented yet")

# Functions needed by web3 API
def deploy_escrow_contract(data: dict, user):
    # Extract data from the request
    client = data.get('client')
    freelancer = data.get('freelancer')
    milestone_descriptions = data.get('milestone_descriptions', [])
    milestone_amounts = data.get('milestone_amounts', [])
    private_key = data.get('private_key')
    
    if not all([client, freelancer, private_key]):
        raise ValueError("Missing required parameters: client, freelancer, private_key")
    
    return deploy_escrow(client, freelancer, milestone_descriptions, milestone_amounts, private_key)

def get_contract_status(contract_address: str, user):
    return get_escrow_status(contract_address) 