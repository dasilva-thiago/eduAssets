#!/usr/bin/env python3
"""Backend serial (Arduino Nano via USB) para a interface RfidReaderBase."""
import time
from typing import Optional
import serial
from rfid_reader import RfidReaderBase

class SerialRfidReader(RfidReaderBase):
    def __init__(self, porta: str, baudrate: int = 115200):
        self._ser = serial.Serial(porta, baudrate, timeout=1)
        time.sleep(2)

    def aguardar_e_ler_bloco(self, bloco: int, timeout_s: Optional[float] = None) -> Optional[bytes]:
        inicio = time.time()
        while True:
            if timeout_s and (time.time() - inicio) > timeout_s:
                return None
                
            linha = self._ser.readline().decode("utf-8", errors="ignore").strip()
            if not linha:
                continue

            if linha == "CARDERR":
                return None

            if linha.startswith("CARD:"):
                hex_str = linha[len("CARD:"):]
                try:
                    return bytes.fromhex(hex_str)
                except ValueError:
                    return None

    def aguardar_e_escrever_bloco(self, bloco: int, dados: bytes, timeout_s: float = 15.0) -> bool:
        if len(dados) != 16:
            raise ValueError("dados deve ter exatamente 16 bytes")

        self._ser.reset_input_buffer()
        comando = f"WRITE:{dados.hex()}\n"
        self._ser.write(comando.encode("utf-8"))

        inicio = time.time()
        while time.time() - inicio < timeout_s:
            linha = self._ser.readline().decode("utf-8", errors="ignore").strip()
            if linha == "WRITEOK":
                return True
            if linha == "WRITEERR":
                return False

        return False

    def close(self) -> None:
        self._ser.close()