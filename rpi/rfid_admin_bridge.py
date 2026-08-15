#!/usr/bin/env python3
import os
import time
import requests
import Rfid as MFRC522

BLOCK = 8
DEFAULT_KEY = [0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF]

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
        elif resp.status_code == 401:
            print("Cartão não reconhecido.")
        else:
            print(f"Resposta inesperada do backend: {resp.status_code}")
    except requests.RequestException as e:
        print(f"Erro ao contatar o backend: {e}")


def main():
    print("Serviço RFID eduAssets iniciado.")
    reader = MFRC522.Rfid()

    try:
        while True:
            status, _ = reader.MFRC522_Request(reader.PICC_REQIDL)

            if status == reader.MI_OK:
                status, uid = reader.MFRC522_Anticoll()
                if status != reader.MI_OK:
                    time.sleep(0.1)
                    continue

                if reader.MFRC522_SelectTag(uid) != reader.MI_OK:
                    time.sleep(0.5)
                    continue

                status = reader.MFRC522_Auth(reader.PICC_AUTHENT1A, BLOCK, DEFAULT_KEY, uid)
                if status != reader.MI_OK:
                    print("Falha na autenticação do cartão.")
                    time.sleep(0.5)
                    continue

                status, data = reader.MFRC522_Read(BLOCK)
                reader.MFRC522_StopCrypto1()

                if status == reader.MI_OK:
                    token_hex = bytes(data).hex()
                    enviar_scan(token_hex)
                else:
                    print("Falha ao ler o bloco do cartão.")

                time.sleep(1.5)  

            time.sleep(0.1)

    except KeyboardInterrupt:
        print("Encerrando serviço RFID.")
    finally:
        reader.close()


if __name__ == "__main__":
    main()