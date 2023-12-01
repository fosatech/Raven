# import socket
# import select
# import struct
# import argparse

import subprocess
import threading
import sys
import time

from webapp import socketio

class Wideband:

	def __init__(self, rtl_power_options):

		# self.SET_FREQUENCY = 0x01

		self.top_Freq = {
			"freq" : 0,
			"dBm" : "0"
		}

		self.opts = rtl_power_options

		self.freq_options = "{}M:{}M:{}".format(rtl_power_options['freqStart'], rtl_power_options['freqEnd'], rtl_power_options['fftBin'])

		self.power_args = ["rtl_power", "-f", self.freq_options, "-g", self.opts['gain'], "-i", "2", "-c", "0.20"]

		a = []

		self.input_list = []
		self.channel = {}

		self.keep_running = True


	def main(self):

		"""Starts the rtl_power process."""
		
		self.async_stream_data()

	def async_stream_data(self):

		"""Starts the rtl_power process"""

		get_data = threading.Thread(target=self.stream_data, name="Inject")
		get_data.start()


	def kill_all(self):
		self.power_process.kill()


	def stream_data(self):

		"""This function contains all of the logic for selecting peaks from the rtl_power input."""

		print(self.power_args)
		self.power_process = subprocess.Popen(self.power_args, stdout=subprocess.PIPE)
		print("[*] New rtl_power instance started")

		low_freq = 0
		full_scan = []

		while self.keep_running:
			output = self.power_process.stdout.readline()
			if self.power_process.poll() is not None:
				break

			if output:
				wideband_out = output.decode().split(', ')

				# Sets lowest frequency on the first pass
				if low_freq == 0:
					low_freq = wideband_out[2]
					full_scan += wideband_out[6:]

				elif low_freq < wideband_out[2]:
					full_scan += wideband_out[6:]

				else:
					socketio.emit('new_data', {'data': full_scan})
					full_scan = []
					full_scan += wideband_out[6:]

			pass

		print("[!] Current rtl_power instance terminated")

	def stop_data_stream(self):
		self.power_process.terminate()
		self.keep_running = False

		# FIX need to add actuall error handling and waiting till process is closed
		time.sleep(5)


if __name__ == '__main__':

		wb = Wideband('-f 460M:465M:200k')
		try:
			wb.main()
		except (Exception, KeyboardInterrupt):
			wb.kill_all()
			print("[!] Interrupt - Stopping server")
			sys.exit(1)