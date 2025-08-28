import json
import os
from dataclasses import dataclass
from typing import Dict, Optional, Any, List

from web3 import Web3
try:
    from web3.middleware import geth_poa_middleware
except ImportError:
    try:
        from web3.middleware.geth_poa import geth_poa_middleware
    except ImportError:
        # For very old web3 versions or if middleware is not available
        geth_poa_middleware = None

from app.core.config import settings


@dataclass
class ChainConfig:
    name: str
    chain_id: int
    rpc_url: str
    explorer: Optional[str] = None
    confirmations: int = 1


class ChainRegistry:
    """
    Central registry to manage multi-chain configuration, Web3 providers, and contract ABIs/addresses.
    Reads from CHAIN_REGISTRY_JSON or falls back to legacy single-chain WEB3_PROVIDER_URI.
    Supports per-chain factory address via ESCROW_FACTORY_ADDRESS_<CHAINID> with legacy fallback ESCROW_FACTORY_ADDRESS.
    """

    def __init__(self) -> None:
        self._web3_by_chain: Dict[int, Web3] = {}
        self._configs: Dict[int, ChainConfig] = {}
        self._factory_abi: Optional[Any] = None
        self._escrow_abi: Optional[Any] = None

        self._load_configs()
        self._load_abis()

    def _load_configs(self) -> None:
        raw = os.getenv("CHAIN_REGISTRY_JSON", "").strip()
        configs: List[ChainConfig] = []
        if raw:
            try:
                parsed = json.loads(raw)
                if isinstance(parsed, list):
                    for item in parsed:
                        try:
                            configs.append(
                                ChainConfig(
                                    name=item.get("name") or f"chain-{item.get('chainId')}",
                                    chain_id=int(item.get("chainId")),
                                    rpc_url=item.get("rpcUrl") or item.get("rpc") or settings.WEB3_PROVIDER_URI,
                                    explorer=item.get("explorer") or item.get("explorerUrl"),
                                    confirmations=int(item.get("confirmations") or 1),
                                )
                            )
                        except Exception:
                            # skip invalid entry
                            continue
            except Exception:
                # invalid JSON; fallback below
                pass

        if not configs:
            # Fallback single chain using legacy WEB3_PROVIDER_URI
            configs = [
                ChainConfig(
                    name="default",
                    chain_id=int(os.getenv("DEFAULT_CHAIN_ID", 1337)),
                    rpc_url=settings.WEB3_PROVIDER_URI,
                    explorer=None,
                    confirmations=1,
                )
            ]

        self._configs = {c.chain_id: c for c in configs}

    def _load_abis(self) -> None:
        # Factory ABI path from settings/env; Escrow ABI from ESCROW_ABI env or default path
        factory_abi_path = settings.ESCROW_FACTORY_ABI or os.getenv("ESCROW_FACTORY_ABI", "contracts/abi/EscrowFactory.json")
        escrow_abi_path = os.getenv("ESCROW_ABI", "contracts/abi/Escrow.json")
        try:
            if os.path.exists(factory_abi_path):
                with open(factory_abi_path, "r", encoding="utf-8") as f:
                    self._factory_abi = json.load(f)
        except Exception:
            self._factory_abi = None
        try:
            if os.path.exists(escrow_abi_path):
                with open(escrow_abi_path, "r", encoding="utf-8") as f:
                    self._escrow_abi = json.load(f)
        except Exception:
            self._escrow_abi = None

    # Public API

    def get_config(self, chain_id: Optional[int]) -> ChainConfig:
        if chain_id is None:
            # Choose first configured chain as default
            return next(iter(self._configs.values()))
        if chain_id not in self._configs:
            raise ValueError(f"Unsupported chain_id: {chain_id}")
        return self._configs[chain_id]

    def get_web3(self, chain_id: Optional[int]) -> Web3:
        cfg = self.get_config(chain_id)
        if cfg.chain_id in self._web3_by_chain:
            return self._web3_by_chain[cfg.chain_id]
        w3 = Web3(Web3.HTTPProvider(cfg.rpc_url))
        # Add POA middleware for chains like Polygon, BSC, etc. if available
        if geth_poa_middleware is not None:
            w3.middleware_onion.inject(geth_poa_middleware, layer=0)
        self._web3_by_chain[cfg.chain_id] = w3
        return w3

    def get_factory_address(self, chain_id: Optional[int]) -> Optional[str]:
        cfg = self.get_config(chain_id)
        # Per-chain override via ENV: ESCROW_FACTORY_ADDRESS_<CHAINID>
        per_chain = os.getenv(f"ESCROW_FACTORY_ADDRESS_{cfg.chain_id}")
        if per_chain:
            return Web3.to_checksum_address(per_chain)
        # Legacy single env setting fallback
        addr = settings.ESCROW_FACTORY_ADDRESS or os.getenv("ESCROW_FACTORY_ADDRESS", "")
        return Web3.to_checksum_address(addr) if addr else None

    def get_factory_contract(self, chain_id: Optional[int]):
        address = self.get_factory_address(chain_id)
        if not address:
            raise RuntimeError("Escrow factory address not configured. Set ESCROW_FACTORY_ADDRESS_<CHAINID> or ESCROW_FACTORY_ADDRESS.")
        if not self._factory_abi:
            raise RuntimeError("Escrow factory ABI not loaded. Set ESCROW_FACTORY_ABI to a valid ABI JSON path.")
        w3 = self.get_web3(chain_id)
        return w3.eth.contract(address=address, abi=self._factory_abi)

    def get_escrow_contract(self, chain_id: Optional[int], address: str):
        if not self._escrow_abi:
            raise RuntimeError("Escrow ABI not loaded. Set ESCROW_ABI to a valid ABI JSON path.")
        w3 = self.get_web3(chain_id)
        return w3.eth.contract(address=Web3.to_checksum_address(address), abi=self._escrow_abi)

    def get_confirmations(self, chain_id: Optional[int]) -> int:
        return self.get_config(chain_id).confirmations


# Singleton instance for app usage
registry = ChainRegistry()