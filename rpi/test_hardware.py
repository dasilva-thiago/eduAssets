#!/usr/bin/env python3
import Rfid as MFRC522


def main():
    print("Testando comunicação SPI com o MFRC522...")
    reader = MFRC522.Rfid()
    version = reader.Read_MFRC522(reader.VersionReg)
    print(f"VersionReg = 0x{version:02X}")

    if version in (0x91, 0x92):
        print("OK — leitor respondendo corretamente via SPI.")
    elif version in (0x00, 0xFF):
        print("SEM RESPOSTA — revise fiação, permissões (grupo 'spi') e se dtparam=spi=on está no arquivo certo.")
    else:
        print("Resposta inesperada (pode ser um clone do chip, mas está respondendo — normal).")

    reader.close()


if __name__ == "__main__":
    main()