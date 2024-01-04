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

from dataclasses import dataclass
from typing import List

@dataclass
class DeviceDTO:
    id: int
    device_id: str
    name: str
    callsign: str
    class_of_station: str
    mode: str
    transmit_power: str
    modulation_type: str
    band: str
    frequency_start: str
    frequency_stop: str
    location_name: str
    other_device_info: str
    system_id: int

@dataclass
class SystemDTO:
    id: int
    system_id: str
    name: str
    email: str
    postal_code: str
    industry: str
    license_type: str
    license_subtype: str
    license_status: str
    license_number: str
    license_date_of_effect: str
    license_date_of_expiry: str
    other_info: str
    devices: List[DeviceDTO]
