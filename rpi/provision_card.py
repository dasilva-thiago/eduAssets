#!/usr/bin/env python3
import sys
import time
import Rfid as MFRC522

BLOCK = 8
DEFAULT_KEY = [0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF]


def main():
    if len(sys.argv) != 2 or len(sys.argv[1]) != 32:
        print("Uso: python3 provision_card.py <token_hex_de_32_caracteres>")
        print("(o token é o valor retornado por POST /usuarios/:id/rfid-token)")
        sys.exit(1)

    token_bytes = list(bytes.fromhex(sys.argv[1])) 

    reader = MFRC522.Rfid()
    print("Aproxime o cartão a ser gravado...")

    try:
        while True:
            status, _ = reader.MFRC522_Request(reader.PICC_REQIDL)
            if status == reader.MI_OK:
                status, uid = reader.MFRC522_Anticoll()
                if status != reader.MI_OK:
                    continue

                if reader.MFRC522_SelectTag(uid) != reader.MI_OK:
                    continue

                if reader.MFRC522_Auth(reader.PICC_AUTHENT1A, BLOCK, DEFAULT_KEY, uid) != reader.MI_OK:
                    print("Falha na autenticação.")
                    break

                if reader.MFRC522_Write(BLOCK, token_bytes) == reader.MI_OK:
                    print("Cartão gravado com sucesso.")
                else:
                    print("Falha ao gravar o cartão.")

                reader.MFRC522_StopCrypto1()
                break

            time.sleep(0.1)
    finally:
        reader.close()


if __name__ == "__main__":
    main()