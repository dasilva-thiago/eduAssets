#include <SPI.h>
#include <MFRC522.h>

#define SS_PIN 10
#define RST_PIN 9
#define BLOCK 8

MFRC522 mfrc522(SS_PIN, RST_PIN);
MFRC522::MIFARE_Key key;

byte ultimoUid[4] = {0, 0, 0, 0};
bool temUltimoUid = false;

void setup() {
  Serial.begin(115200);
  SPI.begin();
  mfrc522.PCD_Init();
  for (byte i = 0; i < 6; i++) key.keyByte[i] = 0xFF;
}

bool mesmoUid(byte *uid, byte tamanho) {
  if (!temUltimoUid || tamanho != 4) return false;
  for (byte i = 0; i < 4; i++) {
    if (uid[i] != ultimoUid[i]) return false;
  }
  return true;
}

void salvarUid(byte *uid, byte tamanho) {
  if (tamanho != 4) return;
  for (byte i = 0; i < 4; i++) ultimoUid[i] = uid[i];
  temUltimoUid = true;
}

String hexBytes(byte *buf, byte tam) {
  String s = "";
  for (byte i = 0; i < tam; i++) {
    if (buf[i] < 0x10) s += "0";
    s += String(buf[i], HEX);
  }
  return s;
}

void tentarLerEEnviar() {
  MFRC522::StatusCode status = mfrc522.PCD_Authenticate(
    MFRC522::PICC_CMD_MF_AUTH_KEY_A, BLOCK, &key, &(mfrc522.uid));

  if (status != MFRC522::STATUS_OK) {
    Serial.println("CARDERR");
    return;
  }

  byte buffer[18];
  byte tamanho = 18;
  status = mfrc522.MIFARE_Read(BLOCK, buffer, &tamanho);

  if (status != MFRC522::STATUS_OK) {
    Serial.println("CARDERR");
    return;
  }

  Serial.print("CARD:");
  Serial.println(hexBytes(buffer, 16));
}

void tentarEscrever(const String &hexPayload) {
  byte dados[16];
  for (byte i = 0; i < 16; i++) {
    dados[i] = strtoul(hexPayload.substring(i * 2, i * 2 + 2).c_str(), nullptr, 16);
  }

  MFRC522::StatusCode status = mfrc522.PCD_Authenticate(
    MFRC522::PICC_CMD_MF_AUTH_KEY_A, BLOCK, &key, &(mfrc522.uid));

  if (status != MFRC522::STATUS_OK) {
    Serial.println("WRITEERR");
    return;
  }

  status = mfrc522.MIFARE_Write(BLOCK, dados, 16);
  Serial.println(status == MFRC522::STATUS_OK ? "WRITEOK" : "WRITEERR");
}

void loop() {
  // Comando pendente do host (usado só no provisionamento)
  if (Serial.available()) {
    String linha = Serial.readStringUntil('\n');
    linha.trim();

    if (linha.startsWith("WRITE:") && linha.length() == 6 + 32) {
      unsigned long inicio = millis();
      while (millis() - inicio < 15000) {
        if (mfrc522.PICC_IsNewCardPresent() && mfrc522.PICC_ReadCardSerial()) {
          tentarEscrever(linha.substring(6));
          mfrc522.PICC_HaltA();
          mfrc522.PCD_StopCrypto1();
          break;
        }
      }
    }
  }

  // Leitura passiva contínua (usado no login normal)
  if (mfrc522.PICC_IsNewCardPresent() && mfrc522.PICC_ReadCardSerial()) {
    if (!mesmoUid(mfrc522.uid.uidByte, mfrc522.uid.size)) {
      salvarUid(mfrc522.uid.uidByte, mfrc522.uid.size);
      tentarLerEEnviar();
    }
    mfrc522.PICC_HaltA();
    mfrc522.PCD_StopCrypto1();
  } else {
    temUltimoUid = false; 
  }

  delay(100);
}