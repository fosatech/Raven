import socket
import select
import struct
import threading
import argparse
import subprocess
import time
import sys
import signal

from gevent import spawn


class Forward:
    def __init__(self):
        self.forward = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

    def start(self, host, port):
        try:
            self.forward.connect((host, port))
            return self.forward
        except Exception as e:
            print(e)
            return False

    def shutdown(self):
        self.forward.close()
        print("[*] Closed at Forward")

class Server:

    def __init__(self, proxy_server_ip, proxy_server_port):

        self.SET_FREQUENCY = 0x01

        self.buffer_size = 4096
        self.delay = 0.0001

        self.client_ip = '127.0.0.1'
        self.client_port = 1234

        self.server_ip = str(proxy_server_ip)
        self.server_port = int(proxy_server_port)

        self.input_list = []
        self.channel = {}

        self.forward = None

        self.keep_running = True

        self._build_rtl_tcp()


    def server_start(self):

        """Starts the main proxy server."""

        try:
            self.server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            self.server.bind((self.server_ip, self.server_port))
            self.server.listen(200)
            self.input_list.append(self.server)

        

            case_init = True

            while self.keep_running:

                time.sleep(self.delay)
                ss = select.select
                inputready, outputready, exceptready = ss(self.input_list, [], [])

                for self.s in inputready:
                    if self.s == self.server:
                        self._on_accept()

                        break

                    self.data = self.s.recv(self.buffer_size)
                    if len(self.data) == 0:
                        self._on_close()
                        break
                    else:
                        self._on_recv()

        except Exception as e:
            print("[!] Error in server_start():: ")
            print(e)
            

    def async_server_start(self):

        self.tcp_proxy_server = threading.Thread(target=self.server_start, name="Inject")
        self.tcp_proxy_server.start()

        # spawn(self.server_start)


    def kill_all(self):

        try:
            self.keep_running = False

            if self.tcp_process:
                self.tcp_process.terminate()
                self.tcp_process.kill()
                self.tcp_process.send_signal(signal.SIGINT)
                print("[*] tcp_process killed")

            if self.server:
                self.server.shutdown(socket.SHUT_RDWR)
                self.server.close()
                print("[*] Server Closed")

            if self.forward:
                self.forward.shutdown(socket.SHUT_RDWR)
                print("[*] Forward Closed")

        except Exception as e:
            print(e)

    def _build_rtl_tcp(self):

        self.tcp_process = subprocess.Popen(['rtl_tcp', '-d', '1', '-a', str(self.client_ip), '-p', str(self.client_port)], stdout=subprocess.PIPE)


    def _on_accept(self):

        self.forward = Forward().start(self.client_ip, self.client_port)
        clientsock, clientaddr = self.server.accept()
        if self.forward:
            print(clientaddr, "has connected")
            self.input_list.append(clientsock)
            self.input_list.append(self.forward)
            self.channel[clientsock] = self.forward
            self.channel[self.forward] = clientsock
        else:
            print("Can't establish connection with remote server.",)
            print("Closing connection with client side", clientaddr)
            clientsock.close()


    def _on_close(self):

        print(self.s.getpeername(), "has disconnected")

        #remove objects from input_list
        self.input_list.remove(self.s)
        self.input_list.remove(self.channel[self.s])
        out = self.channel[self.s]

        # close the connection with client
        self.channel[out].close()  # equivalent to do self.s.close()

        # close the connection with remote server
        self.channel[self.s].close()

        # delete both objects from channel dict
        del self.channel[out]
        del self.channel[self.s]


    def _on_recv(self):

        self.channel[self.s].send(self.data)
        

    def send_command(self, param):

        cmd = struct.pack(">BI", self.SET_FREQUENCY, param)
        print("[*] Sent")
        self.forward.send(cmd)


if __name__ == '__main__':

        # this is the IP:port that the external SDR software will conenct to.
        # server = Server()
        try:
            # server.main()
            print("whoops")
        except (Exception, KeyboardInterrupt):
            server.kill_all()
            print("[!] Interrupt - Stopping server")
            sys.exit(1)
