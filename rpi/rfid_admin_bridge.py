#!/usr/bin/env python3
import os
import time
import requests
import sound
from rfid_reader import get_reader

BLOCK = 8
BACKEND_URL = os.environ.get("EDUASSETS_BACKEND_URL", "http://localhost:3000")
BRIDGE_SECRET = os.environ.get("RFID_BRIDGE_SECRET")

if not BRIDGE_SECRET:
    raise SystemExit("RFID_BRIDGE_SECRET não definida no ambiente do serviço.")


def enviar_scan(token_hex: str) -> None:
    try:
        resp = requests.post(
            f"{BACKEND_URL}/auth/rfid",
            json={"token": token_hex},
            headers={"X-RFID-Bridge-Secret": BRIDGE_SECRET},
            timeout=3,
        )
        if resp.status_code == 204:
            print("Login por cartão autorizado.")
            sound.tocar_sucesso()
        elif resp.status_code == 401:
            print("Cartão não reconhecido.")
            sound.tocar_erro()
        else:
            print(f"Resposta inesperada do backend: {resp.status_code}")
            sound.tocar_erro()
    except requests.RequestException as e:
        print(f"Erro ao contatar o backend: {e}")
        sound.tocar_erro()


def main():
    backend_nome = os.environ.get("RFID_BACKEND", "spi")
    print(f"Serviço RFID eduAssets iniciado (backend: {backend_nome}).")

    with get_reader(BLOCK) as reader:
        while True:
            data = reader.aguardar_e_ler_bloco(BLOCK)
            sound.tocar_deteccao()

            if data is not None:
                enviar_scan(data.hex())
            else:
                print("Falha ao autenticar/ler o cartão.")
                sound.tocar_erro()

            time.sleep(1.5)  # debounce físico


if __name__ == "__main__":
    main()