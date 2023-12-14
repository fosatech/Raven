import subprocess
import threading
import sys
import time
import queue

from . import socketio

data_queue = queue.Queue()

class Wideband:

	def __init__(self, wideband_options):

		# self.SET_FREQUENCY = 0x01

		self.top_Freq = {
			"freq" : 0,
			"dBm" : "0"
		}

		self.wideband_options = wideband_options

		self.rtl_freq_options = "{}M:{}M:{}k".format(wideband_options['freqStart'], wideband_options['freqEnd'], wideband_options['fftBin'])
		self.hackrf_freq_options = "{}:{}".format(wideband_options['freqStart'], wideband_options['freqEnd'])

		self.rtl_power_args = ["rtl_power", "-f", self.rtl_freq_options, "-g", self.wideband_options['gain'], "-i", "2", "-c", "0.20"]
		self.hackrf_sweep_args = ["hackrf_sweep", "-f", self.hackrf_freq_options, "-l", self.wideband_options['gain'], "-w", wideband_options['fftBin'] + "000"]

		self.device_switch = {
			"hackrf": self.hackrf_sweep_args,
			"rtl-sdr": self.rtl_power_args
		}

		self.selected_device_args = self.device_switch[wideband_options['currentDevice']]

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

		self.power_process = subprocess.Popen(self.selected_device_args, stdout=subprocess.PIPE)

		low_freq = 0
		full_scan = []
		hackrf_scan = {}


		while self.keep_running:
			output = self.power_process.stdout.readline()
			if self.power_process.poll() is not None:
				break

			if output:
				if self.wideband_options['currentDevice'] == 'rtl-sdr':
					wideband_out = output.decode().split(', ')

					# Sets lowest frequency on the first pass
					if low_freq == 0:
						low_freq = int(wideband_out[2])
						full_scan += wideband_out[6:]

					elif low_freq < int(wideband_out[2]):
						full_scan += wideband_out[6:]

					else:
						socketio.emit('new_data', {'data': full_scan}, namespace='/')
						full_scan = []
						full_scan += wideband_out[6:]

				elif self.wideband_options['currentDevice'] == 'hackrf':
					wideband_out = output.decode().split(', ')
					# Sets lowest frequency on the first pass

					if low_freq == 0:
						low_freq = int(wideband_out[2])
						hackrf_scan[str(wideband_out[2])] = wideband_out[6:]

					elif low_freq < int(wideband_out[2]):
						hackrf_scan[str(wideband_out[2])] = wideband_out[6:]


					elif low_freq == int(wideband_out[2]):
						sorted_freq_keys = sorted(hackrf_scan.keys())
						full_scan = [item for key in sorted_freq_keys for item in hackrf_scan[key]]
						socketio.emit('new_data', {'data': full_scan}, namespace='/')
						full_scan = []
						hackrf_scan = {}
						hackrf_scan[str(wideband_out[2])] = wideband_out[6:]

					else:
						print("[!] Skipped scan integration")


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