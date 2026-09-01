#!/usr/bin/env python3

import spidev
import time
import RPi.GPIO as GPIO

class Rfid:

    # Status
    MI_OK = 0
    MI_NOTAGERR = 1
    MI_ERR = 2

    # MFRC522 registers
    CommandReg = 0x01
    ComIEnReg = 0x02
    DivIEnReg = 0x03
    ComIrqReg = 0x04
    DivIrqReg = 0x05
    ErrorReg = 0x06
    Status1Reg = 0x07
    Status2Reg = 0x08
    FIFODataReg = 0x09
    FIFOLevelReg = 0x0A
    WaterLevelReg = 0x0B
    ControlReg = 0x0C
    BitFramingReg = 0x0D
    CollReg = 0x0E

    ModeReg = 0x11
    TxModeReg = 0x12
    RxModeReg = 0x13
    TxControlReg = 0x14
    TxASKReg = 0x15
    TxSelReg = 0x16

    CRCResultRegH = 0x21
    CRCResultRegL = 0x22

    TModeReg = 0x2A
    TPrescalerReg = 0x2B
    TReloadRegH = 0x2C
    TReloadRegL = 0x2D

    VersionReg = 0x37

    # Commands
    PCD_Idle = 0x00
    PCD_Transceive = 0x0C
    PCD_MFAuthent = 0x0E
    PCD_SoftReset = 0x0F
    PCD_CalcCRC = 0x03

    # PICC commands
    PICC_REQIDL = 0x26
    PICC_REQALL = 0x52
    PICC_ANTICOLL = 0x93
    PICC_SElECTTAG = 0x93
    PICC_AUTHENT1A = 0x60
    PICC_AUTHENT1B = 0x61
    PICC_READ = 0x30
    PICC_WRITE = 0xA0
    PICC_HALT = 0x50

    MAX_LEN = 16

    # Pino físico 22 = GPIO25, usado como RST do MFRC522 (numeração BOARD)
    RST_PIN = 22

    def __init__(self, bus=0, device=0, speed=1_000_000):
        GPIO.setmode(GPIO.BOARD)
        GPIO.setup(self.RST_PIN, GPIO.OUT)
        GPIO.output(self.RST_PIN, GPIO.HIGH)  # tira o chip do reset (ativo em LOW)
        time.sleep(0.05)  # tempo mínimo de estabilização após sair do reset

        try:
            self.spi = spidev.SpiDev()
            self.spi.open(bus, device)
            self.spi.max_speed_hz = speed
            self.spi.mode = 0
        except FileNotFoundError:
            raise RuntimeError(
                "SPI não disponível. Habilite em: sudo raspi-config -> "
                "Interface Options -> SPI -> Enable, depois reinicie o Pi."
            )

        self.MFRC522_Init()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()

    # ---------------------------------------------------------
    # SPI
    # ---------------------------------------------------------

    def Write_MFRC522(self, addr, val):
        self.spi.xfer2([
            (addr << 1) & 0x7E,
            val & 0xFF
        ])

    def Read_MFRC522(self, addr):
        result = self.spi.xfer2([
            ((addr << 1) & 0x7E) | 0x80,
            0x00
        ])
        return result[1]

    def SetBitMask(self, reg, mask):
        tmp = self.Read_MFRC522(reg)
        self.Write_MFRC522(reg, tmp | mask)

    def ClearBitMask(self, reg, mask):
        tmp = self.Read_MFRC522(reg)
        self.Write_MFRC522(reg, tmp & (~mask & 0xFF))

    # ---------------------------------------------------------
    # Inicialização
    # ---------------------------------------------------------

    def MFRC522_Init(self):

        self.Write_MFRC522(
            self.CommandReg,
            self.PCD_SoftReset
        )

        time.sleep(0.05)

        self.Write_MFRC522(self.TModeReg, 0x8D)
        self.Write_MFRC522(self.TPrescalerReg, 0x3E)
        self.Write_MFRC522(self.TReloadRegL, 30)
        self.Write_MFRC522(self.TReloadRegH, 0)

        self.Write_MFRC522(self.TxASKReg, 0x40)
        self.Write_MFRC522(self.ModeReg, 0x3D)

        self.AntennaOn()

    def AntennaOn(self):

        value = self.Read_MFRC522(self.TxControlReg)

        if (value & 0x03) != 0x03:
            self.SetBitMask(
                self.TxControlReg,
                0x03
            )

    # ---------------------------------------------------------
    # CRC
    # ---------------------------------------------------------

    def CalculateCRC(self, data):

        self.Write_MFRC522(
            self.CommandReg,
            self.PCD_Idle
        )

        self.ClearBitMask(
            self.DivIrqReg,
            0x04
        )

        self.SetBitMask(
            self.FIFOLevelReg,
            0x80
        )

        for byte in data:
            self.Write_MFRC522(
                self.FIFODataReg,
                byte
            )

        self.Write_MFRC522(
            self.CommandReg,
            self.PCD_CalcCRC
        )

        for _ in range(255):

            irq = self.Read_MFRC522(
                self.DivIrqReg
            )

            if irq & 0x04:
                break

            if irq & 0x02:
                return self.MI_ERR

            time.sleep(0.001)

        result = [
            self.Read_MFRC522(self.CRCResultRegL),
            self.Read_MFRC522(self.CRCResultRegH)
        ]

        return result

    # ---------------------------------------------------------
    # Comunicação com cartão
    # ---------------------------------------------------------

    def MFRC522_ToCard(self, command, send_data):

        back_data = []
        back_len = 0

        irq_en = 0x00
        wait_irq = 0x00

        if command == self.PCD_MFAuthent:
            irq_en = 0x12
            wait_irq = 0x10

        elif command == self.PCD_Transceive:
            irq_en = 0x77
            wait_irq = 0x30

        self.Write_MFRC522(
            self.ComIEnReg,
            irq_en | 0x80
        )

        self.ClearBitMask(
            self.ComIrqReg,
            0x80
        )

        self.SetBitMask(
            self.FIFOLevelReg,
            0x80
        )

        self.Write_MFRC522(
            self.CommandReg,
            self.PCD_Idle
        )

        for byte in send_data:
            self.Write_MFRC522(
                self.FIFODataReg,
                byte
            )

        self.Write_MFRC522(
            self.CommandReg,
            command
        )

        if command == self.PCD_Transceive:
            self.SetBitMask(
                self.BitFramingReg,
                0x80
            )

        for _ in range(2000):

            irq = self.Read_MFRC522(
                self.ComIrqReg
            )

            if irq & wait_irq:
                break

            if irq & 0x01:
                break

            time.sleep(0.001)

        self.ClearBitMask(
            self.BitFramingReg,
            0x80
        )

        if command == self.PCD_MFAuthent:

            status2 = self.Read_MFRC522(
                self.Status2Reg
            )

            if status2 & 0x08:
                return self.MI_OK, back_data, back_len

            return self.MI_ERR, back_data, back_len

        if self.Read_MFRC522(self.ErrorReg) & 0x1B:
            return self.MI_ERR, back_data, back_len

        fifo_level = self.Read_MFRC522(
            self.FIFOLevelReg
        )

        control = self.Read_MFRC522(
            self.ControlReg
        )

        if fifo_level == 0:
            fifo_level = 1

        if fifo_level > self.MAX_LEN:
            fifo_level = self.MAX_LEN

        for _ in range(fifo_level):
            back_data.append(
                self.Read_MFRC522(
                    self.FIFODataReg
                )
            )

        back_len = control & 0x07

        return self.MI_OK, back_data, back_len

    # ---------------------------------------------------------
    # Request
    # ---------------------------------------------------------

    def MFRC522_Request(self, reqMode):

        self.Write_MFRC522(
            self.BitFramingReg,
            0x07
        )

        status, back_data, back_bits = self.MFRC522_ToCard(
            self.PCD_Transceive,
            [reqMode]
        )

        if status != self.MI_OK or back_bits != 0x10:
            return self.MI_ERR, None

        return self.MI_OK, back_data

    # ---------------------------------------------------------
    # Anticollision
    # ---------------------------------------------------------

    def MFRC522_Anticoll(self):

        self.Write_MFRC522(
            self.BitFramingReg,
            0x00
        )

        status, back_data, back_bits = self.MFRC522_ToCard(
            self.PCD_Transceive,
            [
                self.PICC_ANTICOLL,
                0x20
            ]
        )

        if status != self.MI_OK:
            return self.MI_ERR, None

        if len(back_data) < 5:
            return self.MI_ERR, None

        uid = back_data[:5]

        checksum = 0

        for byte in uid[:4]:
            checksum ^= byte

        if checksum != uid[4]:
            return self.MI_ERR, None

        return self.MI_OK, uid

    # ---------------------------------------------------------
    # Select
    # ---------------------------------------------------------

    def MFRC522_SelectTag(self, uid):

        if len(uid) < 5:
            return self.MI_ERR

        buffer = [
            self.PICC_SElECTTAG,
            0x70
        ]

        buffer.extend(uid[:5])

        crc = self.CalculateCRC(buffer)

        if not isinstance(crc, list):
            return self.MI_ERR

        buffer.extend(crc)

        status, back_data, back_bits = self.MFRC522_ToCard(
            self.PCD_Transceive,
            buffer
        )

        if status != self.MI_OK:
            return self.MI_ERR

        if len(back_data) != 3:
            return self.MI_ERR

        return self.MI_OK

    # ---------------------------------------------------------
    # Authentication
    # ---------------------------------------------------------

    def MFRC522_Auth(
        self,
        authMode,
        BlockAddr,
        SectKey,
        serNum
    ):

        if len(SectKey) != 6:
            return self.MI_ERR

        if len(serNum) < 4:
            return self.MI_ERR

        send_data = [
            authMode,
            BlockAddr
        ]

        send_data.extend(SectKey)
        send_data.extend(serNum[:4])

        status, _, _ = self.MFRC522_ToCard(
            self.PCD_MFAuthent,
            send_data
        )

        if status == self.MI_OK:
            return self.MI_OK

        return self.MI_ERR

    # ---------------------------------------------------------
    # Read
    # ---------------------------------------------------------

    def MFRC522_Read(self, block_addr):

        buffer = [
            self.PICC_READ,
            block_addr
        ]

        crc = self.CalculateCRC(buffer)

        if not isinstance(crc, list):
            return self.MI_ERR, None

        buffer.extend(crc)

        status, back_data, _ = self.MFRC522_ToCard(
            self.PCD_Transceive,
            buffer
        )

        if status != self.MI_OK:
            return self.MI_ERR, None

        if len(back_data) < 16:
            return self.MI_ERR, None

        return self.MI_OK, back_data[:16]

    # ---------------------------------------------------------
    # Write
    # ---------------------------------------------------------

    def MFRC522_Write(self, BlockAddr, writeData):

        if len(writeData) != 16:
            return self.MI_ERR

        buffer = [
            self.PICC_WRITE,
            BlockAddr
        ]

        crc = self.CalculateCRC(buffer)

        if not isinstance(crc, list):
            return self.MI_ERR

        buffer.extend(crc)

        status, back_data, _ = self.MFRC522_ToCard(
            self.PCD_Transceive,
            buffer
        )

        if status != self.MI_OK:
            return self.MI_ERR

        if len(back_data) != 1:
            return self.MI_ERR

        if (back_data[0] & 0x0F) != 0x0A:
            return self.MI_ERR

        buffer = list(writeData)

        crc = self.CalculateCRC(buffer)

        if not isinstance(crc, list):
            return self.MI_ERR

        buffer.extend(crc)

        status, back_data, _ = self.MFRC522_ToCard(
            self.PCD_Transceive,
            buffer
        )

        if status != self.MI_OK:
            return self.MI_ERR

        if len(back_data) != 1:
            return self.MI_ERR

        if (back_data[0] & 0x0F) != 0x0A:
            return self.MI_ERR

        return self.MI_OK

    # ---------------------------------------------------------
    # Stop authentication
    # ---------------------------------------------------------

    def MFRC522_StopCrypto1(self):

        self.ClearBitMask(
            self.Status2Reg,
            0x08
        )

    # ---------------------------------------------------------
    # Halt (novo)
    # ---------------------------------------------------------

    def MFRC522_Halt(self):
        buffer = [self.PICC_HALT, 0x00]
        crc = self.CalculateCRC(buffer)

        if isinstance(crc, list):
            buffer.extend(crc)
            self.MFRC522_ToCard(self.PCD_Transceive, buffer)

    # ---------------------------------------------------------
    # Fechar SPI
    # ---------------------------------------------------------

    def close(self):

        if self.spi:
            self.spi.close()
            self.spi = None

        GPIO.output(self.RST_PIN, GPIO.LOW)
        GPIO.cleanup(self.RST_PIN)