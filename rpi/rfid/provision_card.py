#!/usr/bin/env python3
import sys
from rfid_reader import get_reader

BLOCK = 8


def main():
    if len(sys.argv) != 2 or len(sys.argv[1]) != 32:
        print("Uso: python3 provision_card.py <token_hex_de_32_caracteres>")
        sys.exit(1)

    token_bytes = bytes.fromhex(sys.argv[1])

    print("Aproxime o cartão a ser gravado...")
    with get_reader(BLOCK) as reader:
        ok = reader.aguardar_e_escrever_bloco(BLOCK, token_bytes)
        print("Cartão gravado com sucesso." if ok else "Falha ao gravar o cartão.")


if __name__ == "__main__":
    main()