# Data base models
# 
# Olympus API Schema
#
# systems: [
#     { system: {
#       id
#       name
#       email
#       postalCode
#       industry
#       license: {
#         id
#         type
#         subtype
#         status
#         number
#         dateOfEffect
#         dateOfExpiry
#       }
#       devices: [
#         {
#         id
#         callsign
#         classOfStation
#         mode
#         transmitPower
#         modulationType
#         band
#         frequencyStart
#         frequencyStop
#         locationName
#         locationCords  
# 

from webapp import db

class System(db.Model):
	id = db.Column(db.Integer, primary_key=True)
	system_id = db.Column(db.String)
	name = db.Column(db.String)
	email = db.Column(db.String)
	postal_code = db.Column(db.String)
	industry = db.Column(db.String)
	license_type = db.Column(db.String)
	license_subtype = db.Column(db.String)
	license_status = db.Column(db.String)
	license_number = db.Column(db.String)
	license_date_of_effect = db.Column(db.String)
	license_date_of_expiry = db.Column(db.String)
	other_info = db.Column(db.String)

	devices = db.relationship('Device', backref='system')

	# license_id = db.Column(db.Integer, db.ForeignKey('license.id'))
	# license = db.relationship('License', backref='system', uselist=False, foreign_keys=[license_id])

class Device(db.Model):
	id = db.Column(db.Integer, primary_key=True)
	device_id = db.Column(db.String)
	name = db.Column(db.String)
	callsign = db.Column(db.String)
	class_of_station = db.Column(db.String)
	mode = db.Column(db.String)
	transmit_power = db.Column(db.String)
	modulation_type = db.Column(db.String)
	band = db.Column(db.String)
	frequency_start = db.Column(db.String)
	frequency_stop = db.Column(db.String)
	location_name = db.Column(db.String)
	other_device_info = db.Column(db.String)
	system_id = db.Column(db.Integer, db.ForeignKey('system.id'))