#!/usr/bin/env python3
"""Interface comum de leitor RFID, independente do hardware de transporte.

Permite trocar entre leitura via SPI nativo (Raspberry Pi, GPIO) e via
Arduino Nano conectado por USB, sem que o restante
do código (rfid_admin_bridge.py, provision_card.py) precise saber qual
dos dois está em uso.

Selecionado via variável de ambiente RFID_BACKEND:
  RFID_BACKEND=spi     -> usa Rfid.py (SPI direto, ex: Raspberry Pi)
  RFID_BACKEND=serial  -> usa serial_rfid_reader.py (Arduino Nano via USB)
"""
import os
from abc import ABC, abstractmethod
from typing import Optional

class RfidReaderBase(ABC):
    @abstractmethod
    def aguardar_e_ler_bloco(self, bloco: int, timeout_s: Optional[float] = None) -> Optional[bytes]:
        raise NotImplementedError

    @abstractmethod
    def aguardar_e_escrever_bloco(self, bloco: int, dados: bytes, timeout_s: float = 15.0) -> bool:
        raise NotImplementedError

    @abstractmethod
    def close(self) -> None:
        raise NotImplementedError

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()


def get_reader(bloco_padrao: int = 8) -> RfidReaderBase:
    backend = os.environ.get("RFID_BACKEND", "spi").lower()

    if backend == "spi":
        from spi_rfid_reader import SpiRfidReader
        return SpiRfidReader()

    if backend == "serial":
        from serial_rfid_reader import SerialRfidReader
        porta = os.environ.get("RFID_SERIAL_PORT", "/dev/ttyUSB0")
        return SerialRfidReader(porta)

    raise ValueError(f"RFID_BACKEND inválido: '{backend}' (use 'spi' ou 'serial')")