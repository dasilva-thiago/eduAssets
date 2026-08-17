#!/usr/bin/env python3
import os
import time
import requests
import Rfid as MFRC522
import sound

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

                # Cartão fisicamente detectado — feedback imediato, antes de
                # qualquer autenticação ou chamada de rede.
                sound.tocar_deteccao()

                if reader.MFRC522_SelectTag(uid) != reader.MI_OK:
                    sound.tocar_erro()
                    time.sleep(0.5)
                    continue

                status = reader.MFRC522_Auth(reader.PICC_AUTHENT1A, BLOCK, DEFAULT_KEY, uid)
                if status != reader.MI_OK:
                    print("Falha na autenticação do cartão.")
                    sound.tocar_erro()
                    time.sleep(0.5)
                    continue

                status, data = reader.MFRC522_Read(BLOCK)
                reader.MFRC522_StopCrypto1()
                reader.MFRC522_Halt()

                if status == reader.MI_OK:
                    token_hex = bytes(data).hex()
                    enviar_scan(token_hex)
                else:
                    print("Falha ao ler o bloco do cartão.")
                    sound.tocar_erro()

                time.sleep(1.5)  # debounce físico — evita re-leitura enquanto o cartão está encostado

            time.sleep(0.1)

    except KeyboardInterrupt:
        print("Encerrando serviço RFID.")
    finally:
        reader.close()


if __name__ == "__main__":
    main()