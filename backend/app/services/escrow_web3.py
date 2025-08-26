from typing import List, Any, Optional

from web3 import Web3

from app.services.chain_registry import registry
from app.core.db import SessionLocal
from app.models.token import TokenTransaction


def _sign_and_send(w3: Web3, tx: dict, private_key: str) -> str:
    signed = w3.eth.account.sign_transaction(tx, private_key)
    tx_hash = w3.eth.send_raw_transaction(signed.rawTransaction)
    return tx_hash.hex()


def _build_tx_params(w3: Web3, from_addr: str) -> dict:
    """Build generic tx params with broad chain compatibility (gasPrice-based)."""
    return {
        "from": from_addr,
        "nonce": w3.eth.get_transaction_count(from_addr),
        "gas": 3_000_000,
        "gasPrice": w3.to_wei("20", "gwei"),
    }


def deploy_escrow(
    client: str,
    freelancer: str,
    milestone_descriptions: List[str],
    milestone_amounts: List[int],
    private_key: str,
    chain_id: Optional[int] = None,
    user_id: Optional[str] = None,
) -> str:
    factory = registry.get_factory_contract(chain_id)
    w3 = registry.get_web3(chain_id)
    from_addr = w3.eth.account.from_key(private_key).address

    try:
        tx = factory.functions.createEscrow(
            client, freelancer, milestone_descriptions, milestone_amounts
        ).build_transaction(_build_tx_params(w3, from_addr))
        tx_hash = _sign_and_send(w3, tx, private_key)
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
        # If confirmations > 1, optionally wait more blocks (lightweight approach)
        confirmations = registry.get_confirmations(chain_id)
        if confirmations > 1:
            target_block = receipt.blockNumber + confirmations - 1
            while w3.eth.block_number < target_block:
                w3.provider.make_request("evm_mine", []) if hasattr(w3.provider, "make_request") else None
        # Parse event for escrow address if available
        try:
            logs = factory.events.EscrowCreated().process_receipt(receipt)
            escrow_address = logs[0]["args"].get("escrow") if logs else None
        except Exception:
            escrow_address = None
        # Log transaction if user_id provided
        try:
            if user_id:
                db = SessionLocal()
                tt = TokenTransaction(
                    user_id=user_id,
                    chain_id=registry.get_config(chain_id).chain_id,
                    tx_hash=tx_hash,
                    tx_type="escrow_deploy",
                    amount=sum(milestone_amounts) if milestone_amounts else None,
                    token_address=None,
                    status="confirmed",
                    metadata={"escrow_address": escrow_address or "", "client": client, "freelancer": freelancer},
                )
                db.add(tt)
                db.commit()
                db.close()
        except Exception:
            pass
        # Fallback: if factory returns via return data (less common)
        return escrow_address or ""
    except Exception as e:
        raise RuntimeError(f"Failed to deploy escrow: {e}")


def get_escrow_status(escrow_address: str, chain_id: Optional[int] = None) -> Any:
    try:
        escrow = registry.get_escrow_contract(chain_id, escrow_address)
        return escrow.functions.status().call()
    except Exception as e:
        raise RuntimeError(f"Failed to get escrow status: {e}")


def release_milestone(
    escrow_address: str, milestone_id: int, client_private_key: str, chain_id: Optional[int] = None, user_id: Optional[str] = None
) -> str:
    try:
        w3 = registry.get_web3(chain_id)
        escrow = registry.get_escrow_contract(chain_id, escrow_address)
        client = w3.eth.account.from_key(client_private_key).address
        tx = escrow.functions.releaseMilestone(milestone_id).build_transaction(
            _build_tx_params(w3, client)
        )
        tx_hash = _sign_and_send(w3, tx, client_private_key)
        # Log pending transaction if user_id provided
        try:
            if user_id:
                db = SessionLocal()
                tt = TokenTransaction(
                    user_id=user_id,
                    chain_id=registry.get_config(chain_id).chain_id,
                    tx_hash=tx_hash,
                    tx_type="milestone_release",
                    amount=None,
                    token_address=None,
                    status="pending",
                    metadata={"escrow_address": escrow_address, "milestone_id": milestone_id},
                )
                db.add(tt)
                db.commit()
                db.close()
        except Exception:
            pass
        return tx_hash
    except Exception as e:
        raise RuntimeError(f"Failed to release milestone: {e}")


def raise_dispute(escrow_address: str, user_private_key: str, chain_id: Optional[int] = None) -> str:
    try:
        w3 = registry.get_web3(chain_id)
        escrow = registry.get_escrow_contract(chain_id, escrow_address)
        user = w3.eth.account.from_key(user_private_key).address
        tx = escrow.functions.raiseDispute().build_transaction(_build_tx_params(w3, user))
        return _sign_and_send(w3, tx, user_private_key)
    except Exception as e:
        raise RuntimeError(f"Failed to raise dispute: {e}")


def resolve_dispute(
    escrow_address: str, payout: int, owner_private_key: str, chain_id: Optional[int] = None
) -> str:
    try:
        w3 = registry.get_web3(chain_id)
        escrow = registry.get_escrow_contract(chain_id, escrow_address)
        owner = w3.eth.account.from_key(owner_private_key).address
        tx = escrow.functions.resolveDispute(payout).build_transaction(_build_tx_params(w3, owner))
        return _sign_and_send(w3, tx, owner_private_key)
    except Exception as e:
        raise RuntimeError(f"Failed to resolve dispute: {e}")


# Functions used by web3 API layer

def deploy_escrow_contract(data: dict, user):
    client = data.get("client")
    freelancer = data.get("freelancer")
    milestone_descriptions = data.get("milestone_descriptions", [])
    milestone_amounts = data.get("milestone_amounts", [])
    private_key = data.get("private_key")
    chain_id = data.get("chain_id")

    if not all([client, freelancer, private_key]):
        raise ValueError("Missing required parameters: client, freelancer, private_key")

    return deploy_escrow(
        client,
        freelancer,
        milestone_descriptions,
        milestone_amounts,
        private_key,
        chain_id,
        str(getattr(user, "id", "")) or None,
    )


def get_contract_status(contract_address: str, user, chain_id: Optional[int] = None):
    return get_escrow_status(contract_address, chain_id)