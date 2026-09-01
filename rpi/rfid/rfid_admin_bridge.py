#!/usr/bin/env python3
import os
import time
import requests
import sound
import json
import threading
import queue
from http.server import BaseHTTPRequestHandler, HTTPServer
from rfid_reader import get_reader

BLOCK = 8
BACKEND_URL = os.environ.get("EDUASSETS_BACKEND_URL", "http://localhost:3000")
BRIDGE_SECRET = os.environ.get("RFID_BRIDGE_SECRET")

if not BRIDGE_SECRET:
    raise SystemExit("RFID_BRIDGE_SECRET não definida no ambiente do serviço.")

provision_queue = queue.Queue()

class ProvisionHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/provision':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            try:
                data = json.loads(post_data)
                token = data.get('token')
                if token and len(token) == 32:
                    provision_queue.put(token)
                    self.send_response(202)
                    self.send_header('Content-type', 'application/json')
                    self.end_headers()
                    self.wfile.write(b'{"status": "queued"}')
                else:
                    self.send_response(400)
                    self.end_headers()
            except json.JSONDecodeError:
                self.send_response(400)
                self.end_headers()
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, format, *args):
        pass  # Oculta os logs do HTTP server no journalctl

def run_http_server():
    server = HTTPServer(('127.0.0.1', 3001), ProvisionHandler)
    server.serve_forever()

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
    print(f"Serviço RFID eduAssets iniciado (backend: {backend_nome}). Escutando na porta 3001...")

    # Inicia o servidor HTTP em uma thread separada
    threading.Thread(target=run_http_server, daemon=True).start()

    with get_reader(BLOCK) as reader:
        while True:
            # 1. Verifica se há pedido de gravação pendente (sem bloquear)
            try:
                token_hex = provision_queue.get_nowait()
                print("Iniciando modo de gravação via API...")
                token_bytes = bytes.fromhex(token_hex)
                
                # Aguarda até 30 segundos por um cartão para gravar
                ok = reader.aguardar_e_escrever_bloco(BLOCK, token_bytes, timeout_s=30.0)
                
                if ok:
                    print("Cartão gravado com sucesso.")
                    sound.tocar_sucesso()
                else:
                    print("Falha ao gravar ou timeout excedido.")
                    sound.tocar_erro()
                    
                continue # Reinicia o ciclo
            except queue.Empty:
                pass

            # 2. Leitura passiva de login (timeout curto para poder checar a fila com frequência)
            data = reader.aguardar_e_ler_bloco(BLOCK, timeout_s=1.0)
            
            if data is not None:
                sound.tocar_deteccao()
                enviar_scan(data.hex())
                time.sleep(1.5)  # debounce físico após login

if __name__ == "__main__":
    main()