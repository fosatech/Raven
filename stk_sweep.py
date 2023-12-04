import argparse
from subprocess import call

def start_server(ip, port):
	call(['gunicorn', '-k', 'eventlet', '-w', '1', '-b', f'{ip}:{port}', 'webapp:app'])

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Start the Flask server with uWSGI.')
    parser.add_argument('--ip', default='localhost', help='The IP address to bind to.')
    parser.add_argument('--port', type=int, default=5000, help='The port to bind to.')
    args = parser.parse_args()

    try:
    	start_server(args.ip, args.port)
    except Exception as e:
    	print(e)