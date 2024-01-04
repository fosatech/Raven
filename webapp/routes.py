from . import app, socketio, db
from .rtl_power_util import Wideband, data_queue
from .rtl_tcp_server import Server, Forward
from flask import render_template, request, jsonify, send_from_directory
from .databaseDTO import SystemDTO, DeviceDTO
from webapp.models import *
from dataclasses import asdict

import threading
import subprocess
import time
import requests
import json


current_wideband = None
current_server = {}

w_socket = None


# Well, what did you expect?
@app.route('/')
@app.route('/index')
def index():
	return "https://www.youtube.com/watch?v=dQw4w9WgXcQ"


# Main scan page
@app.route('/rtl_data')
def rtl_data():
	return render_template('rtl_data.html')


# POST method for starting backend wideband instances
@app.route("/start_scan", methods=["POST"])
def start_scan():

	global current_wideband
	
	data = request.json
	settings = data.get("rtlSettings")
	
	# Stop any running wideband instance
	if current_wideband:
		current_wideband.kill_all()
		current_wideband.stop_data_stream()
		current_wideband = None
		print("[!] Killed Wideband")

	if settings['ongoingScan'] is False:
		current_wideband = Wideband(settings)
		current_wideband.async_stream_data()
		
	return jsonify({"status": "success"})


# POST method for starting an RTL_TCP instnace
@app.route("/rtl_tcp_start", methods=["POST"])
def rtl_tcp_start():

	global current_server

	rtl_tcp_data = request.json
	tcp_settings = rtl_tcp_data.get("tcpSettings")
	serverID = tcp_settings['serverID']

	rtl_tcp_options = [tcp_settings['rtlServerIP'], tcp_settings['rtlServerPort'], tcp_settings['deviceID'], tcp_settings['rtlClientPort']]

	print(current_server) # REMOVE or add debugging

	if serverID in current_server:
		current_server[serverID].kill_all()
		current_server.pop(serverID)
		print("[*] Killed tcp server #" + serverID)

	if tcp_settings['activeTCPServer'] is False:
		current_server[serverID] = Server(rtl_tcp_options)
		current_server[serverID].async_server_start()

		return jsonify({"status": "success"})
	else:
		return jsonify({"status": "tcp server not started!"})


# POST Method for selecting a center frequency for RTL_TCP
@app.route("/rtl_tcp_frequency", methods=["POST"])
def rtl_tcp_frequency():

	global current_server

	frequency_data = request.json
	set_frequency = frequency_data.get('changeRtlFreq')
	

	# print(set_frequency['frequency'])
	# print(high_freq, low_freq)

	

	serverID = str(set_frequency['serverID'])

	if serverID in current_server:
		if current_server[serverID]:
			current_server[serverID].send_command(set_frequency['frequency'])
			return jsonify({"status": "Success"})
	else:
		return jsonify({"status": "No current instance"})


@app.route('/configure_api', methods=["POST"])
def confit_api():
	api_config = request.json

	API_KEY = api_config["apiKey"]
	LOCATION = api_config["location"]

	config_data = {
		"auth": API_KEY,
		"location": LOCATION
	}

	with open('VAR.conf', 'w') as api_conf_file:
		api_conf_file.write(json.dumps(config_data))

	return jsonify({"status": "SUCCESS"})



@app.route('/olympus_getsystem', methods=["POST"])
def olympus_getsystem():
	getsystem_request_data = request.json

	low_freq = int(getsystem_request_data['startFrequency']) * 1000000
	high_freq = int(getsystem_request_data['stopFrequency']) * 1000000

	print(low_freq, high_freq)

	api_url = 'https://www.fosa-tech.com/_functions/systemInfo'

	with open('VAR.conf', 'r') as api_conf:
		config = json.load(api_conf)

	API_KEY = config['auth']
	LOCATION = config['location']

	main_headers = {
        "auth": API_KEY,
        "Content-Type": "application/json"
	}

	main_json_body = {
        "location": LOCATION,
        "distance": "60", # Change if you want, we'll add a menu option for this soon
        "frequencyStart": low_freq,
        "frequencyStop": high_freq
	}

	response = requests.post(api_url, json=main_json_body, headers=main_headers);

	api_response = {
		"status": "success",
		"apiResponse": response.json()
	}

	return jsonify(api_response)


@app.route('/remove_system', methods=['POST'])
def remove_system():
	system_info = request.json
	device_id = system_info['postData']['devices']['id']['value']
	system_id = system_info['postData']['id']['value']

	if device_id:
		delete_device(device_id)
		return ({"status": "Deleted Device"})
	elif system_id:
		delete_system(system_id)
		return ({"status": "Deleted System"})



	return ({"status": "Nothing Selected"})


