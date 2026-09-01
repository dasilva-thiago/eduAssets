#!/usr/bin/env python3
"""Geração e reprodução de tons de notificação via ALSA (aplay).

Não depende de nenhum arquivo de áudio externo: os tons são sintetizados
em memória (onda senoidal) e tocados via `aplay`, presente por padrão em
praticamente qualquer instalação Linux (Raspberry Pi OS e Ubuntu inclusos).

Falhas de áudio (sem placa de som configurada, saída errada, etc.) nunca
devem derrubar o serviço de login — por isso todas as falhas aqui são
silenciosas.
"""
import io
import math
import os
import shutil
import struct
import subprocess
import wave

SAMPLE_RATE = 44100
_APLAY_DISPONIVEL = shutil.which("aplay") is not None

_SOUND_DEVICE = os.environ.get("RFID_SOUND_DEVICE")


def _gerar_tom(frequencia: float, duracao_ms: int, volume: float = 0.5) -> bytes:
    n_amostras = int(SAMPLE_RATE * duracao_ms / 1000)
    buffer = io.BytesIO()

    with wave.open(buffer, "wb") as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2) 
        wav.setframerate(SAMPLE_RATE)

        for i in range(n_amostras):
            t = i / SAMPLE_RATE
            fade = min(1.0, (n_amostras - i) / (n_amostras * 0.15))
            amostra = int(volume * fade * 32767 * math.sin(2 * math.pi * frequencia * t))
            wav.writeframesraw(struct.pack("<h", amostra))

    return buffer.getvalue()


def _tocar(wav_bytes: bytes) -> None:
    if not _APLAY_DISPONIVEL:
        return

    cmd = ["aplay", "-q"]
    if _SOUND_DEVICE:
        cmd += ["-D", _SOUND_DEVICE]
    cmd.append("-")

    try:
        subprocess.run(
            cmd,
            input=wav_bytes,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            timeout=3,
        )
    except (subprocess.SubprocessError, OSError):
        pass  # falha ao tocar som nunca deve interromper o fluxo de login


# Tons pré-gerados uma única vez na importação do módulo
_TOM_DETECCAO = _gerar_tom(1046.5, 90)   # bipe curto e agudo — "cartão detectado"
_TOM_SUCESSO = _gerar_tom(1318.5, 140)   # tom agudo e mais longo — "login autorizado"
_TOM_ERRO = _gerar_tom(220, 260)         # tom grave — "cartão não reconhecido / erro"


def tocar_deteccao() -> None:
    _tocar(_TOM_DETECCAO)


def tocar_sucesso() -> None:
    _tocar(_TOM_SUCESSO)


def tocar_erro() -> None:
    _tocar(_TOM_ERRO)