def delete_device(device_id):
	device = Device.query.get(device_id)
	db.session.delete(device)
	db.session.commit()

def delete_system(system_id):
	system = System.query.get(system_id)
	db.session.delete(system)
	db.session.commit()

# POST method for adding a new SYSTEM to db
@app.route('/add_system', methods=["POST"])
def add_system():
	data = request.json
	# print(data)

	if data['type'] == 'update':
		print("SENT TO UPDATE")
		update_data(data['postData'])

	if data['type'] == 'add':
		update_data(data['postData'])

	return jsonify({"message": "System added sucessfully"}), 201

def update_data(data):

	systems = [add_system(system) for system in data]
	db.session.commit() 


def add_system(system_info):

	newSys = False
	system = None

	devices = system_info['devices']

	if system_info['id']['value']:
		system = System.query.get(system_info['id']['value'])
	elif system_info['name']['value']:
		system = System.query.filter_by(system_id=system_info['systemId']['value']).first()

		if not system:
			system = System()
			newSys = True
			print("[*] Made new system")

	if system:
		for key in system_info:
			if key != 'id' and key != 'devices':
				system_attribute = system_info[key]['python']
				attribute_value = str(system_info[key]['value'])
				# print(system_attribute, attribute_value)
				setattr(system, system_attribute, attribute_value)

		if newSys:
			db.session.add(system)

		db.session.commit()
		devices_dbs = [add_device(device, system) for device in devices]

	db.session.commit()

	return system

def add_device(device_info, system):

	newDev = False
	device = None
	
	if device_info['id']['value']:
		device = Device.query.get(device_info['id']['value'])
	elif device_info['name']['value']:
		device = Device.query.filter_by(device_id=device_info['deviceId']['value']).first()
		if not device:
			device = Device()
			newDev = True
			print("[*] Made new device")

	if device:
		for key in device_info:
			# print(key)
			if key != 'id' and key != 'systemId':
				device_attribute = device_info[key]['python']
				dev_attrib_value = str(device_info[key]['value'])
				setattr(device, device_attribute, dev_attrib_value)
			if key == 'systemId':
				if device_info[key]['value']:
					# print(device_info[key])
					device_attribute = device_info[key]['python']
					dev_attrib_value = device_info[key]['value']
					setattr(device, device_attribute, dev_attrib_value)
				else:
					# print(device_info[key])
					# print(system.id)
					device_attribute = device_info[key]['python']
					dev_attrib_value = system.id
					setattr(device, device_attribute, dev_attrib_value)

	if newDev:
		db.session.add(device)

	db.session.commit()

	return device


# GET method for retrieving system names
@app.route('/get_systems', methods=['GET'])
def get_systems():

	# systems_request = request.json
	systems = System.query.all()
	# print(systems)
	systems_dto = [
	    SystemDTO(
			id=system.id,
			system_id=system.system_id,
			name=system.name,
			email=system.email,
			postal_code=system.postal_code,
			industry=system.industry,
			license_type=system.license_type,
			license_subtype=system.license_subtype,
			license_status=system.license_status,
			license_number=system.license_number,
			license_date_of_effect=system.license_date_of_effect,
			license_date_of_expiry=system.license_date_of_expiry,
			other_info=system.other_info,
			devices=[DeviceDTO(
				id=device.id,
				device_id=device.device_id,
				name=device.name,
				callsign=device.callsign,
				class_of_station=device.class_of_station,
				mode=device.mode,
				transmit_power=device.transmit_power,
				modulation_type=device.modulation_type,
				band=device.band,
				frequency_start=device.frequency_start,
				frequency_stop=device.frequency_stop,
				location_name=device.location_name,
				other_device_info=device.other_device_info,
				system_id=device.system_id,
			) for device in system.devices]
		) for system in systems
	]
	return jsonify(systems_dto)



@app.route('/get_sigid', methods=["POST"])
def get_sigid():

	data = request.json

	if data['lowFrequency']:

		low_freq = int(data['lowFrequency'] * 1e6)
		high_freq = int(data['highFrequency'] * 1e6)

		# print(low_freq)

		api_url = 'https://www.fosa-tech.com/_functions/getSigidData'

		with open('VAR.conf', 'r') as api_conf:
			config = json.load(api_conf)

		API_KEY = config['auth']
		LOCATION = config['location']

		main_headers = {
	        "auth": API_KEY,
	        "Content-Type": "application/json"
		}

		main_json_body = {
	        "startFrequency": low_freq,
	        "stopFrequency": high_freq
		}

		api_response = requests.post(api_url, json=main_json_body, headers=main_headers);
		
		# print(api_response.json())

		response = {
			"response": api_response.json()
		}

		return jsonify(response)

	else:
		return jsonify({"ERROR": "No selected frequency"})